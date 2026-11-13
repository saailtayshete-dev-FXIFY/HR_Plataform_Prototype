/* Insights + Admin: analytics (M16), roles & access (B2), integrations (M17), audit log (B14), settings (incl. mobile M18) */

view('analytics', { title:'People analytics', nav:'Analytics', group:'Insights', icon:'chart', fid:'M16', roles:['admin','manager'],
  desc:'Headcount, attrition, absence and performance in one place. Every figure is computed from the records in this prototype.',
  render(){
    const t = tabs('an', [['workforce','Workforce'],['attrition','Attrition'],['absence','Absence'],['perf','Performance']]);
    const ppl = isMgr() ? allReports(me().id) : activeEmployees();
    const ids = new Set(ppl.map(e => e.id));
    let body = '';
    if (t.cur === 'workforce') {
      const byDept = DB.depts.map(d => ({ label: d.name, value: ppl.filter(e => e.dept === d.id).length })).filter(x => x.value).sort((a,b)=> b.value - a.value);
      const ten = [['< 1 yr', 0, 1], ['1–2 yrs', 1, 2], ['2–4 yrs', 2, 4], ['4–6 yrs', 4, 6], ['6+ yrs', 6, 99]].map(([l, a, b]) => ({ label:l, value: ppl.filter(e => { const y = (TODAY() - parseD(e.joinDate)) / (86400000 * 365.25); return y >= a && y < b; }).length }));
      const locs = [...new Set(ppl.map(e => e.location))].map(l => ({ label:l, value: ppl.filter(e => e.location === l).length })).sort((a,b)=> b.value - a.value);
      const types = ['Full-time','Contract','Intern'].map(x => ({ label:x, value: ppl.filter(e => e.type === x).length }));
      const avgTen = ppl.reduce((s, e) => s + (TODAY() - parseD(e.joinDate)) / (86400000 * 365.25), 0) / ppl.length;
      const spans = DB.employees.filter(e => reportsOf(e.id).length).map(e => reportsOf(e.id).length);
      body = `<div class="kpi-row" style="border-bottom:1px solid var(--line)">${statTile('Headcount', ppl.length)}${statTile('Average tenure', avgTen.toFixed(1) + ' yrs')}${statTile('Managers', spans.length, 'avg span ' + (spans.reduce((a,b)=> a + b, 0) / spans.length).toFixed(1))}${statTile('Joining this month', DB.employees.filter(e => e.status === 'Onboarding').length)}</div>
      <div class="grid g2" style="padding:16px"><div class="panel"><div class="panel-h"><h3>By department</h3></div><div class="panel-b">${hbars(byDept)}</div></div><div class="panel"><div class="panel-h"><h3>Tenure</h3></div><div class="panel-b">${barChart(ten, { h:190, label:'Tenure distribution' })}</div></div><div class="panel"><div class="panel-h"><h3>Location</h3></div><div class="panel-b">${hbars(locs)}</div></div><div class="panel"><div class="panel-h"><h3>Headcount trend</h3></div><div class="panel-b">${lineChart(DB.headcountTrend.map(([m, n]) => ({ label:m, value:n })), { min:30, max:50, h:190, label:'Headcount trend' })}</div><div class="panel-b small muted" style="padding-top:0">${types.map(x => x.label + ' ' + x.value).join(' · ')}</div></div></div>`;
    }
    if (t.cur === 'attrition') {
      /* managers see their own department only */
      const myDept = isMgr() ? me().dept : null;
      const ex = DB.exits.filter(x => !myDept || x.dept === myDept);
      const base = myDept ? DB.employees.filter(e => e.dept === myDept).length : DB.headcountTrend.slice(-6).reduce((s, x) => s + x[1], 0) / 6;
      const rate = base ? ex.length / base * 2 * 100 : 0, reg = base ? ex.filter(x => x.regretted).length / base * 2 * 100 : 0;
      const notice = DB.employees.filter(e => e.status === 'Notice period' && (!myDept || e.dept === myDept)).length;
      const reasons = [...new Set(ex.map(x => x.reason))].map(r => ({ label:r, value: ex.filter(x => x.reason === r).length }));
      const byD = DB.depts.map(d => ({ label:d.name, value: DB.exits.filter(x => x.dept === d.id).length })).filter(x => x.value);
      const strain = ex.filter(x => /Burnout|Compensation/.test(x.reason)).length;
      const right = myDept
        ? `<div class="panel"><div class="panel-h"><h3>Leavers from ${esc(dept(myDept).name)}</h3><span class="sub">Last 6 months</span></div>${ex.length ? ex.map(x => `<div class="list-item"><div class="grow small"><b style="font-weight:500">${esc(x.name)}</b><div class="muted">Left ${fd(x.date)} · ${esc(x.reason)}</div></div>${x.regretted ? pill('Regretted','bad') : pill('Not regretted','plain')}</div>`).join('') : '<div class="empty">No one has left your department in the last 6 months.</div>'}</div>`
        : `<div class="panel"><div class="panel-h"><h3>Exits by department</h3></div><div class="panel-b">${hbars(byD)}</div></div>`;
      const note = myDept
        ? (ex.length ? `${ex.length} ${ex.length === 1 ? 'person has' : 'people have'} left ${esc(dept(myDept).name)} in the last 6 months${strain ? `; ${strain} cited burnout or compensation` : ''}. Figures cover your department only.` : `Figures cover ${esc(dept(myDept).name)} only.`)
        : 'Two of five exits this half cited burnout or compensation. The burnout exit came from Customer Success, which also logs the most overtime.';
      body = `<div class="kpi-row" style="border-bottom:1px solid var(--line)">${statTile('Annualised attrition', rate.toFixed(1) + '%', ex.length + ' exit' + (ex.length === 1 ? '' : 's') + ' in 6 months' + (myDept ? ' · ' + esc(dept(myDept).name) : ''))}${statTile('Regretted attrition', reg.toFixed(1) + '%', 'target under 6%', reg > 6 ? 'down' : 'up')}${statTile('In notice period', notice)}${statTile('Avg tenure at exit', '2.3 yrs', 'placeholder')}</div>
      <div class="grid g2" style="padding:16px"><div class="panel"><div class="panel-h"><h3>Why people left</h3><span class="sub">From exit interviews</span></div><div class="panel-b">${reasons.length ? hbars(reasons) : '<div class="muted">No exits to show.</div>'}</div></div>${right}</div>
      <div class="panel-b"><div class="note small">${note}</div></div>`;
    }
    if (t.cur === 'absence') {
      const months = []; for (let i = 5; i >= 0; i--) { const d = new Date(TODAY().getFullYear(), TODAY().getMonth() - i, 1); months.push([MONTHS[d.getMonth()], d.getFullYear(), d.getMonth()]); }
      const lm = months.map(([lab, y, mo]) => ({ label: lab, value: DB.leaves.filter(l => ids.has(l.emp) && l.status === 'Approved' && l.type !== 'WFH' && parseD(l.from).getMonth() === mo && parseD(l.from).getFullYear() === y).reduce((s, l) => s + l.days, 0) }));
      const abs = DB.depts.map(d => { const a = DB.attendance.filter(x => ids.has(x.emp) && emp(x.emp).dept === d.id); return { label:d.name, value: a.length ? Math.round(a.filter(x => x.status === 'Absent').length / a.length * 1000) / 10 : 0 }; }).filter(x => x.value >= 0);
      const noLeave = ppl.filter(e => !DB.leaves.some(l => l.emp === e.id && l.status === 'Approved' && l.type !== 'WFH' && daysBetween(l.to, DB.today) <= 90));
      body = `<div class="grid g2" style="padding:16px"><div class="panel"><div class="panel-h"><h3>Leave days taken by month</h3></div><div class="panel-b">${barChart(lm, { h:190, label:'Leave days by month' })}</div></div><div class="panel"><div class="panel-h"><h3>Unplanned absence rate</h3><span class="sub">% of working days, last 4 weeks</span></div><div class="panel-b">${hbars(abs, { fmt: v => v + '%', max: 6 })}</div></div></div>
      <div class="panel-h" style="border-top:1px solid var(--line)"><h3>No leave in the last 90 days <span class="sub">· ${noLeave.length} people</span></h3></div><div class="panel-b row" style="gap:8px">${noLeave.slice(0, 24).map(e => `<button class="btn sm" data-act="person" data-id="${e.id}">${av(e, 'sm')} ${esc(e.name)}</button>`).join('')}</div>`;
    }
    if (t.cur === 'perf') {
      const r1 = DB.reviews.filter(r => r.cycle === 'RC1' && r.kind === 'Manager' && ids.has(r.emp));
      const dist = [1,2,3,4,5].map(n => ({ label: DB.ratingLabels[n].split(' ')[0], value: r1.filter(r => r.rating === n).length, tip: DB.ratingLabels[n] + ': ' + r1.filter(r => r.rating === n).length }));
      const gd = DB.depts.map(d => { const g = DB.goals.filter(x => ids.has(x.emp) && emp(x.emp).dept === d.id); return { label:d.name, value: g.length ? Math.round(g.reduce((s, x) => s + x.progress, 0) / g.length) : 0 }; }).filter(x => x.value);
      body = `<div class="grid g2" style="padding:16px"><div class="panel"><div class="panel-h"><h3>Rating distribution</h3><span class="sub">H2 FY26 manager ratings</span></div><div class="panel-b">${barChart(dist, { h:190, label:'Rating distribution' })}</div></div><div class="panel"><div class="panel-h"><h3>Goal progress by department</h3></div><div class="panel-b">${hbars(gd, { fmt: v => v + '%', max:100 })}</div></div></div>`;
    }
    return pageHead(this) + `<div class="panel">${t.html}${body}</div>`;
  }
});

