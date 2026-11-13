/* Overview + People modules: dashboard (B13), inbox (B7), my space (B6), directory/profiles (B1), org chart (B3), onboarding (B11), offboarding (B12), documents (B10) */

/* ---------------- Dashboard ---------------- */
view('dashboard', { title:'Dashboard', group:'Overview', icon:'home', fid:'B13', short:'Home',
  desc: () => isEmp() || isFin() ? 'Your week at a glance.' : isMgr() ? 'How your team is doing this week.' : 'Company health, approvals and the people who need attention.',
  render(){
    const v = this;
    const people = isAdmin() ? activeEmployees() : isMgr() ? allReports(me().id) : [me()];
    const ids = new Set(people.map(p => p.id));
    const todayOut = DB.leaves.filter(l => l.status === 'Approved' && l.type !== 'WFH' && l.from <= DB.today && l.to >= DB.today && ids.has(l.emp));
    const wfh = DB.leaves.filter(l => l.status === 'Approved' && l.type === 'WFH' && l.from <= DB.today && l.to >= DB.today && ids.has(l.emp));
    const pa = pendingApprovals();
    const teamGoals = DB.goals.filter(g => ids.has(g.emp));
    const atRisk = teamGoals.filter(g => g.status === 'At risk').length;
    const openRoles = DB.jobs.filter(j => j.status === 'Open').reduce((s, j) => s + j.openings, 0);
    const revAll = DB.reviews.filter(r => r.cycle === 'RC2' && ids.has(r.emp));
    const revDone = revAll.filter(r => r.status === 'Submitted').length;
    const flagged = people.filter(e => e.id !== me().id).map(e => ({ e, s: workloadSignals(e) })).filter(x => x.s.length >= 2).sort((a,b)=> b.s.length - a.s.length);

    if (isEmp() || isFin()) return pageHead(v) + (isFin() && pa.length ? `<div class="panel"><div class="panel-h"><h3>Expense claims waiting for Finance <span class="sub">· ${pa.length}</span></h3><button class="btn ghost sm" data-act="go" data-view="inbox">Open inbox</button></div>${pa.slice(0, 4).map(approvalRow).join('')}</div>` : '') + VIEWS.myspace.body();

    const actions = isAdmin() ? `<button class="btn" data-act="go" data-view="analytics">${icon('chart')} Full analytics</button><button class="btn primary" data-act="addEmployee">${icon('plus')} Add employee</button>` : `<button class="btn primary" data-act="go" data-view="inbox">${icon('inbox')} Open approvals</button>`;
    const hc = DB.headcountTrend.map(([m, n]) => ({ label:m, value:n, tip: m + ': ' + n + ' employees' }));
    const upcoming = upcomingMoments(people);
    return pageHead(v, actions) + `
    <div class="panel"><div class="kpi-row">
      ${statTile(isMgr() ? 'Team size' : 'Headcount', people.length, isMgr() ? allReports(me().id).filter(e => e.managerId === me().id).length + ' direct reports' : '+3 this quarter', 'up')}
      ${statTile('Out today', todayOut.length, wfh.length + ' working from home')}
      ${statTile('Goals at risk', atRisk, 'of ' + teamGoals.length + ' goals', atRisk ? 'down' : 'up')}
      ${statTile('Open roles', openRoles, DB.candidates.length + ' candidates in pipeline')}
    </div></div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-h"><h3>Waiting for your approval <span class="sub">· ${pa.length}</span></h3><button class="btn ghost sm" data-act="go" data-view="inbox">Open inbox</button></div>
        ${pa.length ? pa.slice(0, 5).map(approvalRow).join('') : '<div class="empty">Nothing waiting. Nice.</div>'}
      </div>
      <div class="panel"><div class="panel-h"><h3>Who’s out today</h3><span class="sub">${fd(DB.today)}</span></div>
        ${todayOut.length || wfh.length ? todayOut.concat(wfh).map(l => `<div class="list-item">${personCell(emp(l.emp), DB.leaveTypes.find(t => t.id === l.type).name + ' · until ' + fds(l.to))}</div>`).join('') : '<div class="empty">Everyone is in today.</div>'}
      </div>
    </div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-h"><h3>Workload watch</h3><span class="sub">Rule-based: 2+ of heavy overtime, no leave in 90 days, repeated absences</span></div>
        ${flagged.length ? flagged.slice(0, 6).map(x => `<div class="list-item">${av(x.e)}<div class="grow"><div class="row between"><b style="font-weight:500">${esc(x.e.name)}</b>${pill(x.s.length + ' signals', x.s.length >= 3 ? 'bad' : 'warn')}</div><div class="small muted">${x.s.map(esc).join(' · ')}</div></div><button class="btn sm" data-act="person" data-id="${x.e.id}">View profile</button></div>`).join('') : '<div class="empty">No one is showing multiple workload signals right now.</div>'}
      </div>
      <div class="panel"><div class="panel-h"><h3>H1 review progress</h3><span class="sub">Due 20 Nov</span></div><div class="panel-b stack">
        <div class="row between"><span class="v num" style="font-family:var(--f-display);font-size:28px;font-weight:700">${pct(revDone, revAll.length)}%</span><span class="small muted">${revDone} of ${revAll.length} submitted</span></div>
        ${barH(pct(revDone, revAll.length))}
        ${['Self','Manager','Peer','Upward'].map(k => { const a = revAll.filter(r => r.kind === k); return a.length ? `<div class="row between small"><span>${k}</span><span class="num sec">${a.filter(r => r.status === 'Submitted').length}/${a.length}</span></div>` : ''; }).join('')}
        <button class="btn sm" data-act="go" data-view="reviews">Go to reviews</button>
      </div></div>
    </div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-h"><h3>Headcount, last 12 months</h3><span class="sub">Active employees at month end</span></div><div class="panel-b">${lineChart(hc, { min:30, max:50, label:'Headcount trend' })}</div></div>
      <div class="panel"><div class="panel-h"><h3>Coming up</h3></div>${upcoming}</div>
    </div>`;
  }
});
function upcomingMoments(people){
  const t = TODAY(); const items = [];
  people.forEach(e => {
    const b = parseD(e.dob); const nb = new Date(t.getFullYear(), b.getMonth(), b.getDate()); if (nb < t) nb.setFullYear(t.getFullYear() + 1);
    const dd = Math.round((nb - t) / 86400000); if (dd <= 30) items.push({ d:dd, date:nb, html:`${personCell(e, 'Birthday · ' + nb.getDate() + ' ' + MONTHS[nb.getMonth()])}` });
    const j = parseD(e.joinDate); const na = new Date(t.getFullYear(), j.getMonth(), j.getDate()); if (na < t) na.setFullYear(t.getFullYear() + 1);
    const yrs = na.getFullYear() - j.getFullYear(); const da = Math.round((na - t) / 86400000);
    if (yrs >= 1 && da <= 30) items.push({ d:da, date:na, html:`${personCell(e, yrs + '-year work anniversary · ' + na.getDate() + ' ' + MONTHS[na.getMonth()])}` });
  });
  DB.holidays.forEach(h => { const dd = daysBetween(DB.today, h.date); if (dd >= 0 && dd <= 30) items.push({ d:dd, html:`<div class="person"><span class="av" style="background:var(--warn-soft);color:var(--warn)">${icon('cal', 15)}</span><div><div class="nm">${esc(h.name)}</div><div class="rl">Company holiday · ${fds(h.date)}</div></div></div>` }); });
  DB.onboarding.forEach(o => { const e = emp(o.emp); const dd = daysBetween(DB.today, e.joinDate); if (dd >= 0 && dd <= 30) items.push({ d:dd, html: personCell(e, 'Joins ' + fds(e.joinDate) + ' · ' + e.title) }); });
  items.sort((a,b)=> a.d - b.d);
  return items.length ? items.slice(0, 7).map(i => `<div class="list-item">${i.html}<span class="small muted" style="margin-left:auto;white-space:nowrap">${i.d === 0 ? 'Today' : 'in ' + i.d + 'd'}</span></div>`).join('') : '<div class="empty">Nothing in the next 30 days.</div>';
}

