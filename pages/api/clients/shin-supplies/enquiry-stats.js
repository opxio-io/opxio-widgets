// pages/api/clients/shin-supplies/enquiry-stats.js
// CRM dashboard for Shin Supplies — includes per-rep breakdown

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

  try {
    const pages = await queryAll(ENQUIRY_DB, NOTION_KEY)

    // Build rep ID → name map
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

    const now    = new Date()
    const today  = now.toISOString().slice(0, 10)
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const wStart = new Date(now); wStart.setDate(now.getDate() - 6)
    const d3     = new Date(now); d3.setDate(now.getDate() + 3)
    const d3Str  = d3.toISOString().slice(0, 10)

    let newLeads24h = 0, newLeadsWeek = 0
    let overdueResponse = 0, responded2h = 0, eligibleResponse = 0
    let totalResponseHours = 0
    let pendingQuotations = 0, overdueQuotations = 0
    let followupsToday = 0, followupsNext3Days = 0
    let closedWonMTD = 0

    const stageCount        = {}
    const productCount      = {}
    const sourceCount       = {}
    const sourceClosedCount = {}

    // Per-rep tracking
    // repStats[repName] = { closedWonMTD, activePipeline, followupsToday }
    const repStats = {}
    const UNASSIGNED = 'Unassigned'

    const STAGE_ORDER = ['New Lead', 'Quotation Sent', 'Negotiation', 'Sales Order Issued', 'Closed Won', 'Closed Lost']

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

      const isClosed = status === 'Closed Won' || status === 'Closed Lost' || status === 'Done'
      const stageKey = status === 'Done' ? 'Closed Won' : status
      stageCount[stageKey] = (stageCount[stageKey] || 0) + 1

      // Resolve rep name (first assigned, or Unassigned)
      let repName = UNASSIGNED
      if (assigned.length > 0) {
        const rid = assigned[0]
        repName = repMap[rid] || repMap[rid.replace(/-/g,'')] || UNASSIGNED
      }
      if (!repStats[repName]) repStats[repName] = { closedWonMTD: 0, activePipeline: 0, followupsToday: 0 }

      // Tile 1 — new leads + response speed
      if (submAt) {
        const submDate = new Date(submAt)
        const ageH = (now - submDate) / 3600000
        if (ageH <= 24)  newLeads24h++
        if (submDate >= wStart) newLeadsWeek++
        if (ageH <= 48) {
          eligibleResponse++
          if (quoIssued || status !== 'New Lead') {
            if (quoSentDt) {
              const respH = (new Date(quoSentDt) - submDate) / 3600000
              if (respH <= 2) { responded2h++; totalResponseHours += respH }
            }
          } else if (ageH > 2) {
            overdueResponse++
          }
        }
      }

      // Tile 2 — quotation backlog
      if (!isClosed && !quoIssued && status === 'New Lead') {
        pendingQuotations++
        if (submAt && (now - new Date(submAt)) / 3600000 > 24) overdueQuotations++
      }

      // Tile 3 — follow-ups
      if (nextFU && !isClosed) {
        if (nextFU <= today) { followupsToday++; repStats[repName].followupsToday++ }
        if (nextFU <= d3Str) followupsNext3Days++
      }

      // Tile 4 + rep — closed won MTD
      if (status === 'Closed Won' || status === 'Done') {
        const ref = submAt || page.created_time
        if (ref && new Date(ref) >= mStart) {
          closedWonMTD++
          repStats[repName].closedWonMTD++
        }
      }

      // Rep — active pipeline (not closed)
      if (!isClosed) {
        repStats[repName].activePipeline++
      }

      // Product + source breakdown
      for (const prod of products) productCount[prod] = (productCount[prod] || 0) + 1
      if (source) {
        sourceCount[source] = (sourceCount[source] || 0) + 1
        if (status === 'Closed Won' || status === 'Done') {
          sourceClosedCount[source] = (sourceClosedCount[source] || 0) + 1
        }
      }
    }

    const stageFunnel = STAGE_ORDER
      .filter(s => s !== 'Closed Lost')
      .map(s => ({ stage: s, count: stageCount[s] || 0 }))

    const responseRate2h = eligibleResponse > 0
      ? Math.round((responded2h / eligibleResponse) * 100)
      : null

    // Sort reps: most closed MTD first, then most active pipeline
    const repBreakdown = Object.entries(repStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.closedWonMTD - a.closedWonMTD || b.activePipeline - a.activePipeline)

    return res.status(200).json({
      total: pages.length,
      tile1: { newLeads24h, newLeadsWeek, overdueResponse, responseRate2h, eligibleResponse, responded2h,
        avgResponseHours: responded2h > 0 ? Math.round((totalResponseHours / responded2h) * 10) / 10 : null },
      tile2: { pendingQuotations, overdueQuotations },
      tile3: { followupsToday, followupsNext3Days },
      tile4: {
        closedWonMTD,
        stuckNegotiation: stageCount['Negotiation'] || 0,
        stuckSalesOrder:  stageCount['Sales Order Issued'] || 0,
        stageFunnel,
      },
      repBreakdown,
      productBreakdown: productCount,
      sourceBreakdown: Object.fromEntries(
        Object.entries(sourceCount).map(([src, count]) => [
          src, { leads: count, closed: sourceClosedCount[src] || 0 }
        ])
      ),
      updatedAt: now.toISOString(),
    })

  } catch (e) {
    console.error('shin-supplies/enquiry-stats error:', e)
    return res.status(500).json({ error: e.message })
  }
}