view('access', { title:'Roles & access', nav:'Roles & access', group:'Admin', icon:'shield', fid:'B2', roles:['admin'],
  desc:'Who can see and change what. Use the “Viewing as” switcher in the top bar to experience each role.',
  render(){
    const t = tabs('acc', [['matrix','Permission matrix'],['users','User roles'],['security','Login & security']]);
    let body = '';
    if (t.cur === 'matrix') body = `<div class="tbl-wrap"><table><thead><tr><th>Data / action</th>${DB.roles.map(r => `<th>${esc(r.name)}</th>`).join('')}</tr></thead><tbody>${DB.permMatrix.map(row => `<tr><td>${esc(row[0])}</td>${row.slice(1).map(c => `<td>${c === 'None' ? '<span class="muted">None</span>' : pill(c, /Full|Edit|All|Approve/.test(c) ? 'blue' : 'plain')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="panel-b grid g4">${DB.roles.map(r => `<div><b style="font-size:13px">${esc(r.name)}</b><div class="small muted">${esc(r.desc)}</div></div>`).join('')}</div>`;
    if (t.cur === 'users') body = `<div class="tbl-wrap"><table><thead><tr><th>User</th><th>Department</th><th>Role</th><th>Last sign-in</th></tr></thead><tbody>${DB.employees.map((e, i) => `<tr><td>${personCell(e, e.email)}</td><td>${esc(dept(e.dept).name)}</td><td><select class="input sm" data-chg="setRole" data-id="${e.id}" aria-label="Role for ${esc(e.name)}">${DB.roles.map(r => `<option value="${r.id}" ${DB.userRoles[e.id] === r.id ? 'selected' : ''}>${esc(r.name)}</option>`).join('')}</select></td><td class="small muted">${e.status === 'Onboarding' ? 'Not yet' : fds(isoD(addD(TODAY(), -(i % 4))))}</td></tr>`).join('')}</tbody></table></div>`;
    if (t.cur === 'security') body = `<div class="panel-b stack" style="max-width:640px">${[['Single sign-on with Google Workspace', true, 'Users sign in with company Google accounts'], ['Require two-factor for HR admins and Finance', true, 'Enforced at next sign-in'], ['Mask sensitive fields (bank, PAN, Aadhaar) by default', true, 'Reveal is logged in the audit log'], ['Session timeout after 30 minutes idle', true, ''], ['Allow sign-in from personal devices', false, 'Off: company-managed devices only']].map(([l, on, s], i) => `<div class="row between" style="flex-wrap:nowrap;padding:8px 0;border-bottom:1px solid var(--line)"><div><div>${l}</div>${s ? `<div class="small muted">${s}</div>` : ''}</div><button class="switch ${on ? 'on' : ''}" data-act="toggleSw" aria-label="${esc(l)}"></button></div>`).join('')}<div class="note small">Prototype only: these switches demonstrate the settings screen. Real authentication, encryption and SSO belong in the production backend.</div></div>`;
    return pageHead(this) + `<div class="panel">${t.html}${body}</div>`;
  }
});
act('setRole', (d, el) => { DB.userRoles[d.id] = el.value; log('Granted role', emp(d.id).name + ' → ' + DB.roles.find(r => r.id === el.value).name); toast(emp(d.id).name + ' is now ' + DB.roles.find(r => r.id === el.value).name + '.'); save(); });
act('toggleSw', (d, el) => { el.classList.toggle('on'); toast('Setting ' + (el.classList.contains('on') ? 'turned on' : 'turned off') + '.'); });

view('integrations', { title:'Integrations', group:'Admin', icon:'plug', fid:'M17', roles:['admin'],
  desc:'Connect messaging, calendars, sign-in, payroll and job boards. Connections here are simulated in the prototype.',
  render(){
    const cats = [...new Set(DB.integrations.map(i => i.cat))];
    return pageHead(this) + cats.map(c => `<div class="panel"><div class="panel-h"><h3>${esc(c)}</h3></div>${DB.integrations.filter(i => i.cat === c).map(i => `<div class="integ"><span class="logo" style="background:${i.color}">${esc(i.name[0])}</span><div class="grow" style="flex:1;min-width:0"><b style="font-weight:500">${esc(i.name)}</b><div class="small muted">${esc(i.desc)}</div></div>${i.on ? pill('Connected','good') : ''}<button class="btn sm ${i.on ? '' : 'primary'}" data-act="toggleInt" data-id="${i.id}">${i.on ? 'Disconnect' : 'Connect'}</button></div>`).join('')}</div>`).join('') + `<div class="panel"><div class="panel-h"><h3>API & webhooks</h3></div><div class="panel-b stack"><div class="row between"><div><div>REST API key</div><div class="small muted">For your own scripts and BI tools</div></div><code class="mono small" style="background:var(--surface-2);padding:4px 8px;border-radius:6px">cob_test_••••••••3f9a</code></div><div class="row between"><div><div>Webhook: employee.created, leave.approved</div><div class="small muted">https://hooks.arcadia.example/hr</div></div>${pill('Active','good')}</div></div></div>`;
  }
});
act('toggleInt', d => { const i = DB.integrations.find(x => x.id === d.id); if (!i.on) { openModal('Connect ' + i.name, `<div class="sec">In production this opens ${esc(i.name)}’s sign-in and consent screen (OAuth), then returns here. For the prototype, confirm to simulate a successful connection.</div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="doConnect" data-id="${i.id}">Simulate connection</button>`); return; } i.on = false; log('Disconnected integration', i.name); toast(i.name + ' disconnected.'); rerender(); });
act('doConnect', d => { const i = DB.integrations.find(x => x.id === d.id); i.on = true; log('Connected integration', i.name); closeOverlay(); toast(i.name + ' connected.'); rerender(); });

view('audit', { title:'Audit log', group:'Admin', icon:'log', fid:'B14', roles:['admin'],
  desc:'Every sensitive view and change, with who, what, when and from where. Actions you take in this prototype are recorded here too.',
  render(){
    const f = UI.filter.audit || (UI.filter.audit = { who:'', q:'' });
    const list = DB.audit.filter(a => (!f.who || a.who === f.who) && (!f.q || (a.action + a.target).toLowerCase().includes(f.q.toLowerCase())));
    const actors = [...new Set(DB.audit.map(a => a.who))];
    return pageHead(this) + `<div class="panel"><div class="panel-h"><div class="filters"><select class="input sm" data-chg="auditWho"><option value="">Everyone</option>${actors.map(w => `<option value="${w}" ${f.who === w ? 'selected' : ''}>${esc(emp(w).name)}</option>`).join('')}</select><input class="input sm" id="audQ" placeholder="Filter actions" value="${esc(f.q)}" data-chg="auditQ"><span class="small muted">${list.length} events</span></div></div><div class="tbl-wrap"><table><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>IP</th></tr></thead><tbody>${list.slice(0, 100).map(a => `<tr><td class="num small" style="white-space:nowrap">${esc(a.at)}</td><td>${personCell(emp(a.who), DB.roles.find(r => r.id === DB.userRoles[a.who]).name)}</td><td>${esc(a.action)}</td><td class="small sec">${esc(a.target)}</td><td class="num small muted">${esc(a.ip)}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
});
act('auditWho', (d, el) => { UI.filter.audit.who = el.value; rerender(); });
act('auditQ', (d, el) => { UI.filter.audit.q = el.value; rerender(); });

view('settings', { title:'Settings', group:'Admin', icon:'gear', roles:['admin'],
  desc:'Company defaults, privacy thresholds and notifications.',
  render(){
    const s = DB.settings;
    return pageHead(this) + `<div class="grid g2">
      <div class="panel"><div class="panel-h"><h3>Company</h3></div><div class="panel-b form-grid"><div class="field full"><label for="st-c">Legal name</label><input class="input" id="st-c" value="${esc(s.company)}" data-chg="setS" data-k="company"></div><div class="field"><label for="st-h">Working hours</label><input class="input" id="st-h" value="${esc(s.workHours)}" data-chg="setS" data-k="workHours"></div><div class="field"><label for="st-w">Week starts</label><select class="input" id="st-w" data-chg="setS" data-k="weekStart"><option ${s.weekStart === 'Monday' ? 'selected' : ''}>Monday</option><option ${s.weekStart === 'Sunday' ? 'selected' : ''}>Sunday</option></select></div><div class="field"><label for="st-cur">Currency</label><select class="input" id="st-cur"><option>INR (₹)</option></select></div></div></div>
      <div class="panel"><div class="panel-h"><h3>Notifications</h3></div><div class="panel-b stack"><div class="row between" style="flex-wrap:nowrap"><div><div>Weekly email digest for managers</div><div class="small muted">Approvals, upcoming leave and team workload signals</div></div><button class="switch ${s.emailDigest ? 'on' : ''}" data-act="digest" aria-label="Weekly email digest"></button></div></div></div>
      <div class="panel"><div class="panel-h"><h3>Mobile app</h3><span class="fid tag">M18</span></div><div class="panel-b stack"><div class="sec small">Cobalt HR is responsive: on a phone the sidebar becomes a menu and a bottom bar gives one-tap access to Home, Me, Leave, Goals and News. In production it would also install to the home screen as a PWA with push notifications.</div><div class="note small">Try it: narrow your browser window, or open this page on your phone.</div></div></div>
      <div class="panel"><div class="panel-h"><h3>Demo data</h3></div><div class="panel-b stack"><div class="sec small">Changes you make are kept in this browser so you can come back to them. Reset to start fresh with the original sample company.</div><button class="btn bad" data-act="askReset">Reset demo data</button></div></div>
    </div>`;
  }
});
act('setS', (d, el) => { DB.settings[d.k] = el.value; log('Changed setting', d.k + ' → ' + el.value); toast('Saved.'); save(); });
act('digest', (d, el) => { DB.settings.emailDigest = !DB.settings.emailDigest; el.classList.toggle('on'); save(); });
act('askReset', () => openModal('Reset demo data?', '<div class="sec">This removes every change you made in this browser and restores the original sample company.</div>', `<button class="btn" data-act="close">Cancel</button><button class="btn bad" data-act="doReset">Reset</button>`));
act('doReset', () => { closeOverlay(); resetDemo(); });