/* ---------------- Inbox / approvals ---------------- */
function approvalRow(a){
  let what = '', meta = '';
  if (a.kind === 'leave') { const lt = DB.leaveTypes.find(t => t.id === a.item.type); what = lt.name + ' · ' + a.item.days + ' day' + (a.item.days > 1 ? 's' : ''); meta = fds(a.item.from) + (a.item.to !== a.item.from ? ' – ' + fds(a.item.to) : '') + ' · “' + a.item.reason + '”'; }
  if (a.kind === 'expense') { what = a.item.cat + ' · ' + inr(a.item.amount); meta = a.item.desc + ' · ' + fds(a.item.date) + (a.item.status === 'Manager approved' ? ' · manager approved' : ''); }
  if (a.kind === 'swap') { what = a.item.kind === 'change' ? 'Shift change to ' + (DB.shiftTemplates.find(t => t.id === a.item.tpl) || { name:'Off' }).name : 'Shift swap with ' + emp(a.item.to).name; meta = fds(a.item.date) + ' · “' + a.item.reason + '”'; }
  if (a.kind === 'goal') { const p = a.item.pending; what = p.isNew ? 'New goal: ' + a.item.title : 'Goal update: ' + a.item.title; meta = p.isNew ? 'Due ' + fds(a.item.due) : a.item.progress + '% → ' + p.progress + '% · ' + p.status + (p.note ? ' · “' + p.note + '”' : ''); }
  return `<div class="list-item">${av(a.e)}<div class="grow"><div class="row between"><b style="font-weight:500">${esc(a.e.name)}</b><span class="tag">${{ leave:'Leave', expense:'Expense', swap:'Shift', goal:'Goal' }[a.kind]}</span></div><div class="small">${esc(what)}</div><div class="small muted">${esc(meta)}</div></div><div class="row" style="flex-wrap:nowrap"><button class="btn sm good" data-act="approve" data-kind="${a.kind}" data-id="${a.id}">${icon('check', 14)} Approve</button><button class="btn sm bad" data-act="reject" data-kind="${a.kind}" data-id="${a.id}">Decline</button></div></div>`;
}
act('approve', d => decide(d.kind, d.id, true));
act('reject', d => decide(d.kind, d.id, false));
function decide(kind, id, ok){
  if (kind === 'leave') { const l = DB.leaves.find(x => x.id === id); l.status = ok ? 'Approved' : 'Rejected'; log(ok ? 'Approved leave' : 'Declined leave', id + ' for ' + emp(l.emp).name); notify(l.emp, 'Your ' + DB.leaveTypes.find(t => t.id === l.type).name.toLowerCase() + ' for ' + fds(l.from) + ' was ' + (ok ? 'approved' : 'declined') + ' by ' + me().name + '.', 'leave'); }
  if (kind === 'expense') { const x = DB.expenses.find(e => e.id === id); x.status = ok ? (x.status === 'Manager approved' || isAdmin() && isFin() ? 'Finance approved' : isFin() ? 'Finance approved' : 'Manager approved') : 'Rejected'; log(ok ? 'Approved expense' : 'Rejected expense', id + ' · ' + inr(x.amount)); notify(x.emp, 'Expense ' + id + ' (' + inr(x.amount) + ') is now: ' + x.status + '.', 'expenses'); }
  if (kind === 'swap') { const s = DB.swapRequests.find(x => x.id === id); s.status = ok ? 'Approved' : 'Rejected';
    if (ok && s.kind === 'change') { DB.shifts = DB.shifts.filter(x => !(x.emp === s.from && x.date === s.date)); if (s.tpl !== 'OFF') DB.shifts.push({ emp:s.from, date:s.date, tpl:s.tpl }); }
    else if (ok) { const a = DB.shifts.find(x => x.emp === s.from && x.date === s.date); if (a) a.emp = s.to; }
    notify(s.from, 'Your shift ' + (s.kind === 'change' ? 'change' : 'swap') + ' request for ' + fds(s.date) + ' was ' + (ok ? 'approved' : 'declined') + '.', 'shifts');
    log(ok ? 'Approved shift request' : 'Declined shift request', id); }
  if (kind === 'goal') { const g = DB.goals.find(x => x.id === id); const p = g.pending; delete g.pending;
    if (p.isNew) { if (ok) g.status = 'On track'; else DB.goals = DB.goals.filter(x => x.id !== id); }
    else if (ok) { g.progress = p.progress; g.status = p.status; g.updates.unshift({ date: p.date, progress: p.progress, note: p.note || 'Progress updated' }); }
    notify(g.emp, (p.isNew ? 'Your new goal “' : 'Your update to “') + g.title + '” was ' + (ok ? 'approved' : 'declined') + ' by ' + me().name + '.', 'goals');
    log(ok ? 'Approved goal change' : 'Declined goal change', g.title + ' for ' + emp(g.emp).name); }
  toast(ok ? 'Approved. The requester has been notified.' : 'Declined. The requester has been notified.');
  rerender();
}
view('inbox', { title:'Approvals inbox', nav:'Approvals', group:'Overview', icon:'inbox', fid:'B7', roles:['admin','manager','finance'],
  desc:'Every request that needs your decision, in one queue. Requesters get an in-app notification when you decide.',
  render(){
    const pa = pendingApprovals();
    const t = tabs('inbox', [['all','All (' + pa.length + ')'],['leave','Leave'],['expense','Expenses'],['swap','Shifts'],['goal','Goals']]);
    const list = t.cur === 'all' ? pa : pa.filter(a => a.kind === t.cur);
    const sent = DB.notifications.slice(0, 8);
    return pageHead(this, pa.length ? `<button class="btn" data-act="approveAll">${icon('check')} Approve all leave</button>` : '') + `<div class="panel">${t.html}${list.length ? list.map(approvalRow).join('') : '<div class="empty">No requests waiting in this category.</div>'}</div>
    <div class="panel"><div class="panel-h"><h3>Recently sent notifications</h3><span class="sub">In-app notifications triggered by approvals and actions in this session</span></div>${sent.length ? sent.map(n => `<div class="list-item">${av(emp(n.to), 'sm')}<div class="grow small"><b style="font-weight:500">${esc(emp(n.to).name)}</b> · ${esc(n.text)}</div></div>`).join('') : '<div class="empty">Approve or decline something and the notification sent to the requester shows here.</div>'}</div>`;
  }
});
act('approveAll', () => { pendingApprovals().filter(a => a.kind === 'leave').forEach(a => { a.item.status = 'Approved'; notify(a.e.id, 'Your leave for ' + fds(a.item.from) + ' was approved by ' + me().name + '.', 'leave'); log('Approved leave', a.id); }); toast('All pending leave approved.'); rerender(); });

