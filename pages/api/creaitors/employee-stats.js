// Vercel Serverless Function — Employee Stats
// Queries Tasks DB only (already shared with integration),
// fetches individual employee pages by ID, groups stats per employee.
// Groups task counts by content stage (Planning / Shooting / Editing / Posting)
// based on the Task List name property.

import { getClientByToken, getNotionToken, resolveDB } from "../../../lib/supabase"

// Stage detection — match against Task List name
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

  const token = req.query.token || req.headers['x-widget-token']
  if (!token) return res.status(401).json({ error: 'Missing token' })
  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: 'Invalid token' })
  const NOTION_KEY = getNotionToken(client)
  const TASKS_DB = resolveDB(client, 'TASKS_DB', '3348b289e31a80dc89e1eb7ba5b49b1a')
  const EMPLOYEE_DB = resolveDB(client, 'EMPLOYEE_DB', 'bc5b99b59468498e8a294149d6f03134')

  try {

    const headers = {
      'Authorization': `Bearer ${NOTION_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    };

    // ── 1. Fetch all tasks (paginate) ──────────────────────────────
    let allTasks = [], cursor;
    do {
      const body = { page_size: 100 };
      if (cursor) body.start_cursor = cursor;
      const r = await fetch(`https://api.notion.com/v1/databases/${TASKS_DB}/query`, {
        method: 'POST', headers, body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(`Tasks query failed: ${await r.text()}`);
      const d = await r.json();
      allTasks = allTasks.concat(d.results);
      cursor = d.has_more ? d.next_cursor : undefined;
    } while (cursor);

    // ── 2. Try to load all employees from Employee Hub ──────────────
    const empMap = {};
    const empIdSet = new Set();

    try {
      const empRes = await fetch(`https://api.notion.com/v1/databases/${EMPLOYEE_DB}/query`, {
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
            dept:   p['Department']?.select?.name || '',
            status: p['Status']?.select?.name || 'Active',
            email:  p['Email']?.email || '',
            phone:  p['Phone']?.phone_number || '',
          };
        });
      }
    } catch (_) { /* Fall back to task-derived list */ }

    // Also collect any employee IDs found in tasks
    allTasks.forEach(task => {
      const assigned = task.properties['Assigned To']?.relation || [];
      assigned.forEach(r => empIdSet.add(r.id));
    });

    // ── 3. Fetch each employee page ────────────────────────────────
    await Promise.all([...empIdSet].map(async empId => {
      try {
        const r = await fetch(`https://api.notion.com/v1/pages/${empId}`, { headers });
        if (!r.ok) {
          empMap[empId] = { name: 'Unknown', role: '', dept: '', status: 'Active', email: '', phone: '' };
          return;
        }
        const p = (await r.json()).properties;
        empMap[empId] = {
          name:   p['Name']?.title?.map(t => t.plain_text).join('') || 'Unknown',
          role:   p['Role']?.select?.name || '',
          dept:   p['Department']?.select?.name || '',
          status: p['Status']?.select?.name || 'Active',
          email:  p['Email']?.email || '',
          phone:  p['Phone']?.phone_number || '',
          tasks:  [],
        };
      } catch {
        empMap[empId] = { name: 'Unknown', role: '', dept: '', status: 'Active', email: '', phone: '', tasks: [] };
      }
    }));

    // ── 4. Bucket tasks per employee ───────────────────────────────
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Week boundaries (Monday to Sunday)
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + mondayOffset);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().slice(0, 10);

    // Month boundaries
    const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const emptyStages = () => ({ planning: 0, shooting: 0, editing: 0, posting: 0 });
    const emptyStats = () => ({
      done: 0, inProgress: 0, pendingQC: 0, reviewNeeded: 0,
      notStarted: 0, overdue: 0, dueToday: 0, totalMins: 0, total: 0,
      ...emptyStages(),
    });

    const statsMap = {};
    [...empIdSet].forEach(id => {
      statsMap[id] = {
        all:   emptyStats(),
        week:  { done: 0, total: 0, mins: 0, ...emptyStages() },
        month: { done: 0, total: 0, mins: 0, ...emptyStages() },
      };
    });

    allTasks.forEach(task => {
      const tp = task.properties;
      const taskStatus  = tp['Task Status']?.status?.name || '';
      const taskName    = tp['Task List']?.title?.map(t => t.plain_text).join('') || '';
      const dueRaw      = tp['Task Due']?.date?.start || null;
      const accMins     = tp['Accumulated Mins']?.number || 0;
      const doneRaw     = tp['Task Done On']?.date?.start || null;
      const assigned    = tp['Assigned To']?.relation || [];
      const stage       = getStage(taskName);

      const doneDate = doneRaw ? doneRaw.slice(0, 10) : null;

      assigned.forEach(({ id: empId }) => {
        if (!statsMap[empId]) return;
        const s = statsMap[empId].all;
        const w = statsMap[empId].week;
        const m = statsMap[empId].month;

        // All-time stats
        s.total++;
        s.totalMins += accMins;

        if      (taskStatus === 'Done')               s.done++;
        else if (taskStatus === 'In progress')        s.inProgress++;
        else if (taskStatus === 'Pending QC Review')  s.pendingQC++;
        else if (taskStatus === 'Review Needed')      s.reviewNeeded++;
        else                                          s.notStarted++;

        if (dueRaw && taskStatus !== 'Done') {
          const due = new Date(dueRaw); due.setHours(0,0,0,0);
          if      (due < today)                       s.overdue++;
          else if (due.getTime() === today.getTime()) s.dueToday++;
        }

        // All-time content stage counts (done tasks only)
        if (taskStatus === 'Done' && stage) s[stage]++;

        // Weekly content stage counts (by done date)
        if (doneDate && doneDate >= weekStartStr && doneDate <= weekEndStr) {
          w.done++;
          w.mins += accMins;
          if (stage) w[stage]++;
        }
        if (dueRaw) {
          const dueStr = dueRaw.slice(0, 10);
          if (dueStr >= weekStartStr && dueStr <= weekEndStr) w.total++;
        }

        // Monthly content stage counts (by done date)
        if (doneDate && doneDate >= monthStart && doneDate <= monthEnd) {
          m.done++;
          m.mins += accMins;
          if (stage) m[stage]++;
        }
        if (dueRaw) {
          const dueStr = dueRaw.slice(0, 10);
          if (dueStr >= monthStart && dueStr <= monthEnd) m.total++;
        }
      });
    });

    // ── 5. Build result array ──────────────────────────────────────
    const employees = [...empIdSet].map(id => {
      const s = statsMap[id].all;
      const w = statsMap[id].week;
      const m = statsMap[id].month;
      return {
        id,
        ...empMap[id],
        stats: {
          ...s,
          totalHrs: Math.round((s.totalMins / 60) * 10) / 10,
        },
        week: {
          done:     w.done,
          due:      w.total,
          hrs:      Math.round((w.mins / 60) * 10) / 10,
          planning: w.planning,
          shooting: w.shooting,
          editing:  w.editing,
          posting:  w.posting,
        },
        month: {
          done:     m.done,
          due:      m.total,
          hrs:      Math.round((m.mins / 60) * 10) / 10,
          planning: m.planning,
          shooting: m.shooting,
          editing:  m.editing,
          posting:  m.posting,
        },
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return res.status(200).json({
      employees,
      weekLabel: `${weekStartStr} – ${weekEndStr}`,
      monthLabel: `${today.toLocaleString('en', { month: 'long' })} ${today.getFullYear()}`,
      generatedAt: new Date().toISOString(),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
