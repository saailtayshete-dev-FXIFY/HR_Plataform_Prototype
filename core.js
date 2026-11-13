/* Cobalt HR — core: state, helpers, router, UI primitives */
const STORE_KEY = 'cobalt-hr-demo-v3';
let DB = (function load(){
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) { const d = JSON.parse(raw); if (d && d.employees) return d; } } catch (e) {}
  return JSON.parse(JSON.stringify(window.HR_SEED));
})();
/* keep saved demo data in step with the integrations the prototype offers */
DB.integrations = DB.integrations.filter(i => window.HR_SEED.integrations.some(x => x.id === i.id));
DB.documents.forEach(d => { if (/^Relieving letter/.test(d.name)) d.category = 'Employment'; });
function save(){ try { localStorage.setItem(STORE_KEY, JSON.stringify(DB)); } catch (e) {} }
function resetDemo(){ try { localStorage.removeItem(STORE_KEY); } catch (e) {} DB = JSON.parse(JSON.stringify(window.HR_SEED)); UI.role = 'admin'; render(); toast('Demo data reset to the original sample.'); }

const PERSONAS = {
  admin:    { emp:'E002', label:'Priya Nair · HR admin' },
  manager:  { emp:'E007', label:'Kabir Malhotra · Manager' },
  employee: { emp:'E010', label:'Ishita Bose · Employee' },
  finance:  { emp:'E006', label:'Sana Qureshi · Finance' }
};
const UI = { role:'admin', tab:{}, filter:{}, view:'dashboard' };
try { const r = localStorage.getItem(STORE_KEY + ':role'); if (r && PERSONAS[r]) UI.role = r; } catch (e) {}
const me = () => emp(PERSONAS[UI.role].emp);
const isAdmin = () => UI.role === 'admin';
const isMgr = () => UI.role === 'manager';
const isFin = () => UI.role === 'finance';
const isEmp = () => UI.role === 'employee';

/* ---------- lookups ---------- */
const emp = id => DB.employees.find(e => e.id === id);
const dept = id => DB.depts.find(d => d.id === id) || { name:id, color:'#1f5fd6' };
const reportsOf = id => DB.employees.filter(e => e.managerId === id);
function allReports(id){ const out = []; const walk = m => reportsOf(m).forEach(r => { out.push(r); walk(r.id); }); walk(id); return out; }
/* people the current persona may act on */
function scopePeople(){
  if (isAdmin()) return DB.employees;
  if (isMgr()) return allReports(me().id);
  return [me()];
}
const activeEmployees = () => DB.employees.filter(e => e.status !== 'Exited');