/* ---------------- My space (self-service) ---------------- */
view('myspace', { title:'My space', group:'Overview', icon:'me', fid:'B6', short:'Me',
  desc:'Your profile, balances, goals and requests in one place.',
  render(){ return pageHead(this, `<button class="btn" data-act="person" data-id="${me().id}">${icon('me')} View my profile</button>`) + this.body(); },
  body(){
    const m = me();
    const bal = ['EL','SL','CL','WFH'].map(t => ({ t, ...leaveBalance(m.id, t), name: DB.leaveTypes.find(x => x.id === t).name }));
    const myGoals = DB.goals.filter(g => g.emp === m.id);
    const myLeaves = DB.leaves.filter(l => l.emp === m.id).sort((a,b)=> b.from.localeCompare(a.from)).slice(0, 4);
    const att = DB.attendance.find(a => a.emp === m.id && a.date === DB.today);
    const monthAbs = DB.attendance.filter(a => a.emp === m.id && a.status === 'Absent' && a.date.slice(0, 7) === DB.today.slice(0, 7)).length;
    const upLeave = DB.leaves.filter(l => l.emp === m.id && l.status !== 'Rejected' && l.to >= DB.today).sort((a,b)=> a.from.localeCompare(b.from))[0];
    const myRev = DB.reviews.filter(r => r.cycle === 'RC2' && r.reviewer === m.id && r.status !== 'Submitted');
    const news = DB.announcements.slice().sort((a,b)=> (b.pinned - a.pinned) || b.date.localeCompare(a.date))[0];
    const courses = DB.enrollments.filter(x => x.emp === m.id && x.status !== 'Completed');
    return `
    <div class="grid g3">
      <div class="panel"><div class="panel-h"><h3>Today</h3><span class="sub">${DOW[TODAY().getDay()]}, ${fd(DB.today)}</span></div><div class="panel-b stack">
        <div class="row between"><span>Today</span>${sp(att ? (att.status === 'Leave' ? 'On leave' : att.status === 'Late' ? 'Present' : att.status) : 'Present')}</div>
        <div class="row between small"><span class="sec">Absences this month</span><b class="num">${monthAbs}</b></div>
        <div class="small muted">Office hours ${DB.settings.workHours}</div>
      </div></div>
      <div class="panel"><div class="panel-h"><h3>Latest announcement</h3>${news && news.pinned ? pill('Pinned','blue') : ''}</div><div class="panel-b stack">
        ${news ? `<b style="font-weight:600">${esc(news.title)}</b><div class="sec small">${esc(news.body.length > 140 ? news.body.slice(0, 140) + '…' : news.body)}</div><button class="btn sm" data-act="go" data-view="announcements">All announcements</button>` : '<div class="muted">No announcements yet.</div>'}
      </div></div>
      <div class="panel"><div class="panel-h"><h3>Next time off</h3></div><div class="panel-b stack">
        ${upLeave ? `<div class="row between"><b style="font-weight:500">${esc(DB.leaveTypes.find(t => t.id === upLeave.type).name)}</b>${sp(upLeave.status)}</div><div class="small sec">${fd(upLeave.from)}${upLeave.to !== upLeave.from ? ' – ' + fd(upLeave.to) : ''} · ${upLeave.days} day${upLeave.days > 1 ? 's' : ''}</div>` : '<div class="muted">Nothing booked.</div>'}<button class="btn sm" data-act="applyLeave">${icon('plus', 14)} Request leave</button>
      </div></div>
    </div>
    <div class="grid g-2-1">
      <div class="panel"><div class="panel-h"><h3>Leave balance</h3><button class="btn primary sm" data-act="applyLeave">${icon('plus', 14)} Request leave</button></div><div class="panel-b"><div class="grid g4">${bal.map(b => `<div class="stack" style="gap:6px"><div class="small sec">${esc(b.name)}</div><div style="font-family:var(--f-display);font-size:24px;font-weight:700" class="num">${b.left}<span class="muted" style="font-size:13px;font-weight:500"> / ${b.quota}</span></div>${barH(pct(b.left, b.quota))}</div>`).join('')}</div></div>
        <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Dates</th><th class="r">Days</th><th>Status</th></tr></thead><tbody>${myLeaves.map(l => `<tr><td>${esc(DB.leaveTypes.find(t => t.id === l.type).name)}</td><td>${fds(l.from)}${l.to !== l.from ? ' – ' + fds(l.to) : ''}</td><td class="r num">${l.days}</td><td>${sp(l.status)}</td></tr>`).join('')}</tbody></table></div>
      </div>
      <div class="panel"><div class="panel-h"><h3>To do</h3></div>
        ${myRev.map(r => `<div class="list-item">${icon('star')}<div class="grow small">${r.kind === 'Self' ? 'Write your self-review' : r.kind + ' review for ' + esc(emp(r.emp).name)}<div class="muted">Due 20 Nov</div></div><button class="btn sm" data-act="writeReview" data-id="${r.id}">Start</button></div>`).join('')}
        ${courses.slice(0, 3).map(c => { const co = DB.courses.find(x => x.id === c.course); return `<div class="list-item">${icon('book')}<div class="grow small">${esc(co.title)}<div class="muted">${co.mandatory ? 'Mandatory · due ' + fds(co.due) : 'Optional'} · ${c.progress}%</div></div><button class="btn sm" data-act="go" data-view="learning">Continue</button></div>`; }).join('')}
        ${DB.policies.filter(p => !DB.acks[p.id].includes(m.id)).map(p => `<div class="list-item">${icon('doc')}<div class="grow small">Acknowledge “${esc(p.name)}”<div class="muted">${esc(p.version)} · updated ${fds(p.updated)}</div></div><button class="btn sm" data-act="ackPolicy" data-id="${p.id}">Read & sign</button></div>`).join('')}
        ${!myRev.length && !courses.length ? '<div class="empty">All done.</div>' : ''}
      </div>
    </div>
    <div class="panel"><div class="panel-h"><h3>My goals</h3><button class="btn sm" data-act="go" data-view="goals">All goals</button></div>
      <div class="tbl-wrap"><table><thead><tr><th>Goal</th><th style="width:30%">Progress</th><th>Due</th><th>Status</th><th></th></tr></thead><tbody>${myGoals.map(g => `<tr><td>${esc(g.title)}</td><td><div class="row" style="flex-wrap:nowrap"><div style="flex:1">${barH(g.progress, progKind(g.progress))}</div><span class="num small">${g.progress}%</span></div></td><td>${fds(g.due)}</td><td>${sp(g.status)}</td><td class="r"><button class="btn sm" data-act="updateGoal" data-id="${g.id}">Update</button></td></tr>`).join('')}</tbody></table></div>
    </div>`;
  }
});

