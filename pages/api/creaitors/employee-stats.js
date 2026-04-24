// Vercel Serverless Function - Employee Stats
// Returns per-employee task data with raw task list so the widget
// can slice any week client-side without re-fetching.

import { getClientByToken, getNotionToken, resolveDB } from "../../../lib/supabase"

function getStage(taskName) {
  const n = (taskName || '').toLowerCase();
  if (n.includes('planning'))  return 'planning';
  if (n.includes('shooting'))  return 'shooting';
  if (n.includes('editing'))   return 'editing';
  if (n.includes('posting'))   return 'posting';
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = req.query.token || req.headers['x-widget-token'];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  const client = await getClientByToken(token);
  if (!client) return res.status(403).json({ error: 'Invalid token' });
  const NOTION_KEY = getNotionToken(client);
  const TASKS_DB   = resolveDB(client, 'TASKS_DB',   '3348b289e31a80dc89e1eb7ba5b49b1a');
  const EMPLOYEE_DB = resolveDB(client, 'EMPLOYEE_DB', 'bc5b99b59468498e8a294149d6f03134');

  try {
    const headers = {
      'Authorization': 'Bearer ' + NOTION_KEY,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    // 1. Fetch all tasks (paginated)
    let allTasks = [], cursor;
    do {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch('https://api.notion.com/v1/databases/' + TASKS_DB + '/query', {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error('Tasks query failed: ' + await r.text());
      const d = await r.json();
      allTasks = allTasks.concat(d.results);
      cursor = d.has_more ? d.next_cursor : undefined;
    } while (cursor);

    // 2. Load employees from Employee Hub
    const empMap = {};
    const empIdSet = new Set();

    try {
      const empRes = await fetch('https://api.notion.com/v1/databases/' + EMPLOYEE_DB + '/query', {
        method: 'POST', headers, body: JSON.stringify({ page_size: 100 }),
      });
      if (empRes.ok) {
        const empData = await empRes.json();
        empData.results.forEach(emp => {
          const p = emp.properties;
          empIdSet.add(emp.id);
          empMap[emp.id] = {
            name:   p['Name']?.title?.map(t => t.plain_text).join('') || 'Unknown',
            role:   p['Role']?.select?.name || '',
            status: p['Status']?.select?.name || 'Active',
          };
        });
      }
    } catch (_) {}

    // Collect any extra employee IDs from tasks
    allTasks.forEach(task => {
      (task.properties['Assigned To']?.relation || []).forEach(r => empIdSet.add(r.id));
    });

    // 3. Fetch each employee page (for those not in Employee Hub)
    await Promise.all([...empIdSet].map(async empId => {
      if (empMap[empId]) return;
      try {
        const r = await fetch('https://api.notion.com/v1/pages/' + empId, { headers });
        if (!r.ok) { empMap[empId] = { name: 'Unknown', role: '', status: 'Active' }; return; }
        const p = (await r.json()).properties;
        empMap[empId] = {
          name:   p['Name']?.title?.map(t => t.plain_text).join('') || 'Unknown',
          role:   p['Role']?.select?.name || '',
          status: p['Status']?.select?.name || 'Active',
        };
      } catch { empMap[empId] = { name: 'Unknown', role: '', status: 'Active' }; }
    }));

    // 4. Build compact task list per employee (doneDate + stage + mins)
    // This is what the widget uses to slice any week client-side
    const empTasks = {};
    [...empIdSet].forEach(id => { empTasks[id] = []; });

    allTasks.forEach(task => {
      const tp       = task.properties;
      const status   = tp['Task Status']?.status?.name || '';
      const taskName = tp['Task List']?.title?.map(t => t.plain_text).join('') || '';
      const doneRaw  = tp['Task Done On']?.date?.start || null;
      const mins     = tp['Accumulated Mins']?.number || 0;
      const stage    = getStage(taskName);
      if (!stage) return; // only track content stage tasks
      const doneDate    = doneRaw ? doneRaw.slice(0, 10) : null;
      const createdDate = (task.created_time || '').slice(0, 10);
      const isDone      = status === 'Done';

      (tp['Assigned To']?.relation || []).forEach(({ id: empId }) => {
        if (!empTasks[empId]) return;
        empTasks[empId].push({ stage, doneDate, createdDate, mins, isDone });
      });
    });

    // 5. Compute all-time stats (month computed server-side as reference)
    const today = new Date(); today.setHours(0,0,0,0);
    const monthStart = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-01';
    const lastDay    = new Date(today.getFullYear(), today.getMonth()+1, 0).getDate();
    const monthEnd   = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(lastDay).padStart(2,'0');

    const employees = [...empIdSet].map(id => {
      const tasks = empTasks[id];
      const allStats    = { planning:0, shooting:0, editing:0, posting:0, totalMins:0 };
      const monthStats  = { planning:0, shooting:0, editing:0, posting:0, mins:0 };

      tasks.forEach(t => {
        if (!t.isDone) return;
        allStats[t.stage]++;
        allStats.totalMins += t.mins;
        if (t.doneDate && t.doneDate >= monthStart && t.doneDate <= monthEnd) {
          monthStats[t.stage]++;
          monthStats.mins += t.mins;
        }
      });

      return {
        id,
        ...empMap[id],
        tasks, // raw task list for client-side week slicing
        allStats: { ...allStats, totalHrs: Math.round((allStats.totalMins/60)*10)/10 },
        monthStats: { ...monthStats, hrs: Math.round((monthStats.mins/60)*10)/10 },
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      employees,
      monthLabel: today.toLocaleString('en', { month: 'long' }) + ' ' + today.getFullYear(),
      generatedAt: new Date().toISOString(),
    }