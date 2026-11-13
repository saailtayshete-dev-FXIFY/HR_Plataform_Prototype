/* Cobalt HR — boot: role switcher, search, theme, notifications, routing */
(function(){
  const sel = document.getElementById('roleSel');
  sel.innerHTML = Object.entries(PERSONAS).map(([k, p]) => `<option value="${k}">${esc(p.label)}</option>`).join('');
  sel.value = UI.role;
  sel.addEventListener('change', () => {
    UI.role = sel.value;
    try { localStorage.setItem(STORE_KEY + ':role', UI.role); } catch (e) {}
    UI.tab = {}; UI.filter = {}; UI.profileTab = 'overview';
    closeOverlay();
    if (!canSee(currentView())) go('dashboard'); else render();
    toast('Now viewing as ' + PERSONAS[UI.role].label + '.');
  });

  // global search: people + pages
  const input = document.getElementById('globalSearch');
  const box = document.getElementById('searchResults');
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { box.hidden = true; return; }
    const people = DB.employees.filter(e => (e.name + ' ' + e.title + ' ' + dept(e.dept).name).toLowerCase().includes(q)).slice(0, 6);
    const pages = Object.keys(VIEWS).filter(id => canSee(id) && (VIEWS[id].title + ' ' + (VIEWS[id].nav || '')).toLowerCase().includes(q)).slice(0, 4);
    box.innerHTML = people.map(e => `<button data-act="searchPerson" data-id="${e.id}">${av(e, 'sm')}<span><span style="display:block">${esc(e.name)}</span><span class="small muted">${esc(e.title)}</span></span></button>`).join('') + pages.map(id => `<button data-act="searchPage" data-view="${id}">${icon(VIEWS[id].icon)}<span>${esc(VIEWS[id].title)}</span></button>`).join('') || '<div class="empty small">No matches.</div>';
    box.hidden = false;
  });
  input.addEventListener('keydown', e => { if (e.key === 'Escape') { box.hidden = true; input.blur(); } if (e.key === 'Enter') { const f = box.querySelector('button'); if (f) f.click(); } });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) box.hidden = true; if (!e.target.closest('#notifPanel') && !e.target.closest('#notifBtn')) hideNotif(); });
  act('searchPerson', d => { box.hidden = true; input.value = ''; openProfile(d.id); });
  act('searchPage', d => { box.hidden = true; input.value = ''; go(d.view); });
  document.addEventListener('keydown', e => { if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); input.focus(); } });

  // theme toggle cycles light → dark → system
  const root = document.documentElement;
  try { const t = localStorage.getItem(STORE_KEY + ':theme'); if (t) root.setAttribute('data-theme', t); } catch (e) {}
  document.getElementById('themeBtn').addEventListener('click', () => {
    const cur = root.getAttribute('data-theme');
    const dark = cur ? cur === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem(STORE_KEY + ':theme', next); } catch (e) {}
  });

  document.getElementById('notifBtn').addEventListener('click', () => { const p = document.getElementById('notifPanel'); p.hidden = !p.hidden; });
  document.getElementById('menuBtn').addEventListener('click', () => document.getElementById('app').classList.toggle('nav-open'));
  document.getElementById('app').addEventListener('click', e => { if (e.target.id === 'app') document.getElementById('app').classList.remove('nav-open'); });

  window.addEventListener('hashchange', () => { closeOverlay(); render(); document.getElementById('content').scrollTop = 0; });
  render();
})();
