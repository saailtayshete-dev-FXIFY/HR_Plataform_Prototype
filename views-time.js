/* Time modules: leave (B4), attendance (B5), shifts & overtime (M11) */

/* ---------------- Leave ---------------- */
view('leave', { title:'Leave & holidays', nav:'Leave', group:'Time', icon:'cal', fid:'B4', short:'Leave',
  desc:'Requests, approvals, balances, the team calendar and the holiday list.',
  render(){
    const t = tabs('leave', [['requests','Requests'],['calendar','Team calendar'],['balances','Balances'],['policy','Policies & holidays']]);
    const scope = scopePeople(); const ids = new Set(scope.map(e => e.id));
    let body = '';
    if (t.cur === 'requests') {
      const f = UI.filter.leave || (UI.filter.leave = { status:'' });
      const list = DB.leaves.filter(l => ids.has(l.emp) && (!f.status || l.status === f.status)).sort((a,b)=> b.from.localeCompare(a.from));
      body = `<div class="panel-h"><div class="filters"><select class="input sm" data-chg="leaveF">${['','Pending','Approved','Rejected'].map(s => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${s || 'All statuses'}</option>`).join('')}</select><span class="small muted">${list.length} requests</span></div></div>
      <div class="tbl-wrap"><table><thead><tr>${isEmp() ? '' : '<th>Employee</th>'}<th>Type</th><th>Dates</th><th class="r">Days</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>${list.slice(0, 60).map(l => { const e = emp(l.emp); const canAct = l.status === 'Pending' && e.id !== me().id && (isAdmin() || (isMgr() && ids.has(e.id))); return `<tr>${isEmp() ? '' : `<td>${personCell(e)}</td>`}<td>${esc(DB.leaveTypes.find(x => x.id === l.type).name)}</td><td class="small">${fds(l.from)}${l.to !== l.from ? ' – ' + fds(l.to) : ''}</td><td class="r num">${l.days}</td><td class="small sec">${esc(l.reason)}</td><td>${sp(l.status)}</td><td class="r" style="white-space:nowrap">${canAct ? `<button class="btn sm good" data-act="approve" data-kind="leave" data-id="${l.id}">Approve</button> <button class="btn sm bad" data-act="reject" data-kind="leave" data-id="${l.id}">Decline</button>` : l.emp === me().id && l.status === 'Pending' ? `<button class="btn sm" data-act="cancelLeave" data-id="${l.id}">Cancel</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    if (t.cur === 'calendar') {
      const base = UI.calMonth ? parseD(UI.calMonth) : new Date(TODAY().getFullYear(), TODAY().getMonth(), 1);
      const y = base.getFullYear(), m = base.getMonth();
      const first = new Date(y, m, 1); const startPad = (first.getDay() + 6) % 7; const daysIn = new Date(y, m + 1, 0).getDate();
      const calPeople = !isAdmin() && !isMgr() ? DB.employees.filter(e => e.managerId === me().managerId || e.id === me().managerId) : scope;
      const cids = new Set(calPeople.map(e => e.id));
      let cells = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="h">${d}</div>`).join('');
      for (let i = 0; i < startPad; i++) cells += '<div class="d off" style="visibility:hidden"></div>';
      for (let d = 1; d <= daysIn; d++) {
        const ds = isoD(new Date(y, m, d)); const wd = new Date(y, m, d).getDay();
        const hol = DB.holidays.find(h => h.date === ds);
        const evs = DB.leaves.filter(l => cids.has(l.emp) && l.status !== 'Rejected' && l.from <= ds && l.to >= ds);
        cells += `<div class="d ${wd === 0 || wd === 6 ? 'off' : ''} ${ds === DB.today ? 'today' : ''}"><span class="n">${d}</span>${hol ? `<span class="ev hol" title="${esc(hol.name)}">${esc(hol.name)}</span>` : ''}${evs.slice(0, 3).map(l => `<span class="ev" title="${esc(emp(l.emp).name)} · ${l.type} · ${l.status}" style="${l.status === 'Pending' ? 'opacity:.6;border:1px dashed var(--blue)' : ''}">${esc(emp(l.emp).name.split(' ')[0])} · ${l.type}</span>`).join('')}${evs.length > 3 ? `<span class="small muted">+${evs.length - 3} more</span>` : ''}</div>`;
      }
      body = `<div class="panel-h"><div class="row"><button class="btn sm" data-act="calNav" data-d="-1" aria-label="Previous month">‹</button><b style="min-width:120px;text-align:center">${MONTHS[m]} ${y}</b><button class="btn sm" data-act="calNav" data-d="1" aria-label="Next month">›</button></div><div class="legend"><span><i style="background:var(--blue-soft)"></i>Approved</span><span><i style="background:var(--blue-soft);border:1px dashed var(--blue)"></i>Pending</span><span><i style="background:var(--warn-soft)"></i>Holiday</span></div></div><div class="panel-b"><div class="cal">${cells}</div></div>`;
    }
    if (t.cur === 'balances') {
      const list = scope;
      body = `<div class="tbl-wrap"><table><thead><tr><th>Employee</th>${['EL','SL','CL','WFH'].map(x => `<th class="r">${DB.leaveTypes.find(t => t.id === x).name}</th>`).join('')}<th class="r">Days taken (YTD)</th></tr></thead><tbody>${list.map(e => { const taken = DB.leaves.filter(l => l.emp === e.id && l.status === 'Approved' && l.type !== 'WFH').reduce((s,l)=> s + l.days, 0); return `<tr class="click" data-act="person" data-id="${e.id}"><td>${personCell(e)}</td>${['EL','SL','CL','WFH'].map(x => { const b = leaveBalance(e.id, x); return `<td class="r num">${b.left}<span class="muted">/${b.quota}</span></td>`; }).join('')}<td class="r num">${taken}${taken === 0 ? ' ' + pill('No leave yet','warn') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    if (t.cur === 'policy') {
      body = `<div class="grid g2" style="padding:16px"><div class="panel"><div class="panel-h"><h3>Leave types</h3>${isAdmin() ? '<button class="btn sm" data-act="addLeaveType">' + icon('plus', 14) + ' Add type</button>' : ''}</div><div class="tbl-wrap"><table><thead><tr><th>Type</th><th class="r">Days / year</th><th>Carry forward</th>${isAdmin() ? '<th></th>' : ''}</tr></thead><tbody>${DB.leaveTypes.map((lt, i) => `<tr><td>${esc(lt.name)}${lt.note ? `<div class="small muted">${esc(lt.note)}</div>` : ''}</td><td class="r">${isAdmin() ? `<input class="input sm num" style="width:70px;text-align:right" type="number" value="${lt.quota}" data-chg="ltQuota" data-i="${i}" aria-label="${esc(lt.name)} days per year">` : `<span class="num">${lt.quota}</span>`}</td><td>${lt.carry ? pill('Yes','good') : pill('No','plain')}</td>${isAdmin() ? `<td class="r"><button class="switch ${lt.carry ? 'on' : ''}" data-act="ltCarry" data-i="${i}" aria-label="Toggle carry forward"></button></td>` : ''}</tr>`).join('')}</tbody></table></div></div>
      <div class="panel"><div class="panel-h"><h3>Holidays</h3>${isAdmin() ? '<button class="btn sm" data-act="addHoliday">' + icon('plus', 14) + ' Add holiday</button>' : ''}</div>${DB.holidays.slice().sort((a,b)=> a.date.localeCompare(b.date)).map(h => `<div class="list-item"><span class="num small" style="width:80px">${fds(h.date)}</span><div class="grow">${esc(h.name)}</div><span class="small muted">${DOW[parseD(h.date).getDay()]}</span></div>`).join('')}</div></div>`;
    }
    return pageHead(this, `<button class="btn primary" data-act="applyLeave">${icon('plus')} Request leave</button>`) + `<div class="panel">${t.html}${body}</div>`;
  }
});
act('leaveF', (d, el) => { UI.filter.leave.status = el.value; rerender(); });
act('calNav', d => { const b = UI.calMonth ? parseD(UI.calMonth) : new Date(TODAY().getFullYear(), TODAY().getMonth(), 1); UI.calMonth = isoD(new Date(b.getFullYear(), b.getMonth() + +d.d, 1)); rerender(); });
act('ltQuota', (d, el) => { DB.leaveTypes[+d.i].quota = Math.max(0, parseInt(el.value, 10) || 0); log('Updated leave policy', DB.leaveTypes[+d.i].name + ' quota ' + el.value); toast('Policy updated. Balances recalculated.'); save(); });
act('ltCarry', d => { DB.leaveTypes[+d.i].carry = !DB.leaveTypes[+d.i].carry; log('Updated leave policy', DB.leaveTypes[+d.i].name + ' carry forward'); rerender(); });
act('cancelLeave', d => { DB.leaves = DB.leaves.filter(l => l.id !== d.id); toast('Request cancelled.'); rerender(); });
act('addHoliday', () => openModal('Add holiday', `<div class="form-grid"><div class="field"><label for="h-n">Name</label><input class="input" id="h-n" placeholder="e.g. Makar Sankranti"></div><div class="field"><label for="h-d">Date</label><input class="input" type="date" id="h-d" value="${isoD(addD(TODAY(), 30))}"></div></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveHoliday">Add</button>`));
act('saveHoliday', () => { if (!val('h-n')) { toast('Give the holiday a name.'); return; } DB.holidays.push({ date: val('h-d'), name: val('h-n') }); log('Added holiday', val('h-n')); closeOverlay(); toast('Holiday added to the calendar.'); rerender(); });
act('addLeaveType', () => openModal('Add leave type', `<div class="form-grid"><div class="field"><label for="lt-n">Name</label><input class="input" id="lt-n" placeholder="e.g. Mental health day"></div><div class="field"><label for="lt-q">Days per year</label><input class="input" id="lt-q" type="number" value="2"></div></div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveLeaveType">Add</button>`));
act('saveLeaveType', () => { const n = val('lt-n'); if (!n) { toast('Name the leave type.'); return; } DB.leaveTypes.push({ id: n.replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase() + DB.leaveTypes.length, name:n, quota: parseInt(val('lt-q'), 10) || 0, carry:false }); log('Added leave type', n); closeOverlay(); toast(n + ' added.'); rerender(); });

act('applyLeave', () => {
  const opts = DB.leaveTypes.map(t => { const b = leaveBalance(me().id, t.id); return `<option value="${t.id}">${esc(t.name)}${t.quota ? ' · ' + b.left + ' left' : ''}</option>`; }).join('');
  openModal('Request leave', `<div class="form-grid"><div class="field full"><label for="l-type">Leave type</label><select class="input" id="l-type">${opts}</select></div><div class="field"><label for="l-from">From</label><input class="input" type="date" id="l-from" value="${isoD(addD(TODAY(), 7))}"></div><div class="field"><label for="l-to">To</label><input class="input" type="date" id="l-to" value="${isoD(addD(TODAY(), 7))}"></div><div class="field full"><label for="l-reason">Reason (visible to your manager)</label><input class="input" id="l-reason" placeholder="e.g. Family function"></div></div><div class="note small" id="l-hint">Weekends and company holidays are not counted.</div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="submitLeave">Send request</button>`);
});
function workingDays(from, to){ let n = 0; for (let d = parseD(from); d <= parseD(to); d = addD(d, 1)) { const wd = d.getDay(); if (wd !== 0 && wd !== 6 && !DB.holidays.some(h => h.date === isoD(d))) n++; } return n; }
act('submitLeave', () => {
  const type = val('l-type'), from = val('l-from'), to = val('l-to');
  if (!from || !to || to < from) { toast('The end date must be on or after the start date.'); return; }
  const days = workingDays(from, to);
  if (!days) { toast('Those dates are all weekends or holidays. Pick at least one working day.'); return; }
  const lt = DB.leaveTypes.find(t => t.id === type); const b = leaveBalance(me().id, type);
  if (lt.quota && days > b.left) { toast('You have ' + b.left + ' ' + lt.name.toLowerCase() + ' days left; this request needs ' + days + '.'); return; }
  if (DB.leaves.some(l => l.emp === me().id && l.status !== 'Rejected' && !(l.to < from || l.from > to))) { toast('You already have leave booked on some of these dates.'); return; }
  const id = 'LV' + (Date.now() % 100000);
  DB.leaves.push({ id, emp: me().id, type, from, to, days, status: isAdmin() && !me().managerId ? 'Approved' : 'Pending', reason: val('l-reason') || '—', applied: DB.today });
  if (me().managerId) notify(me().managerId, me().name + ' requested ' + days + ' day' + (days > 1 ? 's' : '') + ' of ' + lt.name.toLowerCase() + ' from ' + fds(from) + '.', 'inbox');
  closeOverlay(); toast('Request sent to ' + (me().managerId ? emp(me().managerId).name : 'HR') + '. ' + days + ' working day' + (days > 1 ? 's' : '') + '.'); rerender();
});

/* ---------------- Attendance (absences only, agreed 12 Nov) ---------------- */
const attStatus = a => !a ? null : a.status === 'Late' ? 'Present' : a.status;
view('attendance', { title:'Attendance', group:'Time', icon:'clock', fid:'B5',
  desc:'Who was present, absent or on leave over the last four weeks. Check-in times and hours are not tracked.',
  render(){
    const scope = scopePeople(); const ids = new Set(scope.map(e => e.id));
    const today = DB.attendance.filter(a => a.date === DB.today && ids.has(a.emp));
    const absent = today.filter(a => a.status === 'Absent').length, leave = today.filter(a => a.status === 'Leave').length;
    const present = scope.length - absent - leave;
    const days = [...new Set(DB.attendance.map(a => a.date))].sort().slice(-10);
    const t = tabs('att', [['grid','Last 10 working days'],['summary','4-week summary']].concat(isAdmin() ? [['today','Mark today']] : []));
    let body = '';
    const cellFor = a => { const st = attStatus(a); if (!st || st === 'Present') return `<span class="lvl" style="color:var(--ink-3)" ${a ? `data-tip="${esc(fds(a.date))} · Present"` : ''}>·</span>`; const map = { Absent:['var(--bad-soft)','var(--bad)','A'], Leave:['var(--surface-2)','var(--ink-2)','LV'] }; const [bg, fg, lbl] = map[st]; return `<span class="lvl" style="background:${bg};color:${fg};width:38px" data-tip="${esc(fds(a.date) + ' · ' + (st === 'Leave' ? 'On leave' : 'Absent'))}">${lbl}</span>`; };
    if (t.cur === 'grid') {
      body = `<div class="tbl-wrap"><table class="matrix"><thead><tr><th>Employee</th>${days.map(d => `<th class="r" style="text-align:center">${DOW[parseD(d).getDay()].slice(0,2)} ${parseD(d).getDate()}</th>`).join('')}</tr></thead><tbody>${scope.map(e => `<tr><td>${personCell(e, dept(e.dept).name)}</td>${days.map(d => `<td class="lv">${cellFor(DB.attendance.find(a => a.emp === e.id && a.date === d))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="panel-b legend"><span><i style="background:var(--bad-soft)"></i>A · Absent</span><span><i style="background:var(--surface-2)"></i>LV · On leave</span><span>· Present</span></div>`;
    }
    if (t.cur === 'summary') {
      body = `<div class="tbl-wrap"><table><thead><tr><th>Employee</th><th class="r">Days present</th><th class="r">Absent</th><th class="r">On leave</th><th></th></tr></thead><tbody>${scope.map(e => { const a = DB.attendance.filter(x => x.emp === e.id); const abs = a.filter(x => x.status === 'Absent').length; return `<tr><td>${personCell(e)}</td><td class="r num">${a.filter(x => attStatus(x) === 'Present').length}</td><td class="r num">${abs}</td><td class="r num">${a.filter(x => x.status === 'Leave').length}</td><td>${abs >= 2 ? pill('Repeated absences','warn') : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
    }
    if (t.cur === 'today') {
      body = `<div class="tbl-wrap"><table><thead><tr><th>Employee</th><th>Today</th><th></th></tr></thead><tbody>${scope.map(e => { const st = attStatus(DB.attendance.find(x => x.emp === e.id && x.date === DB.today)) || 'Present'; return `<tr><td>${personCell(e)}</td><td>${sp(st === 'Leave' ? 'On leave' : st)}</td><td class="r"><select class="input sm" data-chg="markAtt" data-emp="${e.id}" aria-label="Mark attendance for ${esc(e.name)}"><option value="">Mark as…</option><option>Present</option><option>Absent</option><option value="Leave">On leave</option></select></td></tr>`; }).join('')}</tbody></table></div>`;
    }
    return pageHead(this, `<button class="btn" data-act="regularise">${icon('clock')} Correct an absence</button>`) + `<div class="panel"><div class="kpi-row">${statTile('Present today', present, pct(present, scope.length) + '% of ' + scope.length)}${statTile('Absent today', absent, 'no leave booked')}${statTile('On leave today', leave, 'approved')}${statTile('Absences, 4 weeks', DB.attendance.filter(a => ids.has(a.emp) && a.status === 'Absent').length)}</div></div><div class="panel">${t.html}${body}</div>`;
  }
});
act('markAtt', (d, el) => { if (!el.value) return; let a = DB.attendance.find(x => x.emp === d.emp && x.date === DB.today); if (!a) { a = { emp:d.emp, date:DB.today }; DB.attendance.push(a); } a.status = el.value; log('Marked attendance', emp(d.emp).name + ' · ' + el.value); toast(emp(d.emp).name + ' marked ' + (el.value === 'Leave' ? 'on leave' : el.value.toLowerCase()) + '.'); rerender(); });
act('regularise', () => { const mine = DB.attendance.filter(a => a.emp === me().id && a.status === 'Absent').sort((a,b)=> b.date.localeCompare(a.date)); openModal('Correct an absence', mine.length ? `<div class="field"><label for="r-d">Absence to correct</label><select class="input" id="r-d">${mine.map(a => `<option value="${a.date}">${fd(a.date)}</option>`).join('')}</select></div><div class="field"><label for="r-s">I was</label><select class="input" id="r-s"><option>Present</option><option>Working from home</option><option>On duty (client visit)</option></select></div><div class="field"><label for="r-why">Reason</label><input class="input" id="r-why" placeholder="e.g. Badge reader was down"></div>` : '<div class="note">You have no absences on record in the last four weeks.</div>', mine.length ? `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveRegularise">Send to manager</button>` : `<button class="btn" data-act="close">Close</button>`); });
act('saveRegularise', () => { const d = val('r-d'); const a = DB.attendance.find(x => x.emp === me().id && x.date === d); if (a) a.status = 'Present'; if (me().managerId) notify(me().managerId, me().name + ' corrected an absence on ' + fds(d) + ' (' + val('r-s').toLowerCase() + '): ' + (val('r-why') || 'no reason given') + '.', 'attendance'); closeOverlay(); toast('Absence corrected and your manager notified.'); rerender(); });

/* ---------------- Shifts & overtime ---------------- */
view('shifts', { title:'Shifts & overtime', nav:'Shifts', group:'Time', icon:'shift', fid:'M11', roles:['admin','manager','employee'],
  desc:'Support and on-call rotas, swap requests and overtime this month.',
  render(){
    const start = UI.shiftWeek ? parseD(UI.shiftWeek) : addD(TODAY(), -((TODAY().getDay() + 6) % 7));
    const week = [...Array(7)].map((_, i) => addD(start, i));
    const ppl = DB.employees.filter(e => DB.shifts.some(s => s.emp === e.id));
    const tplColor = { MOR:'var(--seq-2)', EVE:'var(--seq-3)', NGT:'var(--seq-5)', ONC:'var(--warn-soft)' };
    const tplInk = { MOR:'var(--ink)', EVE:'var(--ink)', NGT:'#fff', ONC:'var(--warn)' };
    const canEdit = isAdmin() || isMgr();
    const grid = `<div class="tbl-wrap"><table class="matrix"><thead><tr><th>Person</th>${week.map(d => `<th style="text-align:center">${DOW[d.getDay()]} ${d.getDate()}</th>`).join('')}</tr></thead><tbody>${ppl.map(e => `<tr><td>${personCell(e, dept(e.dept).name)}</td>${week.map(d => { const s = DB.shifts.find(x => x.emp === e.id && x.date === isoD(d)); const tp = s && DB.shiftTemplates.find(t => t.id === s.tpl); return `<td class="lv"><button ${canEdit ? `data-act="editShift" data-emp="${e.id}" data-date="${isoD(d)}"` : ''} style="border:0;cursor:${canEdit ? 'pointer' : 'default'};border-radius:6px;padding:4px 6px;min-width:70px;font-size:11.5px;background:${s ? tplColor[s.tpl] : 'var(--surface-2)'};color:${s ? tplInk[s.tpl] : 'var(--ink-3)'}" ${tp ? `data-tip="${esc(tp.name + ' · ' + tp.time)}"` : ''}>${tp ? esc(tp.name) : 'Off'}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    const sw = DB.swapRequests;
    const ot = DB.overtime.slice().sort((a,b)=> b.hours - a.hours);
    return pageHead(this, DB.shifts.some(x => x.emp === me().id) ? `<button class="btn" data-act="reqSwap">${icon('shift')} Request a shift change</button>` : '') + `
    <div class="panel"><div class="panel-h"><div class="row"><button class="btn sm" data-act="shiftNav" data-d="-7" aria-label="Previous week">‹</button><b>Week of ${fd(isoD(start))}</b><button class="btn sm" data-act="shiftNav" data-d="7" aria-label="Next week">›</button></div><div class="legend">${DB.shiftTemplates.map(t => `<span><i style="background:${tplColor[t.id]}"></i>${t.name} ${t.time}</span>`).join('')}</div></div>${grid}${canEdit ? '<div class="panel-b small muted">Click any cell to assign or change a shift.</div>' : '<div class="panel-b small muted">View only. Use “Request a shift change” to ask for a different shift or a swap.</div>'}</div>
    <div class="grid g2">
      <div class="panel"><div class="panel-h"><h3>Shift requests</h3></div>${sw.length ? sw.map(s => `<div class="list-item">${av(emp(s.from))}<div class="grow small"><b style="font-weight:500">${esc(emp(s.from).name)}</b> ${s.kind === 'change' ? '→ ' + esc((DB.shiftTemplates.find(t => t.id === s.tpl) || { name:'Off' }).name) : '⇄ ' + esc(emp(s.to).name)}<div class="muted">${fd(s.date)} · ${esc(s.reason)}</div></div>${s.status === 'Pending' && (isAdmin() || isMgr()) ? `<button class="btn sm good" data-act="approve" data-kind="swap" data-id="${s.id}">Approve</button>` : sp(s.status)}</div>`).join('') : '<div class="empty">No shift requests.</div>'}</div>
      <div class="panel"><div class="panel-h"><h3>Overtime this month</h3><span class="sub">Auto-calculated beyond 9 h/day and weekend shifts</span></div><div class="panel-b">${hbars(ot.map(o => ({ label: emp(o.emp).name, value:o.hours, kind: o.hours > 15 ? 'warn' : '' })), { fmt: v => v + ' h', max: 25 })}</div></div>
    </div>`;
  }
});
act('shiftNav', d => { const s = UI.shiftWeek ? parseD(UI.shiftWeek) : addD(TODAY(), -((TODAY().getDay() + 6) % 7)); UI.shiftWeek = isoD(addD(s, +d.d)); rerender(); });
act('editShift', d => openModal('Shift for ' + emp(d.emp).name, `<div class="small sec">${fd(d.date)}</div><div class="stack">${DB.shiftTemplates.concat([{ id:'OFF', name:'Off', time:'' }]).map(t => `<label class="row"><input type="radio" name="shtpl" value="${t.id}" ${(DB.shifts.find(s => s.emp === d.emp && s.date === d.date) || { tpl:'OFF' }).tpl === t.id ? 'checked' : ''} style="accent-color:var(--blue)"> ${t.name} <span class="muted small">${t.time}</span></label>`).join('')}</div>`, `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveShift" data-emp="${d.emp}" data-date="${d.date}">Save</button>`));
act('saveShift', d => { const v = (document.querySelector('input[name="shtpl"]:checked') || {}).value; DB.shifts = DB.shifts.filter(s => !(s.emp === d.emp && s.date === d.date)); if (v && v !== 'OFF') DB.shifts.push({ emp:d.emp, date:d.date, tpl:v }); notify(d.emp, 'Your shift on ' + fds(d.date) + ' changed to ' + (v === 'OFF' ? 'Off' : DB.shiftTemplates.find(t => t.id === v).name) + '.', 'shifts'); closeOverlay(); toast('Shift updated and ' + emp(d.emp).name + ' notified.'); rerender(); });
act('reqSwap', () => { const mineShifts = DB.shifts.filter(s => s.emp === me().id && s.date >= DB.today); const ppl = DB.employees.filter(e => DB.shifts.some(s => s.emp === e.id) && e.id !== me().id);
  openModal('Request a shift change', mineShifts.length ? `<div class="field"><label for="sw-d">Which shift</label><select class="input" id="sw-d">${mineShifts.map(s => `<option value="${s.date}">${fd(s.date)} · ${DB.shiftTemplates.find(t => t.id === s.tpl).name}</option>`).join('')}</select></div><div class="field"><label for="sw-k">What would you like?</label><select class="input" id="sw-k" data-chg="swKind"><option value="change">Move to a different shift</option><option value="swap">Swap with a colleague</option></select></div><div class="field" id="sw-tpl-f"><label for="sw-tpl">New shift</label><select class="input" id="sw-tpl">${DB.shiftTemplates.map(t => `<option value="${t.id}">${t.name} · ${t.time}</option>`).join('')}<option value="OFF">Day off</option></select></div><div class="field" id="sw-to-f" hidden><label for="sw-to">Swap with</label><select class="input" id="sw-to">${empOptions(ppl)}</select></div><div class="field"><label for="sw-r">Reason</label><input class="input" id="sw-r"></div><div class="small muted">Your manager approves the request. You can’t change the rota directly.</div>` : '<div class="note">You have no upcoming shifts.</div>', mineShifts.length ? `<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="saveSwap">Send request</button>` : `<button class="btn" data-act="close">Close</button>`); });
act('swKind', (d, el) => { document.getElementById('sw-tpl-f').hidden = el.value !== 'change'; document.getElementById('sw-to-f').hidden = el.value !== 'swap'; });
act('saveSwap', () => { const kind = val('sw-k'); DB.swapRequests.unshift({ id:'SW' + Date.now() % 10000, kind, from: me().id, to: kind === 'swap' ? val('sw-to') : null, tpl: kind === 'change' ? val('sw-tpl') : null, date: val('sw-d'), status:'Pending', reason: val('sw-r') || '—' }); if (me().managerId) notify(me().managerId, me().name + ' requested a shift ' + kind + ' for ' + fds(val('sw-d')) + '.', 'inbox'); closeOverlay(); toast('Request sent to your manager.'); rerender(); });