/* ---------------- Directory + profiles ---------------- */
view('directory', { title:'People directory', nav:'Directory', group:'People', icon:'people', fid:'B1',
  desc:'Everyone at Arcadia. Open a person to see their profile, time off, goals, documents and equipment.',
  render(){
    const f = UI.filter.dir || (UI.filter.dir = { q:'', dept:'', loc:'', status:'' });
    let list = DB.employees.filter(e => (!f.q || (e.name + e.title + e.email).toLowerCase().includes(f.q.toLowerCase())) && (!f.dept || e.dept === f.dept) && (!f.loc || e.location === f.loc) && (!f.status || e.status === f.status));
    const t = tabs('dirView', [['list','List'],['cards','Cards']]);
    const locs = [...new Set(DB.employees.map(e => e.location))];
    const filters = `<div class="filters"><input class="input sm" style="min-width:200px" id="dirQ" placeholder="Filter by name, title or email" value="${esc(f.q)}" data-inp="dirQ"><select class="input sm" data-chg="dirF" data-k="dept">${deptOptions(f.dept)}</select><select class="input sm" data-chg="dirF" data-k="loc"><option value="">All locations</option>${locs.map(l => `<option ${f.loc === l ? 'selected' : ''}>${l}</option>`).join('')}</select><select class="input sm" data-chg="dirF" data-k="status"><option value="">Any status</option>${['Active','Onboarding','On leave','Notice period'].map(s => `<option ${f.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select><span class="small muted">${list.length} people</span></div>`;
    const body = t.cur === 'list'
      ? `<div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Manager</th><th>Location</th><th>Joined</th><th>Status</th></tr></thead><tbody>${list.map(e => `<tr class="click" data-act="person" data-id="${e.id}"><td>${personCell(e)}</td><td>${esc(dept(e.dept).name)}</td><td class="sec">${e.managerId ? esc(emp(e.managerId).name) : '—'}</td><td>${esc(e.location)}</td><td class="num small">${fd(e.joinDate)}</td><td>${sp(e.status)}</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="panel-b"><div class="grid g4">${list.map(e => `<button class="panel" style="text-align:left;cursor:pointer;padding:16px;display:flex;flex-direction:column;gap:10px" data-act="person" data-id="${e.id}">${av(e, 'lg')}<div><div style="font-weight:600">${esc(e.name)}</div><div class="small muted">${esc(e.title)}</div></div><div class="row">${pill(dept(e.dept).name, 'blue plain')}<span class="small muted">${esc(e.location)}</span></div></button>`).join('')}</div></div>`;
    return pageHead(this, isAdmin() ? `<button class="btn primary" data-act="addEmployee">${icon('plus')} Add employee</button>` : '') + `<div class="panel">${t.html}<div class="panel-h" style="border-bottom:1px solid var(--line)">${filters}</div>${body}</div>`;
  }
});
let dirTimer;
act('dirQ', (d, el) => { UI.filter.dir.q = el.value; clearTimeout(dirTimer); dirTimer = setTimeout(() => { rerender(); const i = document.getElementById('dirQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); });
act('dirF', (d, el) => { UI.filter.dir[d.k] = el.value; rerender(); });

function openProfile(id){
  const e = emp(id); if (!e) return;
  const self = e.id === me().id;
  const myReport = isMgr() && allReports(me().id).some(r => r.id === e.id);
  /* access rules agreed in the access review (12 Nov) */
  const can = {
    phone: isAdmin() || self,
    privateInfo: isAdmin() || self,                 // home address, emergency contact, full date of birth
    skills: isAdmin() || isMgr() || self,
    band: isAdmin(),
    salary: isAdmin() || isFin() || self,
    time: isAdmin() || self,
    perf: isAdmin() || self || myReport,
    docs: isAdmin() || self || isFin(),             // Finance: ID and bank documents only
    assets: isAdmin() || isFin() || self
  };
  const allTabs = [['overview','Overview',true],['job','Job & pay',true],['time','Time off',can.time],['perf','Performance',can.perf],['docs','Documents',can.docs],['assets','Assets',can.assets]].filter(x => x[2]);
  if (!allTabs.some(x => x[0] === UI.profileTab)) UI.profileTab = 'overview';
  const t = UI.profileTab;
  const tabsHtml = `<div class="tabs" style="padding:0 18px">${allTabs.map(([k, l]) => `<button class="${t === k ? 'on' : ''}" data-act="profTab" data-id="${e.id}" data-t="${k}">${l}</button>`).join('')}</div>`;
  const dob = parseD(e.dob);
  let body = '';
  if (t === 'overview') {
    if (can.privateInfo && !self) log('Viewed personal details', e.name);
    body = `<dl class="dl">
      <dt>Work email</dt><dd>${esc(e.email)} <button class="btn ghost sm" data-act="copy" data-text="${esc(e.email)}" aria-label="Copy email">${icon('copy', 13)}</button></dd>
      ${can.phone ? `<dt>Phone</dt><dd class="num">${esc(e.phone)}</dd>` : ''}
      <dt>Location</dt><dd>${esc(e.location)}</dd>
      <dt>Manager</dt><dd>${e.managerId ? `<a href="#" data-act="person" data-id="${e.managerId}">${esc(emp(e.managerId).name)}</a>` : '—'}</dd>
      <dt>Direct reports</dt><dd>${reportsOf(e.id).map(r => `<a href="#" data-act="person" data-id="${r.id}">${esc(r.name)}</a>`).join(', ') || '—'}</dd>
      <dt>Birthday</dt><dd>${can.privateInfo ? fd(e.dob) : dob.getDate() + ' ' + MONTHS[dob.getMonth()]}</dd>
      ${can.skills ? `<dt>Skills</dt><dd><div class="row" style="gap:6px">${e.skills.map(s => `<span class="tag">${esc(s.name)} · ${s.level}</span>`).join('') || '<span class="muted">None added</span>'}${self ? `<button class="btn ghost sm" data-act="editSkills">Update</button>` : ''}</div></dd>` : ''}
      ${can.privateInfo ? `<dt>Address</dt><dd>${esc(e.address)}, ${esc(e.location)}</dd><dt>Emergency contact</dt><dd>${esc(e.emergency)}</dd>` : ''}
    </dl>${can.privateInfo ? '' : '<div class="small muted">Phone, home address and emergency contact are visible to HR only.</div>'}`;
  }
  if (t === 'job') {
    body = `<dl class="dl"><dt>Employee ID</dt><dd class="num">${e.id}</dd><dt>Title</dt><dd>${esc(e.title)}</dd><dt>Department</dt><dd>${esc(dept(e.dept).name)}</dd>${can.band ? `<dt>Band</dt><dd>${e.band}</dd>` : ''}<dt>Employment type</dt><dd>${esc(e.type)}</dd><dt>Joined</dt><dd>${fd(e.joinDate)} · ${tenure(e.joinDate)}</dd><dt>Status</dt><dd>${sp(e.status)}</dd>
    ${can.salary ? `<dt>Annual CTC</dt><dd><b class="num">${lakh(e.lpa)}</b> <span class="muted small">(${inr(e.lpa * 100000 / 12)} / month)</span></dd>` : ''}</dl>${can.salary ? '' : '<div class="small muted">Salary is visible to HR, Finance and the employee only.</div>'}`;
  }
  if (t === 'time') {
    const ls = DB.leaves.filter(l => l.emp === e.id).sort((a,b)=> b.from.localeCompare(a.from));
    body = `<div class="grid g2">${['EL','SL','CL','WFH'].map(tp => { const b = leaveBalance(e.id, tp); return `<div class="panel" style="padding:12px"><div class="small sec">${DB.leaveTypes.find(x => x.id === tp).name}</div><div class="num" style="font-size:20px;font-weight:700;font-family:var(--f-display)">${b.left} <span class="muted small">left of ${b.quota}</span></div></div>`; }).join('')}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Type</th><th>Dates</th><th class="r">Days</th><th>Status</th></tr></thead><tbody>${ls.map(l => `<tr><td>${l.type}</td><td>${fds(l.from)}${l.to !== l.from ? '–' + fds(l.to) : ''}</td><td class="r num">${l.days}</td><td>${sp(l.status)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  if (t === 'perf') {
    const gs = DB.goals.filter(g => g.emp === e.id);
    const past = DB.reviews.find(r => r.cycle === 'RC1' && r.emp === e.id && r.kind === 'Manager');
    const curRevs = isAdmin() ? DB.reviews.filter(r => r.cycle === 'RC2' && r.emp === e.id) : [];
    body = `<div class="stack">${gs.map(g => `<div><div class="row between small"><span>${esc(g.title)}${g.pending ? ' ' + pill('Change awaiting approval','warn') : ''}</span><span class="num">${g.progress}%</span></div>${barH(g.progress, progKind(g.progress))}</div>`).join('')}</div>
      ${past ? `<div class="note">Last cycle (H2 FY26) manager rating: <b>${past.rating} · ${DB.ratingLabels[past.rating]}</b></div>` : ''}
      ${curRevs.length ? `<div class="small sec">Current cycle (visible to HR)</div>${curRevs.map(r => `<div class="row between small"><span>${r.kind} · ${esc(emp(r.reviewer).name)}</span><span>${r.status === 'Submitted' ? '<b class="num">' + (r.final || r.rating) + '/5</b>' : sp(r.status)}</span></div>`).join('')}` : ''}
      <div class="small sec">Recent feedback received</div>${DB.feedback.filter(f => f.to === e.id && f.type !== 'Request' && (f.visibility !== 'Private' || isAdmin() || self)).slice(0, 3).map(f => `<div class="small" style="border-left:2px solid var(--blue-soft-2);padding-left:10px">“${esc(f.text)}” <span class="muted">— ${esc(emp(f.from).name)}, ${fds(f.date)}</span></div>`).join('') || '<div class="muted small">None yet.</div>'}`;
  }
  if (t === 'docs') {
    const finOnly = isFin() && !self && !isAdmin();
    const ds = DB.documents.filter(x => x.emp === e.id && (!finOnly || x.category === 'Identity & bank'));
    body = `${finOnly ? '<div class="note small">Finance sees identity and bank documents only.</div>' : ''}<div class="tbl-wrap"><table><thead><tr><th>Document</th><th>Category</th><th>Uploaded</th><th></th></tr></thead><tbody>${ds.map(x => `<tr><td>${icon('doc', 14)} ${esc(x.name)} ${x.signed ? pill('Signed','good') : ''}</td><td class="small sec">${esc(x.category)}</td><td class="small num">${fds(x.uploaded)}</td><td class="small muted">${esc(x.size)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">No documents.</td></tr>'}</tbody></table></div><button class="btn sm" data-act="uploadDoc" data-emp="${e.id}">${icon('up', 14)} Upload document</button>`;
  }
  if (t === 'assets') {
    const as = DB.assets.filter(a => a.emp === e.id);
    body = as.length ? `<div class="tbl-wrap"><table><thead><tr><th>Asset</th><th>Tag</th><th>Issued</th><th>Condition</th></tr></thead><tbody>${as.map(a => `<tr><td>${esc(a.model)}</td><td class="num small">${a.id}</td><td class="small">${fds(a.issued)}</td><td>${sp(a.condition)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="muted">No equipment assigned.</div>';
  }
  const canEdit = isAdmin() || self;
  openDrawer(`<div class="m-head"><div class="row" style="flex-wrap:nowrap">${av(e, 'lg')}<div><h3 style="font-size:19px">${esc(e.name)}</h3><div class="sec">${esc(e.title)} · ${esc(dept(e.dept).name)}</div><div class="row" style="margin-top:6px">${sp(e.status)}<span class="small muted">${tenure(e.joinDate)} at Arcadia</span></div></div></div><button class="icon-btn" data-act="close" aria-label="Close">${icon('x')}</button></div>
  ${tabsHtml}<div class="m-body">${body}</div>
  <div class="m-foot" style="margin-top:auto">${canEdit ? `<button class="btn" data-act="editEmployee" data-id="${e.id}">Edit details</button>` : ''}${self ? '' : `<button class="btn primary" data-act="giveFeedback" data-to="${e.id}">${icon('chat', 14)} Give feedback</button>`}</div>`);
}
act('profTab', d => { UI.profileTab = d.t; openProfile(d.id); });
act('copy', d => copyText(d.text, 'Email'));

function employeeForm(e){
  const x = e || { name:'', title:'', dept:'ENG', managerId:'E007', email:'', phone:'', location:'Bengaluru', joinDate: isoD(addD(TODAY(), 14)), type:'Full-time', band:'L3', lpa:15, dob:'1996-01-01', address:'', emergency:'' };
  const adminOnly = isAdmin();
  return `<div class="form-grid">
    <div class="field"><label for="f-name">Full name</label><input class="input" id="f-name" value="${esc(x.name)}" ${adminOnly ? '' : 'disabled'}></div>
    <div class="field"><label for="f-title">Job title</label><input class="input" id="f-title" value="${esc(x.title)}" ${adminOnly ? '' : 'disabled'}></div>
    <div class="field"><label for="f-dept">Department</label><select class="input" id="f-dept" ${adminOnly ? '' : 'disabled'}>${deptOptions(x.dept, false)}</select></div>
    <div class="field"><label for="f-mgr">Manager</label><select class="input" id="f-mgr" ${adminOnly ? '' : 'disabled'}><option value="">No manager</option>${empOptions(DB.employees.filter(m => m.id !== x.id), x.managerId)}</select></div>
    <div class="field"><label for="f-email">Work email</label><input class="input" id="f-email" type="email" value="${esc(x.email)}" placeholder="first.last@arcadia.example" ${adminOnly ? '' : 'disabled'}></div>
    <div class="field"><label for="f-phone">Phone</label><input class="input" id="f-phone" value="${esc(x.phone)}"></div>
    <div class="field"><label for="f-loc">Location</label><select class="input" id="f-loc">${['Bengaluru','Pune','Mumbai','Hyderabad','Remote'].map(l => `<option ${x.location === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="f-join">Joining date</label><input class="input" id="f-join" type="date" value="${x.joinDate}" ${adminOnly ? '' : 'disabled'}></div>
    <div class="field"><label for="f-type">Employment type</label><select class="input" id="f-type" ${adminOnly ? '' : 'disabled'}>${['Full-time','Contract','Intern'].map(l => `<option ${x.type === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    <div class="field"><label for="f-band">Band</label><select class="input" id="f-band" ${adminOnly ? '' : 'disabled'}>${['L0','L2','L3','L4','L5','L6','L7'].map(l => `<option ${x.band === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
    ${adminOnly ? `<div class="field"><label for="f-ctc">Annual CTC (₹ lakhs)</label><input class="input" id="f-ctc" type="number" step="0.1" value="${x.lpa}"></div>` : ''}
    <div class="field"><label for="f-dob">Date of birth</label><input class="input" id="f-dob" type="date" value="${x.dob}"></div>
    <div class="field full"><label for="f-addr">Address</label><input class="input" id="f-addr" value="${esc(x.address)}"></div>
    <div class="field full"><label for="f-emg">Emergency contact</label><input class="input" id="f-emg" value="${esc(x.emergency)}" placeholder="Relation · phone"></div>
  </div>${adminOnly ? '' : '<div class="note">Job details are managed by HR. You can update your contact and personal details.</div>'}`;
}
act('addEmployee', () => openModal('Add employee', employeeForm(null) + '<div class="note">Adding someone with a future joining date creates their onboarding checklist automatically.</div>', `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveEmployee">Add employee</button>`));
act('editEmployee', d => openModal('Edit details', employeeForm(emp(d.id)), `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveEmployee" data-id="${d.id}">Save changes</button>`));
act('saveEmployee', d => {
  const name = val('f-name');
  if (!name) { toast('Enter a full name before saving.'); return; }
  if (d.id) {
    const e = emp(d.id);
    if (isAdmin()) { Object.assign(e, { name, title: val('f-title'), dept: val('f-dept'), managerId: val('f-mgr') || null, email: val('f-email'), joinDate: val('f-join'), type: val('f-type'), band: val('f-band') }); const c = parseFloat(val('f-ctc')); if (!isNaN(c) && c !== e.lpa) { log('Changed salary', e.name + ' · ' + lakh(e.lpa) + ' → ' + lakh(c)); e.lpa = c; } }
    Object.assign(e, { phone: val('f-phone'), location: val('f-loc'), dob: val('f-dob'), address: val('f-addr'), emergency: val('f-emg') });
    log('Updated employee record', e.name);
    closeOverlay(); toast('Saved ' + e.name + '’s details.'); rerender(); openProfile(e.id); return;
  }
  const id = 'E' + String(DB.employees.length + 1).padStart(3, '0');
  const e = { id, name, title: val('f-title') || 'New hire', dept: val('f-dept'), managerId: val('f-mgr') || null, email: val('f-email') || name.toLowerCase().replace(/\s+/g, '.') + '@arcadia.example', phone: val('f-phone'), location: val('f-loc'), joinDate: val('f-join'), status: val('f-join') > DB.today ? 'Onboarding' : 'Active', type: val('f-type'), dob: val('f-dob'), emergency: val('f-emg'), lpa: parseFloat(val('f-ctc')) || 10, band: val('f-band'), address: val('f-addr'), skills: [] };
  DB.employees.push(e);
  DB.userRoles[id] = 'employee';
  if (e.status === 'Onboarding') DB.onboarding.unshift({ emp:id, buddy: DB.employees.find(x => x.dept === e.dept && x.id !== id && x.status === 'Active').id, tasks: DB.onboardTemplate.map(t => ({ ...t, done:false })) });
  DB.assets.push({ id:'AS-' + String(DB.assets.length + 1).padStart(4,'0'), type:'Access card', model:'Office access card', serial:'AC' + Math.floor(1000 + Math.random() * 8999), emp:null, issued:null, condition:'In stock' });
  if (e.managerId) notify(e.managerId, name + ' joins your team on ' + fds(e.joinDate) + '. Their onboarding checklist is ready.', 'onboarding');
  log('Added employee', name);
  closeOverlay(); toast(name + ' added' + (e.status === 'Onboarding' ? ' with an onboarding checklist.' : '.')); rerender();
});

/* ---------------- Org chart ---------------- */
view('org', { title:'Org chart', group:'People', icon:'org', fid:'B3',
  desc:'Reporting lines across the company. Click anyone to open their profile.',
  render(){
    const t = tabs('orgView', [['tree','Reporting lines'],['depts','Departments']]);
    if (t.cur === 'depts') {
      return pageHead(this) + `<div class="panel">${t.html}<div class="panel-b"><div class="grid g4">${DB.depts.map(d => { const ps = DB.employees.filter(e => e.dept === d.id); const head = ps.find(e => /Head|VP|Lead|Chief/.test(e.title)) || ps[0]; return `<div class="panel" style="padding:16px;display:flex;flex-direction:column;gap:10px"><div class="row between"><b>${esc(d.name)}</b><span class="num sec">${ps.length}</span></div>${head ? `<div class="small muted">Led by ${esc(head.name)}</div>` : ''}<div class="row" style="gap:4px">${ps.slice(0, 8).map(p => `<span data-act="person" data-id="${p.id}" style="cursor:pointer" title="${esc(p.name)}">${av(p, 'sm')}</span>`).join('')}${ps.length > 8 ? `<span class="small muted">+${ps.length - 8}</span>` : ''}</div></div>`; }).join('')}</div></div></div>`;
    }
    const root = DB.employees.find(e => !e.managerId);
    const node = e => { const kids = reportsOf(e.id); return `<li><button class="org-node" data-act="person" data-id="${e.id}">${av(e, 'sm')}<span><span style="display:block;font-weight:500;font-size:13px">${esc(e.name)}</span><span class="small muted">${esc(e.title)}</span></span></button>${kids.length ? `<ul>${kids.map(node).join('')}</ul>` : ''}</li>`; };
    const depth = UI.orgFocus ? emp(UI.orgFocus) : root;
    return pageHead(this, `<select class="input sm" data-chg="orgFocus"><option value="">Whole company</option>${DB.employees.filter(e => reportsOf(e.id).length).map(e => `<option value="${e.id}" ${UI.orgFocus === e.id ? 'selected' : ''}>${esc(e.name)}’s team</option>`).join('')}</select>`) + `<div class="panel">${t.html}<div class="org"><ul>${node(depth)}</ul></div></div>`;
  }
});
act('orgFocus', (d, el) => { UI.orgFocus = el.value || null; rerender(); });

/* ---------------- Onboarding ---------------- */
view('onboarding', { title:'Onboarding', group:'People', icon:'flag', fid:'B11', roles:['admin','manager'],
  desc:'Checklists for new joiners, split by owner and phase so HR, IT, managers and buddies each know their part.',
  render(){
    const list = DB.onboarding.filter(o => isAdmin() || emp(o.emp).managerId === me().id || allReports(me().id).some(r => r.id === o.emp));
    return pageHead(this, isAdmin() ? `<button class="btn primary" data-act="addEmployee">${icon('plus')} Add new joiner</button>` : '') + (list.length ? list.map(o => {
      const e = emp(o.emp); const done = o.tasks.filter(t => t.done).length;
      const phases = [...new Set(o.tasks.map(t => t.phase))];
      return `<div class="panel"><div class="panel-h"><div class="row">${personCell(e, e.title + ' · ' + (e.joinDate > DB.today ? 'joins ' : 'joined ') + fd(e.joinDate))}</div><div class="row"><span class="small sec">Buddy: ${esc(emp(o.buddy).name)}</span><span class="num small">${done}/${o.tasks.length}</span><div style="width:120px">${barH(pct(done, o.tasks.length), done === o.tasks.length ? 'good' : '')}</div></div></div>
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:0">${phases.map(ph => `<div style="border-right:1px solid var(--line)"><div class="small" style="padding:10px 16px 4px;font-weight:600;color:var(--ink-2)">${esc(ph)}</div>${o.tasks.map((t, i) => t.phase !== ph ? '' : `<label class="check ${t.done ? 'done' : ''}"><input type="checkbox" ${t.done ? 'checked' : ''} data-chg="onbTask" data-emp="${o.emp}" data-i="${i}"><span class="small">${esc(t.t)}</span><span class="tag" style="margin-left:auto">${esc(t.owner)}</span></label>`).join('')}</div>`).join('')}</div></div>`;
    }).join('') : '<div class="panel empty">No one is onboarding right now.</div>');
  }
});
act('onbTask', (d, el) => { const o = DB.onboarding.find(x => x.emp === d.emp); o.tasks[+d.i].done = el.checked; if (o.tasks.every(t => t.done)) { const e = emp(o.emp); e.status = 'Active'; toast(e.name + ' has finished onboarding and is now Active.'); log('Completed onboarding', e.name); } rerender(); });

/* ---------------- Offboarding ---------------- */
view('offboarding', { title:'Offboarding', group:'People', icon:'exit', fid:'B12', roles:['admin','manager'],
  desc:'Exit checklists, asset returns and exit interviews, so nothing is missed on the way out.',
  render(){
    const list = DB.offboarding;
    return pageHead(this, isAdmin() ? `<button class="btn primary" data-act="startExit">${icon('plus')} Start offboarding</button>` : '') + (list.length ? list.map(o => {
      const e = emp(o.emp); const done = o.tasks.filter(t => t.done).length;
      const as = DB.assets.filter(a => a.emp === e.id);
      return `<div class="panel"><div class="panel-h">${personCell(e, e.title + ' · last day ' + fd(o.lwd) + ' (' + daysBetween(DB.today, o.lwd) + ' days)')}<div class="row">${pill(o.reason, 'plain')}<span class="num small">${done}/${o.tasks.length}</span><div style="width:120px">${barH(pct(done, o.tasks.length))}</div></div></div>
      <div class="grid g-2-1" style="gap:0"><div>${o.tasks.map((t, i) => `<label class="check ${t.done ? 'done' : ''}"><input type="checkbox" ${t.done ? 'checked' : ''} data-chg="offTask" data-emp="${o.emp}" data-i="${i}"><span class="small">${esc(t.t)}</span><span class="tag" style="margin-left:auto">${esc(t.owner)}</span></label>`).join('')}</div>
      <div style="border-left:1px solid var(--line)"><div class="small" style="padding:10px 16px 4px;font-weight:600;color:var(--ink-2)">Assets to collect</div>${as.map(a => `<div class="check"><span class="small">${esc(a.model)} <span class="muted num">${a.id}</span></span><button class="btn sm" style="margin-left:auto" data-act="returnAsset" data-id="${a.id}">Mark returned</button></div>`).join('') || '<div class="empty small">All assets returned.</div>'}
      <div style="padding:12px 16px">${o.interview ? `<div class="note small"><b>Exit interview:</b> ${esc(o.interview)}</div>` : `<button class="btn sm" data-act="exitInterview" data-emp="${o.emp}">Record exit interview</button>`}</div></div></div></div>`;
    }).join('') : '<div class="panel empty">No exits in progress.</div>') + `<div class="panel"><div class="panel-h"><h3>Recent exits</h3><span class="sub">Last 6 months</span></div><div class="tbl-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Last day</th><th>Reason</th><th>Regretted</th></tr></thead><tbody>${DB.exits.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(dept(x.dept).name)}</td><td class="small">${fd(x.date)}</td><td>${esc(x.reason)}</td><td>${x.regretted ? pill('Yes','bad') : pill('No','plain')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
});
act('offTask', (d, el) => { const o = DB.offboarding.find(x => x.emp === d.emp); o.tasks[+d.i].done = el.checked; rerender(); });
act('returnAsset', d => { const a = DB.assets.find(x => x.id === d.id); a.emp = null; a.condition = 'In stock'; log('Asset returned', a.id + ' ' + a.model); toast(a.model + ' marked as returned and back in stock.'); rerender(); });
act('exitInterview', d => openModal('Exit interview', `<div class="field"><label for="ei-r">Main reason for leaving</label><select class="input" id="ei-r">${['Better opportunity','Compensation','Manager relationship','Burnout / workload','Career change','Relocation','Other'].map(x => `<option>${x}</option>`).join('')}</select></div><div class="field"><label for="ei-n">Notes</label><textarea class="input" id="ei-n" placeholder="What would have made them stay?"></textarea></div><div class="field"><label for="ei-w">Would they return?</label><select class="input" id="ei-w"><option>Yes</option><option>Maybe</option><option>No</option></select></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveExitInt" data-emp="${d.emp}">Save</button>`));
act('saveExitInt', d => { const o = DB.offboarding.find(x => x.emp === d.emp); o.reason = val('ei-r'); o.interview = val('ei-r') + '. ' + (val('ei-n') || 'No notes.') + ' Would return: ' + val('ei-w') + '.'; const i = o.tasks.findIndex(t => /Exit interview/.test(t.t)); if (i >= 0) o.tasks[i].done = true; closeOverlay(); toast('Exit interview saved.'); rerender(); });
act('startExit', () => openModal('Start offboarding', `<div class="field"><label for="x-emp">Employee</label><select class="input" id="x-emp">${empOptions(DB.employees.filter(e => e.status === 'Active' && !DB.offboarding.some(o => o.emp === e.id)))}</select></div><div class="form-grid"><div class="field"><label for="x-lwd">Last working day</label><input class="input" id="x-lwd" type="date" value="${isoD(addD(TODAY(), 30))}"></div><div class="field"><label for="x-reason">Reason</label><select class="input" id="x-reason">${['Better opportunity','Compensation','Relocation','Career change','Burnout / workload','Termination','Other'].map(x => `<option>${x}</option>`).join('')}</select></div></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveExit">Create checklist</button>`));
act('saveExit', () => { const id = val('x-emp'); const e = emp(id); e.status = 'Notice period'; DB.offboarding.unshift({ emp:id, lwd: val('x-lwd'), reason: val('x-reason'), regretted:false, tasks: DB.offboardTemplate.map(t => ({ ...t, done:false })), interview:null }); log('Started offboarding', e.name); closeOverlay(); toast('Offboarding checklist created for ' + e.name + '.'); rerender(); });

/* ---------------- Documents ---------------- */
view('documents', { title:'Documents & policies', nav:'Documents', group:'People', icon:'doc', fid:'B10',
  desc:'Employee files and company policies, with acknowledgement tracking.',
  render(){
    const t = tabs('docs', [['policies','Company policies'],['files', isEmp() ? 'My documents' : 'Employee files'],['missing','Missing documents']]);
    let body = '';
    if (t.cur === 'policies') {
      const n = activeEmployees().length;
      body = `<div class="tbl-wrap"><table><thead><tr><th>Policy</th><th>Version</th><th>Updated</th><th style="width:26%">Acknowledged</th><th></th></tr></thead><tbody>${DB.policies.map(p => { const a = DB.acks[p.id].length; const mine = DB.acks[p.id].includes(me().id); return `<tr><td>${icon('doc', 14)} ${esc(p.name)}</td><td class="num small">${p.version}</td><td class="small">${fd(p.updated)}</td><td><div class="row" style="flex-wrap:nowrap"><div style="flex:1">${barH(pct(a, n), pct(a, n) > 85 ? 'good' : 'warn')}</div><span class="num small">${a}/${n}</span></div></td><td class="r">${mine ? pill('You signed','good') : `<button class="btn sm primary" data-act="ackPolicy" data-id="${p.id}">Read & sign</button>`} ${isAdmin() ? `<button class="btn sm" data-act="remindPolicy" data-id="${p.id}">Remind</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    if (t.cur === 'files') {
      const scope = isAdmin() ? DB.employees : [me()];
      const ds = DB.documents.filter(d => scope.some(e => e.id === d.emp)).slice(0, 80);
      body = `<div class="tbl-wrap"><table><thead><tr><th>Document</th>${isAdmin() ? '<th>Employee</th>' : ''}<th>Category</th><th>Uploaded</th><th>Size</th></tr></thead><tbody>${ds.map(d => `<tr><td>${icon('doc', 14)} ${esc(d.name)} ${d.signed ? pill('Signed','good') : ''}</td>${isAdmin() ? `<td>${esc(emp(d.emp).name)}</td>` : ''}<td class="small sec">${esc(d.category)}</td><td class="small">${fds(d.uploaded)}</td><td class="small muted">${esc(d.size)}</td></tr>`).join('')}</tbody></table></div>${isAdmin() ? '' : '<div class="panel-b note small">You see your own files here. Other people’s files are visible to HR; Finance can open identity and bank documents from a profile.</div>'}`;
    }
    if (t.cur === 'missing') {
      const req = ['Offer letter','Employment contract','PAN card','Aadhaar (masked)','Bank proof','NDA'];
      const scope = isAdmin() ? DB.employees : [me()];
      const rows = scope.map(e => ({ e, miss: req.filter(r => !DB.documents.some(d => d.emp === e.id && d.name === r)) })).filter(x => x.miss.length);
      body = rows.length ? `<div class="tbl-wrap"><table><thead><tr><th>Employee</th><th>Missing</th><th></th></tr></thead><tbody>${rows.map(x => `<tr><td>${personCell(x.e)}</td><td><div class="row" style="gap:5px">${x.miss.map(m => pill(m, 'warn')).join('')}</div></td><td class="r"><button class="btn sm" data-act="uploadDoc" data-emp="${x.e.id}">${icon('up', 14)} Upload</button></td></tr>`).join('')}</tbody></table></div>` : '<div class="empty">Every required document is on file.</div>';
    }
    return pageHead(this, `<button class="btn primary" data-act="uploadDoc" data-emp="${isAdmin() ? '' : me().id}">${icon('up')} Upload document</button>`) + `<div class="panel">${t.html}${body}</div>`;
  }
});
act('ackPolicy', d => { const p = DB.policies.find(x => x.id === d.id); openModal(p.name, `<div class="sec small">${esc(p.version)} · updated ${fd(p.updated)}</div><div class="panel" style="padding:14px;max-height:220px;overflow:auto;font-size:13.5px;line-height:1.6"><p style="margin-top:0"><b>1. Purpose.</b> This placeholder text stands in for the full policy. In the real system the PDF or rich-text policy renders here.</p><p><b>2. Scope.</b> Applies to all full-time, contract and intern employees of Arcadia Systems.</p><p><b>3. Your responsibilities.</b> Read the policy, ask People Ops about anything unclear, and follow it in your day-to-day work.</p></div><label class="row small"><input type="checkbox" id="ack-c" style="accent-color:var(--blue)"> I have read and understood this policy.</label>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="doAck" data-id="${p.id}">Sign</button>`); });
act('doAck', d => { if (!document.getElementById('ack-c').checked) { toast('Tick the box to confirm you’ve read it.'); return; } DB.acks[d.id].push(me().id); log('Acknowledged policy', DB.policies.find(p => p.id === d.id).name); closeOverlay(); toast('Signed. Thank you.'); rerender(); });
act('remindPolicy', d => { const p = DB.policies.find(x => x.id === d.id); const pend = activeEmployees().filter(e => !DB.acks[p.id].includes(e.id)); pend.forEach(e => notify(e.id, 'Please read and sign “' + p.name + '”.', 'documents')); toast('Reminder sent to ' + pend.length + ' people.'); });
act('uploadDoc', d => openModal('Upload document', `${d.emp ? '' : `<div class="field"><label for="u-emp">Employee</label><select class="input" id="u-emp">${empOptions(DB.employees)}</select></div>`}<div class="field"><label for="u-name">Document type</label><select class="input" id="u-name">${['Offer letter','Employment contract','PAN card','Aadhaar (masked)','Bank proof','NDA','Relieving letter (previous employer)','Other'].map(x => `<option>${x}</option>`).join('')}</select></div><div class="field"><label for="u-file">File</label><input class="input" type="file" id="u-file"></div><div class="note small">In this prototype the file stays in your browser session; nothing is uploaded to a server.</div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveDoc" data-emp="${d.emp || ''}">Upload</button>`));
act('saveDoc', d => { const empId = d.emp || val('u-emp'); const f = document.getElementById('u-file').files[0]; const name = val('u-name'); DB.documents.push({ id:'DOC' + Date.now(), emp: empId, name, category: /PAN|Aadhaar|Bank/.test(name) ? 'Identity & bank' : 'Employment', uploaded: DB.today, size: f ? Math.max(1, Math.round(f.size / 1024)) + ' KB' : '120 KB', by: me().id, signed:null }); log('Uploaded document', name + ' for ' + emp(empId).name); closeOverlay(); toast(name + ' added to ' + emp(empId).name + '’s file.'); rerender(); });
