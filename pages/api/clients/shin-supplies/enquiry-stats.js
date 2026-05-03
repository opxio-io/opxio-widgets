// pages/api/clients/shin-supplies/enquiry-stats.js
import { getClientByToken, getNotionToken, resolveDB } from "../../../../lib/supabase.js"

const ENQUIRY_DB_DEFAULT = '71c9ba4af0694291876bf78422805f18'
const PEOPLE_DB_DEFAULT  = '34cfe60097f680e1bac0e75b431bc325'

async function queryAll(dbId, notionKey, filter) {
  const headers = {
    'Authorization': `Bearer ${notionKey}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }
  let results = [], hasMore = true, cursor
  while (hasMore) {
    const body = { page_size: 100 }
    if (cursor) body.start_cursor = cursor
    if (filter) body.filter = filter
    const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST', headers, body: JSON.stringify(body)
    })
    if (!r.ok) throw new Error(await r.text())
    const d = await r.json()
    results = results.concat(d.results)
    hasMore = d.has_more
    cursor  = d.next_cursor
  }
  return results
}

const getTitle    = p => (p?.title || []).map(t => t.plain_text).join('')
const getStatus   = p => p?.status?.name || p?.select?.name || null
const getDate     = p => p?.date?.start || null
const getCheckbox = p => p?.checkbox === true
const getRelIds   = p => (p?.relation || []).map(r => r.id)
const getMultiSel = p => (p?.multi_select || []).map(s => s.name)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')

  const token = req.query.token || req.headers['x-widget-token']
  if (!token) return res.status(401).json({ error: 'Missing token' })
  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: 'Invalid token' })

  const NOTION_KEY = getNotionToken(client)
  const ENQUIRY_DB = resolveDB(client, 'enquiry_submissions', ENQUIRY_DB_DEFAULT)
  const PEOPLE_DB  = resolveDB(client, 'people', PEOPLE_DB_DEFAULT)

  // Month/year filter — 0-indexed month (JS Date)
  const now    = new Date()
  const qMonth = req.query.month !== undefined ? parseInt(req.query.month) : null
  const qYear  = req.query.year  !== undefined ? parseInt(req.query.year)  : null
  const mYear  = (qMonth !== null && qYear !== null && !isNaN(qMonth) && !isNaN(qYear)) ? qYear  : now.getFullYear()
  const mMon   = (qMonth !== null && qYear !== null && !isNaN(qMonth) && !isNaN(qYear)) ? qMonth : now.getMonth()
  const mStart = new Date(mYear, mMon, 1)
  const mEnd   = new Date(mYear, mMon + 1, 1)

  try {
    const pages = await queryAll(ENQUIRY_DB, NOTION_KEY)

    let repMap = {}
    try {
      const people = await queryAll(PEOPLE_DB, NOTION_KEY)
      for (const p of people) {
        const nameProp = p.properties['Name'] || p.properties['Nama'] || p.properties['Full Name']
        const name = getTitle(nameProp)
        if (name) {
          repMap[p.id] = name
          repMap[p.id.replace(/-/g, '')] = name
        }
      }
    } catch(err) { console.error('People DB error:', err.message) }

    const today  = now.toISOString().slice(0, 10)
    const d3     = new Date(now); d3.setDate(now.getDate() + 3)
    const d3Str  = d3.toISOString().slice(0, 10)

    // ── Month-scoped counters ──
    let monthLeads       = 0
    let quotationsSent   = 0  // leads submitted this month that progressed past New Lead
    let quotationsClosed = 0  // sent in month + now Closed Won
    let closedWonMTD     = 0

    const stageCount        = {}
    const productCount      = {}
    const sourceCount       = {}
    const sourceClosedCount = {}
    const repStats          = {}
    const EXCLUDED          = ['Unassigned', 'Nurhan']
    const STAGE_ORDER       = ['New Lead', 'Quotation Sent', 'Negotiation', 'Sales Order Issued', 'Closed Won', 'Closed Lost']

    // ── LIVE counters (always today, unaffected by month filter) ──
    let followupsToday    = 0
    let followupsNext3    = 0
    let overdueResponse   = 0  // open leads > 2h with no quotation

    for (const page of pages) {
      const p         = page.properties
      const status    = getStatus(p['Status'])
      const submAt    = getDate(p['Submitted At'])
      const quoIssued = getCheckbox(p['Quotation Issued'])
      const quoSentDt = getDate(p['Quotation Sent Date'])
      const nextFU    = getDate(p['Next Follow-up Date'])
      const assigned  = getRelIds(p['Assigned To'])
      const products  = getMultiSel(p['Kategori produk'])
      const source    = getStatus(p['Lead Source'])

      if (!status) continue

      const submDate    = submAt    ? new Date(submAt)    : null
      const quoSentDate = quoSentDt ? new Date(quoSentDt) : null
      const ageH        = submDate  ? (now - submDate) / 3600000 : null

      const inMonth  = submDate && submDate >= mStart && submDate < mEnd
      const isClosed = status === 'Closed Won' || status === 'Closed Lost' || status === 'Done'

      // Rep name
      let repName = 'Unassigned'
      if (assigned.length > 0) {
        const rid = assigned[0]
        repName = repMap[rid] || repMap[rid.replace(/-/g,'')] || 'Unassigned'
      }
      if (!repStats[repName]) repStats[repName] = { closedWonMTD: 0, activePipeline: 0, activities: 0, followupsToday: 0 }

      // ── Month-scoped metrics ──
      if (inMonth) {
        monthLeads++
        repStats[repName].activities++

        // Stage funnel (by submission month)
        const stageKey = status === 'Done' ? 'Closed Won' : status
        stageCount[stageKey] = (stageCount[stageKey] || 0) + 1

        // Product + source breakdown (by submission month)
        for (const prod of products) productCount[prod] = (productCount[prod] || 0) + 1
        if (source) {
          sourceCount[source] = (sourceCount[source] || 0) + 1
          if (status === 'Closed Won' || status === 'Done') {
            sourceClosedCount[source] = (sourceClosedCount[source] || 0) + 1
          }
        }

        // Closed Won in month (for rep stats)
        if (status === 'Closed Won' || status === 'Done') {
          closedWonMTD++
          repStats[repName].closedWonMTD++
        }
      }

      // ── Quotations Sent — leads this month that moved past New Lead stage ──
      if (inMonth && status !== 'New Lead') {
        quotationsSent++
        if (status === 'Closed Won' || status === 'Done') {
          quotationsClosed++
        }
      }

      // ── LIVE: Follow-ups (all open leads, always today) ──
      if (nextFU && !isClosed) {
        if (nextFU <= today) { followupsToday++; repStats[repName].followupsToday++ }
        if (nextFU <= d3Str) followupsNext3++
      }

      // ── LIVE: Overdue response (open New Lead, no quotation, > 2h) ──
      if (!isClosed && !quoIssued && status === 'New Lead' && ageH !== null && ageH > 2) {
        overdueResponse++
      }

      // Rep — active pipeline (real-time, not month-scoped)
      if (!isClosed) repStats[repName].activePipeline++
    }

    const closeRate = quotationsSent > 0
      ? Math.round((quotationsClosed / quotationsSent) * 100)
      : null

    const stageFunnel = STAGE_ORDER

      .map(s => ({ stage: s, count: stageCount[s] || 0 }))

    const repBreakdown = Object.entries(repStats)
      .filter(([name]) => !EXCLUDED.includes(name))
      .map(([name, { closedWonMTD, activePipeline, activities, followupsToday }]) => ({ name, closedWonMTD, activePipeline, activities, followupsToday }))
      .sort((a, b) => b.closedWonMTD - a.closedWonMTD || b.activePipeline - a.activePipeline)

    return res.status(200).json({
      total: pages.length,
      monthLeads,
      quotationsSent,
      quotationsClosed,
      closeRate,
      live: { followupsToday, followupsNext3, overdueResponse },
      stageFunnel,
      repBreakdown,
      productBreakdown: productCount,
      sourceBreakdown: Object.fromEntries(
        Object.entries(sourceCount).map(([src, count]) => [
          src, { leads: count, closed: sourceClosedCount[src] || 0 }
        ])
      ),
      updatedAt: now.toISOString(),
      filterMonth: { year: mYear, month: mMon },
    })

  } catch (e) {
    console.error('shin-supplies/enquiry-stats error:', e)
    return res.status(500).json({ error: e.message })
  }
}
