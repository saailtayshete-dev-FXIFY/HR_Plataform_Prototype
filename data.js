/* Cobalt HR prototype — dummy data. Everything here is invented placeholder data. */
(function(){
  let seed = 20261106;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const int = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const TODAY = new Date(2026, 10, 6); // Fri 6 Nov 2026
  const iso = d => { const x = new Date(d); return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0'); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  const depts = [
    { id:'ENG', name:'Engineering', color:'#1f5fd6' },
    { id:'PRD', name:'Product', color:'#3a78dc' },
    { id:'DSN', name:'Design', color:'#5b8fe6' },
    { id:'SAL', name:'Sales', color:'#123f94' },
    { id:'MKT', name:'Marketing', color:'#2d6bcf' },
    { id:'PPL', name:'People Ops', color:'#4a82e0' },
    { id:'FIN', name:'Finance', color:'#0e3478' },
    { id:'CSX', name:'Customer Success', color:'#6f9ee8' }
  ];

  // [name, title, dept, managerIndex|null]
  const roster = [
    ['Aarav Mehta','Chief Executive Officer','PPL',null],
    ['Priya Nair','Head of People','PPL',0],
    ['Rohan Kapoor','VP Engineering','ENG',0],
    ['Meera Iyer','Head of Product','PRD',0],
    ['Daniel Fernandes','Head of Sales','SAL',0],
    ['Sana Qureshi','Finance Lead','FIN',0],
    ['Kabir Malhotra','Engineering Manager','ENG',2],
    ['Ananya Rao','Engineering Manager','ENG',2],
    ['Vikram Shetty','Senior Backend Engineer','ENG',6],
    ['Ishita Bose','Frontend Engineer','ENG',6],
    ['Arjun Pillai','Backend Engineer','ENG',6],
    ['Neha Kulkarni','QA Engineer','ENG',6],
    ['Farhan Sheikh','DevOps Engineer','ENG',7],
    ['Tara D’Souza','Senior Frontend Engineer','ENG',7],
    ['Karthik Raman','Mobile Engineer','ENG',7],
    ['Zoya Khan','Data Engineer','ENG',7],
    ['Aditya Joshi','Software Engineer Intern','ENG',7],
    ['Lakshmi Menon','Product Manager','PRD',3],
    ['Nikhil Verma','Product Manager','PRD',3],
    ['Riya Chatterjee','Design Lead','DSN',3],
    ['Omkar Patil','Product Designer','DSN',19],
    ['Simran Gill','UX Researcher','DSN',19],
    ['Rahul Saxena','Account Executive','SAL',4],
    ['Pooja Hegde','Account Executive','SAL',4],
    ['Manish Agarwal','Sales Development Rep','SAL',4],
    ['Kavya Reddy','Sales Development Rep','SAL',4],
    ['Siddharth Das','Marketing Manager','MKT',3],
    ['Aisha Siddiqui','Content Strategist','MKT',26],
    ['Yash Thakur','Performance Marketer','MKT',26],
    ['Divya Krishnan','HR Business Partner','PPL',1],
    ['Gaurav Bhatt','Talent Acquisition Lead','PPL',1],
    ['Nisha Pandey','People Ops Associate','PPL',1],
    ['Harsh Vardhan','Accountant','FIN',5],
    ['Shreya Ghosh','Payroll Specialist','FIN',5],
    ['Amit Sinha','Customer Success Lead','CSX',4],
    ['Rhea Mathew','Customer Success Manager','CSX',34],
    ['Varun Nambiar','Support Engineer','CSX',34],
    ['Tanvi Desai','Support Engineer','CSX',34],
    ['Imran Ali','Solutions Consultant','CSX',34],
    ['Sneha Jain','Backend Engineer','ENG',6],
    ['Pranav Kulkarni','Site Reliability Engineer','ENG',7],
    ['Maya Fernandes','Brand Designer','DSN',19],
    ['Kunal Arora','Account Executive','SAL',4],
    ['Leela Raghavan','Payroll Associate','FIN',5],
    ['Ritesh Yadav','Support Engineer','CSX',34]
  ];
  const locations = ['Bengaluru','Pune','Mumbai','Hyderabad','Remote'];
  const bandByTitle = t => /Chief|VP|Head/.test(t) ? 'L7' : /Lead|Manager/.test(t) ? 'L5' : /Senior/.test(t) ? 'L4' : /Intern/.test(t) ? 'L0' : pick(['L2','L3']);
  const baseSalary = { L0: 4.2, L2: 11, L3: 17, L4: 26, L5: 36, L6: 48, L7: 72 }; // LPA (lakhs per annum)

  const employees = roster.map((r, i) => {
    const [name, title, dept, mgr] = r;
    const id = 'E' + String(i + 1).padStart(3, '0');
    const first = name.split(' ')[0].toLowerCase().replace(/[^a-z]/g,'');
    const last = name.split(' ').slice(-1)[0].toLowerCase().replace(/[^a-z]/g,'');
    const band = bandByTitle(title);
    const joinYear = i < 6 ? int(2017, 2019) : int(2019, 2026);
    let join = new Date(joinYear, int(0, 11), int(1, 28));
    if (join > TODAY) join = addDays(TODAY, -int(30, 300));
    let status = 'Active';
    if (i === 16 || i === 43) { status = 'Onboarding'; join = addDays(TODAY, i === 16 ? -4 : 3); }
    if (i === 24) status = 'Notice period';
    if (i === 21) status = 'On leave';
    const lpa = Math.round((baseSalary[band] * (0.88 + rnd() * 0.3)) * 10) / 10;
    return {
      id, name, title, dept, band,
      managerId: mgr === null ? null : 'E' + String(mgr + 1).padStart(3, '0'),
      email: first + '.' + last + '@arcadia.example',
      phone: '+91 9' + int(10000000, 99999999) + int(0, 9),
      location: i < 3 ? 'Bengaluru' : pick(locations),
      joinDate: iso(join), status,
      type: /Intern/.test(title) ? 'Intern' : (i === 38 || i === 41 ? 'Contract' : 'Full-time'),
      dob: iso(new Date(int(1979, 2002), int(0, 11), int(1, 28))),
      emergency: pick(['Spouse','Parent','Sibling']) + ' · +91 98' + int(10000000, 99999999),
      lpa,
      pronouns: '',
      address: int(10, 400) + ', ' + pick(['MG Road','Baner Road','Linking Road','Banjara Hills','Indiranagar 2nd Stage','Koregaon Park','Whitefield Main Rd']),
      skills: []
    };
  });

  const skillCatalog = {
    ENG: ['TypeScript','React','Node.js','Python','PostgreSQL','AWS','Kubernetes','System design','Testing'],
    PRD: ['Roadmapping','User research','Analytics','Prioritisation','Stakeholder mgmt','SQL'],
    DSN: ['Figma','Interaction design','Prototyping','Visual design','User research','Design systems'],
    SAL: ['Prospecting','Negotiation','CRM hygiene','Discovery calls','Forecasting'],
    MKT: ['SEO','Copywriting','Paid social','Analytics','Brand'],
    PPL: ['Employee relations','Recruiting','Labour law','Compensation','Onboarding'],
    FIN: ['Payroll','GST','Excel modelling','Reporting','Statutory compliance'],
    CSX: ['Support tooling','Onboarding','Escalations','Product knowledge','SQL']
  };
  employees.forEach(e => {
    const cat = skillCatalog[e.dept];
    const n = int(3, Math.min(5, cat.length));
    const shuffled = cat.slice().sort(() => rnd() - .5).slice(0, n);
    e.skills = shuffled.map(s => ({ name: s, level: int(1, 5) }));
  });

  const holidays = [
    { date:'2026-11-08', name:'Diwali (Lakshmi Puja)' },
    { date:'2026-11-09', name:'Diwali holiday' },
    { date:'2026-11-24', name:'Guru Nanak Jayanti' },
    { date:'2026-12-25', name:'Christmas' },
    { date:'2027-01-01', name:'New Year' },
    { date:'2027-01-26', name:'Republic Day' }
  ];

  const leaveTypes = [
    { id:'EL', name:'Earned leave', quota:18, carry:true },
    { id:'SL', name:'Sick leave', quota:12, carry:false },
    { id:'CL', name:'Casual leave', quota:6, carry:false },
    { id:'WFH', name:'Work from home', quota:24, carry:false },
    { id:'PL', name:'Parental leave', quota:0, carry:false, note:'26 weeks maternity / 2 weeks paternity on request' }
  ];

  const leaves = [];
  let lid = 1;
  employees.forEach((e, i) => {
    const n = int(1, 4);
    for (let k = 0; k < n; k++) {
      const t = pick(['EL','EL','SL','CL','WFH']);
      const start = addDays(TODAY, int(-150, 40));
      const days = t === 'EL' ? int(1, 5) : int(1, 2);
      const end = addDays(start, days - 1);
      let status = start < TODAY ? 'Approved' : (rnd() < .2 ? 'Pending' : 'Approved');
      if (start < TODAY && rnd() < .08) status = 'Rejected';
      leaves.push({ id:'LV' + (lid++), emp:e.id, type:t, from:iso(start), to:iso(end), days, status, reason: pick(['Family function','Travel','Not feeling well','Personal errand','Festival at home','Doctor appointment','Moving house']), applied: iso(addDays(start, -int(2, 14))) });
    }
  });
  // guaranteed pending items for the demo
  [['E009','EL',10,3,'Diwali travel to Mangaluru'],['E023','CL',4,1,'Personal errand'],['E011','SL',0,1,'Fever'],['E028','EL',18,4,'Family wedding'],['E036','WFH',3,2,'Internet installer visit']].forEach(([emp,t,off,d,r])=>{
    leaves.push({ id:'LV'+(lid++), emp, type:t, from:iso(addDays(TODAY,off)), to:iso(addDays(TODAY,off+d-1)), days:d, status:'Pending', reason:r, applied:iso(addDays(TODAY,-1)) });
  });
  // people out today (approved)
  [['E019','EL',-1,2,'Family visit'],['E027','SL',0,1,'Migraine'],['E033','EL',-2,3,'Diwali at home'],['E014','WFH',0,1,'Plumber visit'],['E040','WFH',0,1,'Focus day']].forEach(([emp,t,off,d,r])=>{
    leaves.push({ id:'LV'+(lid++), emp, type:t, from:iso(addDays(TODAY,off)), to:iso(addDays(TODAY,off+d-1)), days:d, status:'Approved', reason:r, applied:iso(addDays(TODAY,-6)) });
  });

  // attendance: last 20 working days
  const attendance = [];
  employees.forEach(e => {
    for (let k = 27; k >= 0; k--) {
      const d = addDays(TODAY, -k);
      const wd = d.getDay();
      if (wd === 0 || wd === 6) continue;
      if (e.status === 'Onboarding' && new Date(e.joinDate) > d) continue;
      const onLeave = leaves.find(l => l.emp === e.id && l.status === 'Approved' && l.type !== 'WFH' && iso(d) >= l.from && iso(d) <= l.to);
      if (onLeave) { attendance.push({ emp:e.id, date:iso(d), status:'Leave', in:'', out:'', hours:0 }); continue; }
      if (k === 0) {
        const r = rnd();
        if (r < .12) { attendance.push({ emp:e.id, date:iso(d), status:'Absent', in:'', out:'', hours:0 }); continue; }
        const inH = 9 + (rnd() < .2 ? 1 : 0), inM = int(0, 50);
        attendance.push({ emp:e.id, date:iso(d), status: 'Present', in: String(inH).padStart(2,'0') + ':' + String(inM).padStart(2,'0'), out:'', hours:0 });
        continue;
      }
      const r = rnd();
      const late = r < .1;
      const absent = r > .975;
      if (absent) { attendance.push({ emp:e.id, date:iso(d), status:'Absent', in:'', out:'', hours:0 }); continue; }
      const inH = late ? 10 : 9, inM = int(0, 45);
      const hrs = Math.round((7.6 + rnd() * 2.6 + (['E009','E013','E041','E015'].includes(e.id) ? 1.6 : 0)) * 10) / 10;
      const outTotal = inH * 60 + inM + Math.round(hrs * 60);
      attendance.push({ emp:e.id, date:iso(d), status: 'Present', in: String(inH).padStart(2,'0') + ':' + String(inM).padStart(2,'0'), out: String(Math.floor(outTotal/60)).padStart(2,'0') + ':' + String(outTotal%60).padStart(2,'0'), hours: hrs });
    }
  });

  // OKRs
  const okrs = [
    { id:'O1', level:'Company', owner:'E001', title:'Grow ARR to ₹48 Cr by March 2027', quarter:'Q3 FY27', parent:null, krs:[
      { t:'Close 40 new mid-market logos', cur:27, target:40, unit:'' },
      { t:'Net revenue retention at 112%', cur:108, target:112, unit:'%' },
      { t:'Reduce sales cycle to 38 days', cur:44, target:38, unit:' days', inverse:true } ] },
    { id:'O2', level:'Company', owner:'E001', title:'Make Arcadia a place people stay', quarter:'Q3 FY27', parent:null, krs:[
      { t:'Mandatory training completion', cur:68, target:95, unit:'%' },
      { t:'Regretted attrition below 6%', cur:7.2, target:6, unit:'%', inverse:true },
      { t:'Every new joiner onboarded within 30 days', cur:82, target:100, unit:'%' } ] },
    { id:'O3', level:'Team', owner:'E003', title:'Ship the v4 platform with zero Sev-1 incidents', quarter:'Q3 FY27', parent:'O1', krs:[
      { t:'Migrate 100% of tenants to v4', cur:64, target:100, unit:'%' },
      { t:'p95 API latency under 220ms', cur:240, target:220, unit:'ms', inverse:true },
      { t:'Sev-1 incidents', cur:0, target:0, unit:'', binary:true } ] },
    { id:'O4', level:'Team', owner:'E002', title:'Build a fair, fast performance cycle', quarter:'Q3 FY27', parent:'O2', krs:[
      { t:'Review completion rate', cur:72, target:95, unit:'%' },
      { t:'Calibration done for all 8 teams', cur:3, target:8, unit:'' } ] },
    { id:'O5', level:'Team', owner:'E005', title:'Build a predictable mid-market pipeline', quarter:'Q3 FY27', parent:'O1', krs:[
      { t:'Qualified pipeline ₹9 Cr', cur:6.1, target:9, unit:' Cr' },
      { t:'SDR meetings booked per week', cur:22, target:30, unit:'' } ] }
  ];

  const goals = [];
  let gid = 1;
  const goalTitles = {
    ENG:['Ship tenant migration tooling','Cut CI build time by 30%','Write the v4 auth design doc','Raise unit test coverage to 80%','Own the on-call runbook refresh'],
    PRD:['Launch usage-based billing beta','Run 12 customer discovery calls','Publish H2 roadmap'],
    DSN:['Ship design system v2 tokens','Usability test onboarding flow','Redesign billing settings'],
    SAL:['Close ₹1.2 Cr new ARR','Build 3x pipeline coverage','Complete MEDDIC certification'],
    MKT:['Publish 8 SEO pillar pages','Cut CAC by 15% on paid social','Launch customer story series'],
    PPL:['Roll out new leave policy','Hire 6 engineers this quarter','Run manager training cohort'],
    FIN:['Close books in 5 working days','Automate GST reconciliation','Finish statutory audit prep'],
    CSX:['Hold CSAT at 4.6+','Reduce first response time to 2h','Create 20 help-centre articles']
  };
  employees.forEach(e => {
    const n = int(2, 3);
    const titles = goalTitles[e.dept].slice().sort(() => rnd() - .5).slice(0, n);
    titles.forEach(t => {
      const p = int(5, 100);
      goals.push({ id:'G' + (gid++), emp:e.id, title:t, progress:p, due: iso(addDays(TODAY, int(-10, 120))), status: p >= 100 ? 'Done' : p < 30 && rnd() < .4 ? 'At risk' : 'On track', okr: e.dept === 'ENG' ? 'O3' : e.dept === 'SAL' ? 'O5' : e.dept === 'PPL' ? 'O4' : null, updates: [] });
    });
  });

  // review cycles
  const cycles = [
    { id:'RC2', name:'H1 FY27 Performance Review', period:'Apr – Sep 2026', status:'In progress', due:'2026-11-20', types:['Self','Manager','Peer','Upward'] },
    { id:'RC1', name:'H2 FY26 Performance Review', period:'Oct 2025 – Mar 2026', status:'Closed', due:'2026-04-30', types:['Self','Manager','Peer'] }
  ];
  const reviewQuestions = [
    'What were your most important contributions this period?',
    'Where did you fall short, and what got in the way?',
    'Which company value did you show most clearly? Give an example.',
    'What do you want to grow in over the next six months?'
  ];
  const ratingLabels = ['','Needs improvement','Developing','Meets expectations','Exceeds expectations','Outstanding'];
  const reviews = [];
  let rid = 1;
  employees.forEach(e => {
    if (e.status === 'Onboarding') return;
    // closed cycle
    reviews.push({ id:'RV' + (rid++), cycle:'RC1', emp:e.id, reviewer:e.managerId || e.id, kind:'Manager', status:'Submitted', rating:int(2,5), answers: reviewQuestions.map(()=> pick(['Delivered reliably and raised the bar for the team.','Strong quarter with clear ownership of outcomes.','Solid execution; communication with stakeholders can be crisper.','Needs to plan dependencies earlier.'])) });
    // current cycle
    const selfDone = rnd() < .78;
    reviews.push({ id:'RV' + (rid++), cycle:'RC2', emp:e.id, reviewer:e.id, kind:'Self', status: selfDone ? 'Submitted' : 'Not started', rating: selfDone ? int(3,5) : 0, answers: selfDone ? reviewQuestions.map(()=> pick(['I owned the migration tooling end to end and unblocked two teams.','I helped onboard three new teammates and wrote the runbook.','I missed the August deadline because of scope creep; I now break work into smaller milestones.','I want to grow in system design and mentoring.'])) : [] });
    if (e.managerId) {
      const mgrDone = selfDone && rnd() < .6;
      reviews.push({ id:'RV' + (rid++), cycle:'RC2', emp:e.id, reviewer:e.managerId, kind:'Manager', status: mgrDone ? 'Submitted' : selfDone ? 'In progress' : 'Not started', rating: mgrDone ? int(2,5) : 0, answers: mgrDone ? reviewQuestions.map(()=> pick(['Consistently dependable; took on the hardest tickets.','Great collaborator; should push back more on unclear asks.','Clear growth this half, especially in ownership.'])) : [] });
      const peers = employees.filter(p => p.dept === e.dept && p.id !== e.id && p.id !== e.managerId);
      if (peers.length) {
        const p = pick(peers);
        const pd = rnd() < .55;
        reviews.push({ id:'RV' + (rid++), cycle:'RC2', emp:e.id, reviewer:p.id, kind:'Peer', status: pd ? 'Submitted' : 'Not started', rating: pd ? int(3,5) : 0, answers: pd ? reviewQuestions.map(()=> pick(['Always willing to pair and explain.','Reliable in code review, thorough feedback.','Could share context earlier in projects.'])) : [] });
      }
    }
  });

  const feedback = [];
  const fbTexts = [
    'Your walkthrough of the incident timeline made the postmortem so much easier to follow. Thank you.',
    'The customer demo on Tuesday was sharp. Next time, open with the ROI slide; that is what landed.',
    'Thanks for jumping on the escalation late on Friday. It saved the renewal.',
    'Your PR descriptions are a model for the team. Clear context, clear test plan.',
    'In planning, try to call out risks earlier. We found the API dependency late.',
    'Loved how you handled the hard question from the client. Calm and honest.',
    'The research synthesis deck was excellent; the quotes really sold the problem.',
    'Could you loop design in before the spec is final? A few decisions surprised us.'
  ];
  for (let k = 0; k < 34; k++) {
    const from = pick(employees), to = pick(employees.filter(x => x.id !== from.id));
    feedback.push({ id:'FB' + (k + 1), from:from.id, to:to.id, text:pick(fbTexts), type: rnd() < .7 ? 'Praise' : 'Suggestion', visibility: rnd() < .6 ? 'Shared with manager' : 'Private', date: iso(addDays(TODAY, -int(0, 60))) });
  }
  feedback.sort((a,b)=> b.date.localeCompare(a.date));

  // surveys
  const surveys = [
    { id:'SV3', title:'November pulse', status:'Open', anonymous:true, launched:'2026-11-02', closes:'2026-11-13', audience:'All employees', questions:[
      { id:'q1', type:'enps', text:'How likely are you to recommend Arcadia as a place to work?' },
      { id:'q2', type:'scale', text:'I have the tools and resources to do my job well.' },
      { id:'q3', type:'scale', text:'My workload is manageable.' },
      { id:'q4', type:'scale', text:'My manager cares about my wellbeing.' },
      { id:'q5', type:'text', text:'What is one thing we should change?' } ], responses:[] },
    { id:'SV2', title:'October pulse', status:'Closed', anonymous:true, launched:'2026-10-05', closes:'2026-10-16', audience:'All employees', questions:[], responses:[] },
    { id:'SV1', title:'Q2 engagement survey', status:'Closed', anonymous:true, launched:'2026-07-06', closes:'2026-07-24', audience:'All employees', questions:[], responses:[] }
  ];
  // generate responses for SV3 (partial participation)
  const comments = ['Fewer meetings on Wednesdays please.','Clearer promotion criteria.','The new laptop refresh was great.','On-call is heavy for the platform team.','More cross-team demos.','Faster reimbursement approvals.','Better onboarding docs for new joiners.','Quarterly offsites were great; bring them back.'];
  employees.forEach(e => {
    if (rnd() < .64) {
      const strain = ['ENG','CSX'].includes(e.dept) ? -1 : 0;
      surveys[0].responses.push({ emp:e.id, dept:e.dept, answers:{ q1: Math.max(0, Math.min(10, pick([10,10,9,9,9,9,8,8,7,6,5,10,9]) + strain)),q2: int(3, 5), q3: Math.max(1, int(2, 5) + strain), q4: int(3, 5), q5: rnd() < .45 ? pick(comments) : '' } });
    }
  });
  const enpsHistory = [
    { m:'Jun', v:22 }, { m:'Jul', v:24 }, { m:'Aug', v:21 }, { m:'Sep', v:27 }, { m:'Oct', v:29 }
  ];

  // wellbeing check-ins (weekly, last 8 weeks)
  const wellbeing = [];
  employees.forEach(e => {
    const optedIn = rnd() < .93;
    if (!optedIn) return;
    const strained = ['E009','E013','E015','E041','E036','E037'].includes(e.id);
    for (let w = 7; w >= 0; w--) {
      if (rnd() < .1) continue;
      const base = strained ? 3.4 - (7 - w) * 0.18 : 3.9 + rnd() * 0.6;
      const mood = Math.max(1, Math.min(5, Math.round(base + (rnd() - .5))));
      const stress = Math.max(1, Math.min(5, Math.round((strained ? 2.6 + (7 - w) * .22 : 2.1) + (rnd() - .5) * 1.2)));
      const workload = Math.max(1, Math.min(5, Math.round((strained ? 3.3 + (7 - w) * .15 : 2.9) + (rnd() - .5))));
      wellbeing.push({ emp:e.id, dept:e.dept, week: iso(addDays(TODAY, -w * 7 - TODAY.getDay() + 1)), mood, stress, workload, sleep: int(5, 8), note: w === 0 && strained && rnd() < .7 ? pick(['Release crunch is wearing me down.','Too many escalations this week.','Struggling to switch off after work.']) : '', shareWithManager: rnd() < .5 });
    }
  });
  const wellbeingResources = [
    { t:'Employee Assistance Programme', d:'Free, confidential counselling. 6 sessions per year for you and your family.', tag:'Counselling' },
    { t:'Mental health days', d:'Two extra paid days per year. No reason needed; just mark them in Leave.', tag:'Policy' },
    { t:'Focus Fridays', d:'No internal meetings after 1 pm on Fridays, company-wide.', tag:'Policy' },
    { t:'Gym and wellness allowance', d:'₹1,500 per month, claim through Expenses.', tag:'Benefit' },
    { t:'Manager guide: spotting burnout early', d:'A 10-minute read on signals and how to open the conversation.', tag:'Guide' }
  ];

  const values = ['Own the outcome','Customer first','Raise the bar','Be candid, be kind'];
  const kudos = [];
  const kudoTexts = [
    'stayed late to get the hotfix out for Bluewave Retail. True ownership.',
    'turned a frustrated customer into a renewal. Incredible patience.',
    'rewrote the onboarding guide so new joiners are productive in a week.',
    'gave me honest feedback on my deck that made it twice as good.',
    'automated the GST reconciliation and saved the team two days a month.',
    'ran the cleanest sprint demo we have had all year.',
    'covered my on-call shift while I was unwell. Thank you!',
    'mentored two interns through their first production release.'
  ];
  for (let k = 0; k < 26; k++) {
    const from = pick(employees), to = pick(employees.filter(x => x.id !== from.id));
    kudos.push({ id:'KD' + (k + 1), from:from.id, to:to.id, value: pick(values), text: pick(kudoTexts), date: iso(addDays(TODAY, -int(0, 45))), reactions: int(0, 18), reacted:false });
  }
  kudos.sort((a,b)=> b.date.localeCompare(a.date));

  const announcements = [
    { id:'AN1', title:'Diwali holidays: office closed 8–9 November', body:'Wishing everyone a bright and happy Diwali. Offices are closed Sunday 8 and Monday 9 November. Support on-call rotation is posted in the Shifts page.', author:'E002', date:'2026-11-03', pinned:true, audience:'All employees', reads:38 },
    { id:'AN2', title:'H1 performance reviews close 20 November', body:'Self-reviews are due 13 November and manager reviews 20 November. Calibration sessions start the week after. Questions? Ask Divya in People Ops.', author:'E002', date:'2026-11-02', pinned:true, audience:'All employees', reads:41 },
    { id:'AN3', title:'New: mental health days', body:'Starting this month everyone gets two extra paid mental health days per year. No reason or approval chain needed beyond your manager seeing the request.', author:'E002', date:'2026-10-28', pinned:false, audience:'All employees', reads:44 },
    { id:'AN4', title:'v4 platform migration hits 64%', body:'Huge thanks to the platform team. We are on track to finish tenant migration before year end.', author:'E003', date:'2026-10-24', pinned:false, audience:'Engineering', reads:17 },
    { id:'AN5', title:'Laptop refresh for 2022 devices', body:'If your laptop was issued in 2022 or earlier, IT will reach out this month to schedule a swap. Check the Assets page for your device.', author:'E032', date:'2026-10-15', pinned:false, audience:'All employees', reads:36 }
  ];

  const courses = [
    { id:'C1', title:'POSH: Prevention of Sexual Harassment', category:'Compliance', mandatory:true, duration:45, due:'2026-11-30' },
    { id:'C2', title:'Information security basics', category:'Compliance', mandatory:true, duration:30, due:'2026-12-15' },
    { id:'C3', title:'Data privacy and the DPDP Act', category:'Compliance', mandatory:true, duration:35, due:'2026-12-31' },
    { id:'C4', title:'Giving feedback that lands', category:'Leadership', mandatory:false, duration:40, due:null },
    { id:'C5', title:'Coaching your team', category:'Leadership', mandatory:false, duration:25, due:null },
    { id:'C6', title:'System design fundamentals', category:'Technical', mandatory:false, duration:180, due:null },
    { id:'C7', title:'Consultative selling', category:'Sales', mandatory:false, duration:90, due:null },
    { id:'C8', title:'Managing stress and energy', category:'Wellbeing', mandatory:false, duration:20, due:null }
  ];
  const enrollments = [];
  employees.forEach(e => {
    ['C1','C2','C3'].forEach(c => {
      const r = rnd();
      enrollments.push({ emp:e.id, course:c, status: e.status === 'Onboarding' ? 'Not started' : r < .62 ? 'Completed' : r < .85 ? 'In progress' : 'Not started', progress: 0, completed: null });
    });
    if (/Manager|Lead|Head|VP/.test(e.title)) { enrollments.push({ emp:e.id, course:'C5', status: pick(['Completed','In progress']), progress:0, completed:null }); }
    if (e.dept === 'ENG' && rnd() < .5) enrollments.push({ emp:e.id, course:'C6', status: pick(['In progress','Completed','Not started']), progress:0, completed:null });
    if (e.dept === 'SAL') enrollments.push({ emp:e.id, course:'C7', status: pick(['In progress','Completed']), progress:0, completed:null });
  });
  enrollments.forEach(en => { en.progress = en.status === 'Completed' ? 100 : en.status === 'In progress' ? int(15, 85) : 0; en.completed = en.status === 'Completed' ? iso(addDays(TODAY, -int(2, 90))) : null; });

  // shifts (support rota for CSX + SRE on-call)
  const shiftTemplates = [
    { id:'MOR', name:'Morning', time:'07:00–15:00' },
    { id:'EVE', name:'Evening', time:'14:00–22:00' },
    { id:'NGT', name:'Night', time:'22:00–07:00' },
    { id:'ONC', name:'On-call', time:'24h' }
  ];
  const shifts = [];
  const shiftPeople = employees.filter(e => e.dept === 'CSX' || ['E013','E041','E009','E010'].includes(e.id));
  for (let k = -3; k < 14; k++) {
    const d = addDays(TODAY, k);
    shiftPeople.forEach((e, i) => {
      let tpl;
      if (e.dept === 'CSX') tpl = ['MOR','EVE','NGT','MOR','EVE','OFF'][(i + k + 30) % 6];
      else tpl = (i + Math.floor((k + 30) / 7)) % 3 === 0 ? 'ONC' : 'OFF';
      if (tpl !== 'OFF') shifts.push({ emp:e.id, date:iso(d), tpl });
    });
  }
  const swapRequests = [ { id:'SW1', kind:'swap', from:'E037', to:'E038', date: iso(addDays(TODAY, 3)), status:'Pending', reason:'Family function in the evening' } ];
  const overtime = shiftPeople.map(e => ({ emp:e.id, hours: Math.round(rnd() * (['E013','E041','E036','E037'].includes(e.id) ? 22 : 9) * 10) / 10 }));

  const expenseCats = ['Travel','Meals','Internet','Wellness','Equipment','Client entertainment','Training'];
  const expenses = [];
  for (let k = 0; k < 30; k++) {
    const e = pick(employees);
    const cat = pick(expenseCats);
    const amt = cat === 'Travel' ? int(1800, 24000) : cat === 'Equipment' ? int(1500, 18000) : cat === 'Wellness' ? 1500 : cat === 'Internet' ? int(799, 1499) : int(450, 6500);
    const date = addDays(TODAY, -int(0, 50));
    const status = date > addDays(TODAY, -8) ? pick(['Submitted','Submitted','Manager approved']) : pick(['Paid','Paid','Finance approved','Rejected']);
    expenses.push({ id:'EX' + String(k + 101), emp:e.id, cat, amount:amt, date:iso(date), desc: { Travel:'Cab and flights for client visit', Meals:'Team dinner after release', Internet:'Home broadband – monthly', Wellness:'Gym membership', Equipment:'Ergonomic keyboard', 'Client entertainment':'Lunch with Bluewave Retail team', Training:'Conference ticket' }[cat], status, receipt: rnd() < .9 });
  }
  expenses.sort((a,b)=> b.date.localeCompare(a.date));

  const assetTypes = [ ['Laptop','MacBook Pro 14" M3'], ['Laptop','Dell Latitude 7440'], ['Monitor','Dell U2723QE 27"'], ['Phone','iPhone 15'], ['Headset','Jabra Evolve2 65'], ['Access card','Office access card'] ];
  const assets = [];
  let aid = 1;
  employees.forEach(e => {
    const lap = e.dept === 'ENG' || e.dept === 'DSN' ? assetTypes[0] : assetTypes[1];
    const year = int(2021, 2026);
    assets.push({ id:'AS-' + String(aid++).padStart(4,'0'), type:lap[0], model:lap[1], serial: 'SN' + int(100000, 999999), emp: e.status === 'Onboarding' && rnd() < .5 ? null : e.id, issued: iso(new Date(Math.max(year, +e.joinDate.slice(0,4)), int(0,11), int(1,28))), condition: year <= 2022 ? 'Due for refresh' : 'Good' });
    if (rnd() < .5) assets.push({ id:'AS-' + String(aid++).padStart(4,'0'), type:'Monitor', model:assetTypes[2][1], serial:'SN' + int(100000,999999), emp:e.id, issued:e.joinDate, condition:'Good' });
    assets.push({ id:'AS-' + String(aid++).padStart(4,'0'), type:'Access card', model:'Office access card', serial:'AC' + int(1000,9999), emp:e.status === 'Onboarding' ? null : e.id, issued:e.joinDate, condition:'Good' });
  });
  for (let k = 0; k < 6; k++) assets.push({ id:'AS-' + String(aid++).padStart(4,'0'), type: pick(['Laptop','Monitor','Headset']), model: pick([assetTypes[0][1], assetTypes[2][1], assetTypes[4][1]]), serial:'SN' + int(100000,999999), emp:null, issued:null, condition:'In stock' });

  // hiring
  const jobs = [
    { id:'J1', title:'Senior Backend Engineer', dept:'ENG', location:'Bengaluru / Remote', type:'Full-time', openings:2, status:'Open', posted:'2026-09-22', hm:'E007', budget:'₹30–38 LPA' },
    { id:'J2', title:'Product Designer', dept:'DSN', location:'Pune', type:'Full-time', openings:1, status:'Open', posted:'2026-10-10', hm:'E020', budget:'₹18–24 LPA' },
    { id:'J3', title:'Account Executive – Mid-market', dept:'SAL', location:'Mumbai', type:'Full-time', openings:2, status:'Open', posted:'2026-10-01', hm:'E005', budget:'₹14–20 LPA + OTE' },
    { id:'J4', title:'Customer Success Manager', dept:'CSX', location:'Hyderabad', type:'Full-time', openings:1, status:'Open', posted:'2026-10-18', hm:'E035', budget:'₹12–16 LPA' },
    { id:'J5', title:'Data Analyst', dept:'FIN', location:'Remote', type:'Contract', openings:1, status:'Draft', posted:null, hm:'E006', budget:'₹1.2 L / month' }
  ];
  const stages = ['Applied','Screen','Interview','Offer','Hired'];
  const candNames = ['Aditi Sharma','Rajat Mishra','Sonal Kaur','Devansh Rao','Fatima Noor','Ketan Shah','Ira Banerjee','Mohit Goyal','Nandini Pillai','Abhishek Tiwari','Ruchi Mehra','Samar Khanna','Esha Dutta','Tejas Naik','Payal Bhatia','Kiran Joseph','Ved Prakash','Anjali Rawat','Zubin Irani','Pallavi Sen','Harshita Lal','Rehan Mirza'];
  const candidates = candNames.map((n, k) => {
    const job = jobs[k % 4];
    const st = stages[Math.min(4, Math.floor(rnd() * rnd() * 5.2))];
    return { id:'CD' + (k + 1), name:n, job:job.id, stage:st, source: pick(['LinkedIn','Referral','Careers page','Naukri','Agency']), applied: iso(addDays(TODAY, -int(2, 40))), rating: int(2, 5), email: n.toLowerCase().replace(' ', '.') + '@mail.example', exp: int(2, 11) + ' yrs', current: pick(['Freshworks','Zoho','Razorpay','Swiggy','Infosys','TCS','Postman','Chargebee','Unacademy','Meesho']), notes:[], interviews: st === 'Interview' || st === 'Offer' ? [{ round:'Technical', by: job.hm, score: int(3,5), note:'Good depth; clear communicator.' }] : [] };
  });

  // payroll / compensation
  const payRuns = ['Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026'].map((m, k) => ({ month:m, gross: 0, status: 'Exported', exported: iso(addDays(TODAY, -(5 - k) * 30 + 2)) }));
  const totalMonthly = employees.reduce((s, e) => s + e.lpa * 100000 / 12, 0);
  payRuns.forEach((p, k) => p.gross = Math.round(totalMonthly * (0.96 + k * 0.01)));
  payRuns.push({ month:'Nov 2026', gross: Math.round(totalMonthly), status:'Draft', exported:null });

  // documents
  const docTemplates = ['Offer letter','Employment contract','PAN card','Aadhaar (masked)','Bank proof','Relieving letter (previous employer)','NDA'];
  const documents = [];
  let did = 1;
  employees.forEach(e => {
    docTemplates.forEach((t, k) => {
      const missing = (e.status === 'Onboarding' && k > 2) || rnd() < .05;
      if (!missing) documents.push({ id:'DOC' + (did++), emp:e.id, name:t, category: k < 2 || k >= 5 ? 'Employment' : 'Identity & bank', uploaded: e.joinDate, size: int(80, 900) + ' KB', by: k < 2 ? 'E002' : e.id, signed: k === 0 || k === 1 || k === 6 ? true : null });
    });
  });
  const policies = [
    { id:'P1', name:'Employee handbook 2026', version:'v3.2', updated:'2026-04-01', ack: 0 },
    { id:'P2', name:'Leave and holidays policy', version:'v2.0', updated:'2026-10-28', ack: 0 },
    { id:'P3', name:'Code of conduct', version:'v1.4', updated:'2025-12-10', ack: 0 },
    { id:'P4', name:'POSH policy', version:'v1.1', updated:'2025-08-14', ack: 0 },
    { id:'P5', name:'Remote work and equipment policy', version:'v1.3', updated:'2026-06-02', ack: 0 }
  ];
  const acks = {};
  policies.forEach(p => { acks[p.id] = employees.filter(() => rnd() < (p.id === 'P2' ? .55 : .9)).map(e => e.id); });

  // onboarding / offboarding
  const onboardTemplate = [
    { t:'Send offer letter and collect signature', owner:'HR', phase:'Before day 1' },
    { t:'Collect PAN, Aadhaar and bank proof', owner:'HR', phase:'Before day 1' },
    { t:'Order laptop and access card', owner:'IT', phase:'Before day 1' },
    { t:'Create email, Slack and GitHub accounts', owner:'IT', phase:'Before day 1' },
    { t:'Welcome call with manager', owner:'Manager', phase:'Day 1' },
    { t:'Office tour and buddy introduction', owner:'Buddy', phase:'Day 1' },
    { t:'Sign handbook and code of conduct', owner:'Employee', phase:'Week 1' },
    { t:'Complete POSH and security training', owner:'Employee', phase:'Week 1' },
    { t:'Set first 30-60-90 day goals', owner:'Manager', phase:'Week 2' },
    { t:'30-day check-in with HR', owner:'HR', phase:'Month 1' }
  ];
  const onboarding = [
    { emp:'E017', buddy:'E010', tasks: onboardTemplate.map((x, k) => ({ ...x, done: k < 6 })) },
    { emp:'E044', buddy:'E033', tasks: onboardTemplate.map((x, k) => ({ ...x, done: k < 2 })) }
  ];
  const offboardTemplate = [
    { t:'Accept resignation and confirm last working day', owner:'HR' },
    { t:'Knowledge transfer plan agreed', owner:'Manager' },
    { t:'Handover of open deals and accounts', owner:'Employee' },
    { t:'Return laptop and access card', owner:'Employee' },
    { t:'Revoke system access', owner:'IT' },
    { t:'Exit interview', owner:'HR' },
    { t:'Full and final settlement', owner:'Finance' },
    { t:'Issue relieving and experience letters', owner:'HR' }
  ];
  const offboarding = [
    { emp:'E025', lwd:'2026-11-27', reason:'Better opportunity', regretted:false, tasks: offboardTemplate.map((x, k) => ({ ...x, done: k < 2 })), interview:null }
  ];
  const exits = [
    { name:'Arnav Kohli', dept:'ENG', date:'2026-09-30', reason:'Better opportunity', regretted:true },
    { name:'Meghna Sood', dept:'SAL', date:'2026-08-14', reason:'Relocation', regretted:false },
    { name:'Prateek Jain', dept:'CSX', date:'2026-07-31', reason:'Burnout / workload', regretted:true },
    { name:'Shalini Rao', dept:'MKT', date:'2026-06-20', reason:'Career change', regretted:false },
    { name:'Tushar Gupta', dept:'ENG', date:'2026-05-29', reason:'Compensation', regretted:true }
  ];
  const headcountTrend = [ ['Dec',38],['Jan',39],['Feb',40],['Mar',40],['Apr',41],['May',41],['Jun',42],['Jul',42],['Aug',42],['Sep',43],['Oct',44],['Nov',45] ];

  const integrations = [
    { id:'slack', name:'Slack', desc:'Approval requests and announcements in Slack. Daily digest for managers.', color:'#4a154b', on:true, cat:'Messaging' },
    { id:'teams', name:'Microsoft Teams', desc:'Same notifications for teams on Microsoft 365.', color:'#4b53bc', on:false, cat:'Messaging' },
    { id:'gcal', name:'Google Calendar', desc:'Sync approved leave and holidays to calendars.', color:'#1a73e8', on:true, cat:'Calendar' },
    { id:'outlook', name:'Outlook Calendar', desc:'Sync approved leave and holidays to Outlook.', color:'#0a64ad', on:false, cat:'Calendar' },
    { id:'gsso', name:'Google Workspace SSO', desc:'Sign in with company Google accounts. SAML 2.0.', color:'#34a853', on:true, cat:'Identity' },
    { id:'greenhouse', name:'Job boards', desc:'Post openings to LinkedIn, Naukri and your careers page.', color:'#24a47f', on:true, cat:'Hiring' }
  ];

  const roles = [
    { id:'admin', name:'HR admin', desc:'Everything, including phone numbers, home addresses, bands, every review and every payslip.' },
    { id:'manager', name:'Manager', desc:'Their team’s leave, absences, goals, reviews and expenses. No team salaries or leave history on profiles.' },
    { id:'employee', name:'Employee', desc:'Their own records, the directory and org chart. Goal changes go to their manager for approval.' },
    { id:'finance', name:'Finance', desc:'Salaries, bands, payroll, expenses, assets and ID/bank documents. Otherwise the same as an employee.' }
  ];
  /* agreed in the access review, 12 Nov 2026 */
  const permMatrix = [
    ['Directory, org chart, work email', 'All', 'All', 'All', 'All'],
    ['Phone, home address, emergency contact', 'All', 'Own', 'Own', 'Own'],
    ['Birthday', 'All', 'All', 'All', 'All'],
    ['Job band', 'All', 'None', 'None', 'All (bands page)'],
    ['Salary', 'All', 'Own', 'Own', 'All'],
    ['Leave history on profiles', 'All', 'Own', 'Own', 'Own'],
    ['Leave requests and approvals', 'All', 'Team', 'Own', 'Own'],
    ['Attendance (absences only)', 'All', 'Team', 'Own', 'Own'],
    ['Shift rota', 'All, edit', 'All, edit', 'View, request changes', 'None'],
    ['Goals', 'All', 'Team, approves changes', 'Own (changes need approval)', 'Own'],
    ['OKRs', 'All', 'Team', 'None', 'None'],
    ['Performance reviews', 'All, any time', 'Team', 'Own', 'Own'],
    ['Skills', 'All', 'All', 'Own', 'Own'],
    ['Employee files', 'All', 'Own', 'Own', 'ID and bank docs'],
    ['Expenses', 'All', 'Team approve', 'Own', 'Approve and pay'],
    ['Payslips', 'All', 'Own', 'Own', 'Own'],
    ['Payroll export, salary bands', 'All', 'None', 'None', 'All'],
    ['Hiring', 'All', 'Own and team’s jobs', 'Open roles, referrals', 'None'],
    ['Dashboard and analytics', 'Company', 'Team', 'My space', 'My space'],
    ['Announcements', 'Publish', 'Read', 'Read', 'Read'],
    ['Settings, access, audit log', 'All', 'None', 'None', 'None']
  ];
  const userRoles = { E002:'admin', E030:'admin', E006:'finance', E034:'finance' };
  employees.forEach(e => { if (!userRoles[e.id]) userRoles[e.id] = employees.some(x => x.managerId === e.id) ? 'manager' : 'employee'; });

  const audit = [];
  const auditActions = [
    ['E002','Updated leave policy','Leave and holidays policy v2.0'],
    ['E030','Approved leave','LV12 for Ishita Bose'],
    ['E002','Changed salary','Vikram Shetty · band L4'],
    ['E031','Moved candidate','Esha Dutta → Interview'],
    ['E007','Submitted review','Manager review for Arjun Pillai'],
    ['E006','Exported payroll','Oct 2026 salary inputs'],
    ['E002','Granted role','Divya Krishnan → HR admin'],
    ['E034','Approved expense','EX112 · ₹8,240'],
    ['E030','Viewed bank details','Neha Kulkarni'],
    ['E002','Published announcement','H1 performance reviews close 20 November']
  ];
  for (let k = 0; k < 28; k++) {
    const [who, action, target] = auditActions[k % auditActions.length];
    const d = addDays(TODAY, -Math.floor(k / 3));
    audit.push({ id:'AU' + (1000 - k), at: iso(d) + ' ' + String(int(9, 18)).padStart(2,'0') + ':' + String(int(0, 59)).padStart(2,'0'), who, action, target, ip: '10.12.' + int(1, 40) + '.' + int(2, 250) });
  }

  const notifications = [];

  window.HR_SEED = {
    today: iso(TODAY), depts, employees, holidays, leaveTypes, leaves, attendance, okrs, goals, cycles, reviewQuestions, ratingLabels, reviews,
    feedback, surveys, enpsHistory, wellbeing, wellbeingResources, values, kudos, announcements, courses, enrollments,
    shiftTemplates, shifts, swapRequests, overtime, expenses, expenseCats, assets, jobs, stages, candidates, payRuns, documents, policies, acks,
    onboarding, onboardTemplate, offboarding, offboardTemplate, exits, headcountTrend, integrations, roles, permMatrix, userRoles, audit, notifications,
    settings: { company:'Arcadia Systems Pvt. Ltd.', weekStart:'Monday', workHours:'09:30–18:30', currency:'INR', minGroup:3, checkinCadence:'Weekly', emailDigest:true }
  };
})();