/* ---------- formatting ---------- */
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const parseD = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const isoD = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const TODAY = () => parseD(DB.today);
const addD = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fd = s => { if (!s) return '—'; const d = parseD(s.slice(0,10)); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const fds = s => { if (!s) return '—'; const d = parseD(s.slice(0,10)); return d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const daysBetween = (a, b) => Math.round((parseD(b) - parseD(a)) / 86400000);
const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
const lakh = n => '₹' + (n >= 100 ? (n/100).toFixed(2) + ' Cr' : n.toFixed(1) + ' L');
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const tenure = j => { const m = Math.max(0, (TODAY() - parseD(j)) / (86400000 * 30.44)); return m < 12 ? Math.round(m) + ' mo' : (m / 12).toFixed(1) + ' yrs'; };
const initials = n => n.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
const avColors = ['#1f5fd6','#123f94','#3a78dc','#2f5d9e','#4a6fa5','#0e3478','#5579b8','#1b4fb0'];
const avColor = id => avColors[parseInt(id.replace(/\D/g,''), 10) % avColors.length];
const av = (e, cls = '') => e ? `<span class="av ${cls}" style="background:${avColor(e.id)}">${esc(initials(e.name))}</span>` : `<span class="av ${cls}" style="background:var(--ink-3)">?</span>`;
const personCell = (e, sub) => e ? `<div class="person">${av(e)}<div style="min-width:0"><div class="nm">${esc(e.name)}</div><div class="rl">${esc(sub != null ? sub : e.title)}</div></div></div>` : '<span class="muted">Unassigned</span>';
const pill = (txt, kind = '') => `<span class="pill ${kind}">${esc(txt)}</span>`;
const statusKind = s => ({ Approved:'good', Active:'good', Done:'good', Submitted:'good', Completed:'good', Paid:'good', 'On track':'good', Hired:'good', Present:'good', Good:'good', Open:'blue', Scheduled:'blue', 'In progress':'blue', 'Manager approved':'blue', 'Finance approved':'blue', Onboarding:'blue', Offer:'blue', Pending:'warn', 'At risk':'warn', 'Not started':'warn', Late:'warn', 'Notice period':'warn', 'Due for refresh':'warn', 'On leave':'warn', Draft:'', Rejected:'bad', Absent:'bad', 'Off track':'bad', Closed:'', 'In stock':'blue' }[s] || '');
const sp = s => pill(s, statusKind(s));
const barH = (v, kind = '') => `<div class="bar ${kind}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></div>`;
const progKind = p => p >= 70 ? 'good' : p >= 40 ? '' : 'warn';

/* ---------- icons ---------- */
const IC = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  me:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.2a5 5 0 0 1 5.5 5.8"/>',
  org:'<rect x="9" y="3" width="6" height="5" rx="1"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/>',
  flag:'<path d="M4 21V4h12l-2 4 2 4H4"/>',
  exit:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  doc:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  cal:'<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  shift:'<path d="M3 7h13l-3-3M21 17H8l3 3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
  chat:'<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/>',
  users2:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
  pulse:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  award:'<circle cx="12" cy="9" r="6"/><path d="M8.5 14 7 22l5-3 5 3-1.5-8"/>',
  mega:'<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8"/>',
  book:'<path d="M4 4h6a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h7z"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  wallet:'<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>',
  laptop:'<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M2 20h20"/>',
  brief:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  rupee:'<path d="M6 4h12M6 9h12M14 20 7 13h2a4 4 0 0 0 0-9"/>',
  chart:'<path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/>',
  plug:'<path d="M9 2v6M15 2v6M7 8h10v4a5 5 0 0 1-10 0zM12 17v5"/>',
  log:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  check:'<path d="m5 12 5 5L20 7"/>',
  copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  up:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
};
const icon = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ''}</svg>`;

/* ---------- views registry ---------- */
const VIEWS = {};
const NAV = [
  { label:'Overview', items:['dashboard','inbox','myspace','announcements'] },
  { label:'People', items:['directory','org','onboarding','offboarding','documents'] },
  { label:'Time', items:['leave','attendance','shifts'] },
  { label:'Performance', items:['goals','reviews','feedback'] },
  { label:'Growth', items:['learning','skills'] },
  { label:'Operations', items:['expenses','assets','hiring','compensation'] },
  { label:'Insights', items:['analytics'] },
  { label:'Admin', items:['access','integrations','audit','settings'] }
];
function view(id, def){ VIEWS[id] = def; }
const canSee = id => { const v = VIEWS[id]; return v && (!v.roles || v.roles.includes(UI.role)); };

/* ---------- router & render ---------- */
function currentView(){ const h = (location.hash || '').replace('#',''); return VIEWS[h] && canSee(h) ? h : 'dashboard'; }
function go(id){ if (location.hash !== '#' + id) location.hash = id; else render(); }
function renderNav(){
  const pending = pendingApprovals().length;
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(g => {
    const items = g.items.filter(canSee);
    if (!items.length) return '';
    return `<div class="nav-group"><div class="nav-label">${g.label}</div>${items.map(id => {
      const v = VIEWS[id];
      const cnt = id === 'inbox' && pending ? `<span class="count">${pending}</span>` : '';
      return `<a href="#${id}" class="${UI.view === id ? 'active' : ''}">${icon(v.icon)}<span>${esc(v.nav || v.title)}</span>${cnt}</a>`;
    }).join('')}</div>`;
  }).join('');
  const mob = ['dashboard','myspace','leave','goals','announcements'].filter(canSee);
  document.getElementById('mobileNav').innerHTML = mob.map(id => `<a href="#${id}" class="${UI.view === id ? 'active' : ''}">${icon(VIEWS[id].icon, 20)}<span>${esc(VIEWS[id].short || VIEWS[id].nav || VIEWS[id].title)}</span></a>`).join('');
}
function pageHead(v, actions = ''){
  return `<div class="page-head"><div><div class="crumb">${esc(v.group || '')}${v.fid ? `<span class="fid">${esc(v.fid)}</span>` : ''}</div><h1>${esc(v.title)}</h1>${v.desc ? `<p>${esc(typeof v.desc === 'function' ? v.desc() : v.desc)}</p>` : ''}</div><div class="row">${actions}</div></div>`;
}
function render(){
  UI.view = currentView();
  const v = VIEWS[UI.view];
  const el = document.getElementById('content');
  let html = '';
  try { html = v.render(); } catch (err) { console.error(err); html = `<div class="page"><div class="panel panel-b">This screen hit an error: ${esc(err.message)}</div></div>`; }
  el.innerHTML = `<div class="page">${html}</div>`;
  renderNav();
  renderNotifs();
  document.getElementById('roleSel').value = UI.role;
  document.getElementById('app').classList.remove('nav-open');
  if (v.after) try { v.after(); } catch (e) { console.error(e); }
  save();
}
function rerender(){ const y = document.getElementById('content').scrollTop; render(); document.getElementById('content').scrollTop = y; }

/* ---------- action delegation ---------- */
const ACT = {};
function act(name, fn){ ACT[name] = fn; }
document.addEventListener('click', ev => {
  const t = ev.target.closest('[data-act]');
  if (!t) return;
  const fn = ACT[t.dataset.act];
  if (fn) { ev.preventDefault(); fn(t.dataset, t, ev); }
});
document.addEventListener('change', ev => {
  const t = ev.target.closest('[data-chg]');
  if (!t) return;
  const fn = ACT[t.dataset.chg];
  if (fn) fn(t.dataset, t, ev);
});
document.addEventListener('input', ev => {
  const t = ev.target.closest('[data-inp]');
  if (!t) return;
  const fn = ACT[t.dataset.inp];
  if (fn) fn(t.dataset, t, ev);
});
act('tab', d => { UI.tab[d.key] = d.val; rerender(); });
act('go', d => go(d.view));
act('person', d => openProfile(d.id));
act('close', () => closeOverlay());

/* ---------- overlays ---------- */
function openDrawer(html){ document.getElementById('overlayRoot').innerHTML = `<div class="overlay" data-overlay><div class="drawer" role="dialog" aria-modal="true">${html}</div></div>`; bindOverlay(); }
function openModal(title, body, foot = ''){
  document.getElementById('overlayRoot').innerHTML = `<div class="overlay center" data-overlay><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="m-head"><h3>${esc(title)}</h3><button class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button></div><div class="m-body">${body}</div>${foot ? `<div class="m-foot">${foot}</div>` : ''}</div></div>`;
  bindOverlay();
  const f = document.querySelector('.modal input, .modal select, .modal textarea'); if (f) f.focus();
}
function bindOverlay(){ const o = document.querySelector('[data-overlay]'); o.addEventListener('mousedown', e => { if (e.target === o) closeOverlay(); }); }
function closeOverlay(){ document.getElementById('overlayRoot').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeOverlay(); hideNotif(); } });
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.getElementById('toasts').appendChild(t); setTimeout(() => t.remove(), 3200); }
const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };

/* ---------- audit + notifications ---------- */
function log(action, target){
  const now = new Date();
  DB.audit.unshift({ id:'AU' + Date.now().toString().slice(-6), at: DB.today + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0'), who: me().id, action, target, ip:'10.12.4.' + (20 + Object.keys(PERSONAS).indexOf(UI.role)) });
}
function notify(to, text, link){ DB.notifications.unshift({ id:'N' + Date.now() + Math.random().toString(36).slice(2,5), to, text, link, at: DB.today, read:false }); }
function myNotifs(){
  const mine = DB.notifications.filter(n => n.to === me().id);
  const sys = [];
  const pa = pendingApprovals();
  if (pa.length) sys.push({ id:'sys-ap', text: pa.length + ' request' + (pa.length > 1 ? 's' : '') + ' waiting for your approval', link:'inbox', read:false, sys:true });
  const myRev = DB.reviews.find(r => r.cycle === 'RC2' && r.reviewer === me().id && r.status !== 'Submitted');
  if (myRev) sys.push({ id:'sys-rev', text:'You have reviews to complete in H1 FY27 Performance Review (due 20 Nov)', link:'reviews', read:false, sys:true });
  return sys.concat(mine);
}
function renderNotifs(){
  const list = myNotifs();
  document.getElementById('notifDot').hidden = !list.some(n => !n.read);
  const p = document.getElementById('notifPanel');
  p.innerHTML = `<div class="panel-h"><h3>Notifications</h3><button class="btn ghost sm" data-act="readAll">Mark all read</button></div>` + (list.length ? list.map(n => `<div class="list-item" style="cursor:pointer" data-act="notifGo" data-link="${n.link || ''}" data-id="${n.id}"><span style="width:8px;height:8px;border-radius:50%;margin-top:7px;flex:none;background:${n.read ? 'transparent' : 'var(--blue)'}"></span><div class="grow small">${esc(n.text)}</div></div>`).join('') : '<div class="empty">You’re all caught up.</div>');
}
function hideNotif(){ document.getElementById('notifPanel').hidden = true; }
act('notifGo', d => { const n = DB.notifications.find(x => x.id === d.id); if (n) n.read = true; hideNotif(); if (d.link) go(d.link); else render(); });
act('readAll', () => { DB.notifications.filter(n => n.to === me().id).forEach(n => n.read = true); renderNotifs(); save(); });

/* ---------- approvals (shared by inbox, dashboard, nav badge) ---------- */
function pendingApprovals(){
  const out = [];
  const canApprove = e => isAdmin() ? true : isMgr() ? e.managerId === me().id || allReports(me().id).some(r => r.id === e.id) : false;
  DB.leaves.filter(l => l.status === 'Pending').forEach(l => { const e = emp(l.emp); if (e && canApprove(e) && e.id !== me().id) out.push({ kind:'leave', id:l.id, e, item:l }); });
  DB.expenses.forEach(x => {
    const e = emp(x.emp); if (!e) return;
    if (x.status === 'Submitted' && canApprove(e) && e.id !== me().id) out.push({ kind:'expense', id:x.id, e, item:x });
    if (x.status === 'Manager approved' && isFin()) out.push({ kind:'expense', id:x.id, e, item:x });
  });
  DB.swapRequests.filter(s => s.status === 'Pending').forEach(s => { const e = emp(s.from); if (e && (isAdmin() || (isMgr() && canApprove(e)))) out.push({ kind:'swap', id:s.id, e, item:s }); });
  /* goal and progress changes made by employees wait for their manager (or HR) */
  DB.goals.filter(g => g.pending).forEach(g => { const e = emp(g.emp); if (e && canApprove(e) && e.id !== me().id) out.push({ kind:'goal', id:g.id, e, item:g }); });
  return out;
}

/* ---------- charts (SVG, single-hue, hover tooltips) ---------- */
const tipEl = () => document.getElementById('tip');
document.addEventListener('mousemove', e => {
  const t = e.target.closest && e.target.closest('[data-tip]');
  const el = tipEl();
  if (!t) { el.hidden = true; return; }
  el.textContent = t.getAttribute('data-tip'); el.hidden = false;
  const x = Math.min(e.clientX + 12, window.innerWidth - el.offsetWidth - 8);
  el.style.left = x + 'px'; el.style.top = (e.clientY - 34) + 'px';
});
function niceMax(v){ if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; }
function barChart(data, opt = {}){
  // data: [{label, value, tip?, color?}]
  const W = opt.w || 560, H = opt.h || 200, pl = 34, pr = 8, pt = 12, pb = 26;
  const max = opt.max || niceMax(Math.max(...data.map(d => d.value), 1));
  const iw = W - pl - pr, ih = H - pt - pb, bw = iw / data.length;
  const ticks = 4;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Bar chart')}">`;
  for (let i = 0; i <= ticks; i++) { const y = pt + ih - ih * i / ticks; const v = max * i / ticks; s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${opt.fmt ? opt.fmt(v) : Math.round(v * 10) / 10}</text>`; }
  data.forEach((d, i) => {
    const h = Math.max(0, ih * d.value / max), x = pl + i * bw + bw * .2, w = Math.max(2, bw * .6), y = pt + ih - h;
    const r = Math.min(4, w / 2, h);
    s += `<path d="M${x},${pt + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${pt + ih} Z" fill="${d.color || 'var(--seq-5)'}"/>`;
    s += `<rect class="hit" x="${pl + i * bw}" y="${pt}" width="${bw}" height="${ih}" data-tip="${esc(d.tip || d.label + ': ' + d.value)}"/>`;
    if (data.length <= 14 || i % 2 === 0) s += `<text x="${pl + i * bw + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  s += `<line class="axis" x1="${pl}" x2="${W - pr}" y1="${pt + ih}" y2="${pt + ih}"/></svg>`;
  return s;
}
function lineChart(data, opt = {}){
  const W = opt.w || 560, H = opt.h || 200, pl = 34, pr = 14, pt = 14, pb = 26;
  const vals = data.map(d => d.value);
  const lo = opt.min != null ? opt.min : 0;
  const max = opt.max || niceMax(Math.max(...vals));
  const iw = W - pl - pr, ih = H - pt - pb;
  const X = i => pl + (data.length === 1 ? iw / 2 : iw * i / (data.length - 1));
  const Y = v => pt + ih - ih * (v - lo) / (max - lo);
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opt.label || 'Line chart')}">`;
  for (let i = 0; i <= 4; i++) { const v = lo + (max - lo) * i / 4; const y = Y(v); s += `<line class="gridl" x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}"/><text x="${pl - 6}" y="${y + 4}" text-anchor="end">${opt.fmt ? opt.fmt(v) : Math.round(v * 10) / 10}</text>`; }
  const pts = data.map((d, i) => X(i) + ',' + Y(d.value));
  s += `<path d="M${pts[0]} L${pts.join(' L')} L${X(data.length - 1)},${pt + ih} L${X(0)},${pt + ih} Z" fill="var(--blue-soft)" opacity=".8"/>`;
  s += `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  data.forEach((d, i) => {
    const last = i === data.length - 1;
    s += `<circle cx="${X(i)}" cy="${Y(d.value)}" r="${last ? 4.5 : 3}" fill="${last ? 'var(--blue)' : 'var(--surface)'}" stroke="var(--blue)" stroke-width="2"/>`;
    s += `<rect class="hit" x="${X(i) - iw / data.length / 2}" y="${pt}" width="${iw / data.length}" height="${ih}" data-tip="${esc(d.tip || d.label + ': ' + d.value)}"/>`;
    s += `<text x="${X(i)}" y="${H - 8}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return s + '</svg>';
}
function spark(vals, w = 90, h = 26){
  if (!vals.length) return '';
  const max = Math.max(...vals, 5), min = Math.min(...vals, 1);
  const X = i => vals.length === 1 ? w / 2 : 2 + (w - 4) * i / (vals.length - 1);
  const Y = v => h - 3 - (h - 6) * (v - min) / ((max - min) || 1);
  const p = vals.map((v, i) => X(i) + ',' + Y(v)).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${p}" fill="none" stroke="var(--blue)" stroke-width="1.6" stroke-linejoin="round"/><circle cx="${X(vals.length - 1)}" cy="${Y(vals[vals.length - 1])}" r="2.5" fill="var(--blue)"/></svg>`;
}
function hbars(rows, opt = {}){
  // rows: [{label, value, max?, sub?, kind?}]
  const max = opt.max || Math.max(...rows.map(r => r.value), 1);
  return `<div class="stack" style="gap:12px">${rows.map(r => `<div data-tip="${esc(r.tip || r.label + ': ' + (opt.fmt ? opt.fmt(r.value) : r.value))}"><div class="row between small" style="margin-bottom:5px"><span>${esc(r.label)}</span><span class="num sec">${opt.fmt ? opt.fmt(r.value) : r.value}${r.sub ? ' <span class="muted">' + esc(r.sub) + '</span>' : ''}</span></div>${barH(r.value / max * 100, r.kind || '')}</div>`).join('')}</div>`;
}
const seqColor = (v, lo, hi) => { const t = Math.max(0, Math.min(1, (v - lo) / ((hi - lo) || 1))); return 'var(--seq-' + (1 + Math.round(t * 5)) + ')'; };
const seqInk = (v, lo, hi) => ((v - lo) / ((hi - lo) || 1)) > .55 ? '#fff' : 'var(--ink)';

/* ---------- shared bits ---------- */
function deptOptions(sel, all = true){ return (all ? `<option value="">All departments</option>` : '') + DB.depts.map(d => `<option value="${d.id}" ${sel === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join(''); }
function empOptions(list, sel){ return list.map(e => `<option value="${e.id}" ${sel === e.id ? 'selected' : ''}>${esc(e.name)} · ${esc(dept(e.dept).name)}</option>`).join(''); }
function tabs(key, items, def){ const cur = UI.tab[key] || def || items[0][0]; return { cur, html: `<div class="tabs" role="tablist">${items.map(([v, l]) => `<button role="tab" class="${cur === v ? 'on' : ''}" data-act="tab" data-key="${key}" data-val="${v}">${esc(l)}</button>`).join('')}</div>` }; }
function statTile(k, v, d, dir){ return `<div class="stat"><div class="k">${esc(k)}</div><div class="v">${v}</div>${d ? `<div class="d ${dir || ''}">${d}</div>` : ''}</div>`; }
function copyText(text, label){
  const ok = () => toast((label || 'Text') + ' copied to clipboard.');
  try { navigator.clipboard.writeText(text).then(ok).catch(() => fallbackCopy(text, ok)); } catch (e) { fallbackCopy(text, ok); }
}
function fallbackCopy(text, ok){ const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { toast('Select the text and copy it manually.'); } ta.remove(); }
function leaveBalance(empId, type){
  const lt = DB.leaveTypes.find(t => t.id === type);
  const used = DB.leaves.filter(l => l.emp === empId && l.type === type && (l.status === 'Approved' || l.status === 'Pending')).reduce((s, l) => s + l.days, 0);
  return { quota: lt.quota, used, left: Math.max(0, lt.quota - used) };
}
/* rule-based workload signals (no AI): heavy overtime, no recent leave, repeated absences */
function workloadSignals(e){
  const sig = [];
  const ot = DB.overtime.find(o => o.emp === e.id);
  if (ot && ot.hours > 15) sig.push(ot.hours + ' h overtime this month');
  const lastLeave = DB.leaves.filter(l => l.emp === e.id && l.status === 'Approved' && l.type !== 'WFH').map(l => l.to).sort().pop();
  if (!lastLeave || daysBetween(lastLeave, DB.today) > 90) sig.push('No leave in 90+ days');
  const abs = DB.attendance.filter(a => a.emp === e.id && a.status === 'Absent').length;
  if (abs >= 2) sig.push(abs + ' unplanned absences in 4 weeks');
  return sig;
}
