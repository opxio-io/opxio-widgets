// pages/api/cupterra/enquiry-stats.js
// 4-tile CRM dashboard for cupTerra / Shin Supplies
// Single DB query (Enquiry Submissions) + optional People lookup for rep names

import { getClientByToken, getNotionToken, resolveDB } from "../../../lib/supabase"

const ENQUIRY_DB_DEFAULT = '71c9ba4af0694291876bf78422805f18'
const PEOPLE_DB_DEFAULT  = '34cfe60097f680cba3e8000beeb8103c'

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

// Property helpers
const getTitle    = p => (p?.title || []).map(t => t.plain_text).join('')
const getText     = p => (p?.rich_text || []).map(t => t.plain_text).join('')
const getStatus   = p => p?.status?.name || p?.select?.name || null
const getDate     = p => p?.date?.start || null
const getCheckbox = p => p?.checkbox === true
const getRelIds   = p => (p?.relation || []).map(r => r.id)
const getMultiSel = p => (p?.multi_select || []).map(s => s.name)
const getFormula  = p => p?.formula?.number ?? p?.formula?.string ?? null

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

  const NOTION_KEY  = getNotionToken(client)
  const ENQUIRY_DB  = resolveDB(client, 'enquiry_submissions', ENQUIRY_DB_DEFAULT)
  const PEOPLE_DB   = resolveDB(client, 'people', PEOPLE_DB_DEFAULT)

  try {
    // ── Fetch all enquiries ──────────────────────────────────────────────────
    const pages = await queryAll(ENQUIRY_DB, NOTION_KEY)

    // ── Fetch people for rep name mapping ───────────────────────────────────
    let repMap = {}
    try {
      const people = await queryAll(PEOPLE_DB, NOTION_KEY)
      for (const p of people) {
        const name = getTitle(p.properties['Name'] || p.properties['Nama'] || p.properties['Full Name'])
        if (name) repMap[p.id] = name
      }
    } catch { /* non-fatal — rep names become IDs */ }

    const now    = new Date()
    const today  = now.toISOString().slice(0, 10)
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const wStart = new Date(now); wStart.setDate(now.getDate() - 6)

    // ── Metric buckets ───────────────────────────────────────────────────────
    let newLeads24h = 0, newLeadsWeek = 0
    let overdueResponse = 0      // new lead, no quotation, >2h old
    let responded2h = 0, eligibleResponse = 0  // for rate calc
    let pendingQuotations = 0, overdueQuotations = 0
    let followupsToday = 0, followupsNext3Days = 0
    const stuckByStatus = { 'Negotiation': 0, 'Sales Order Issued': 0 }
    const closedWonMTD = []
    const repStats = {}   // id → { name, closedWon, active }
    const productCount = {}
    const sourceCount  = {}

    const d3 = new Date(now); d3.setDate(now.getDate() + 3)
    const d3Str = d3.toISOString().slice(0, 10)

    for (const page of pages) {
      const p       = page.properties
      const status  = getStatus(p['Status'])
      const submAt  = getDate(p['Submitted At'])
      const quoIssued = getCheckbox(p['Quotation Issued'])
      const quoSentDt = getDate(p['Quotation Sent Date'])
      const nextFU  = getDate(p['Next Follow-up Date'])
      const assigned = getRelIds(p['Assigned To'])
      const products = getMultiSel(p['Kategori produk'])
      const source   = getStatus(p['Lead Source'])
      const name     = getTitle(p['Nama Penuh'])
      const biz      = getText(p['Nama Perniagaan'])
      const wa       = getText(p['Nombor WhatsApp'])

      if (!status) continue

      const isClosed = status === 'Closed Won' || status === 'Closed Lost' || status === 'Done'

      // ── TILE 1: New Leads + Response Speed ─────────────────────────────────
      if (submAt) {
        const submDate = new Date(submAt)
        const ageH = (now - submDate) / 3600000

        if (ageH <= 24)  newLeads24h++
        if (submDate >= wStart) newLeadsWeek++

        // Response: quotation issued = "responded"
        if (ageH <= 48) {  // only count leads <48h for rate (recent enough to matter)
          eligibleResponse++
          if (quoIssued || status !== 'New Lead') {
            // Responded — check if within 2h
            if (quoSentDt) {
              const respH = (new Date(quoSentDt) - submDate) / 3600000
              if (respH <= 2) responded2h++
            }
          } else if (ageH > 2) {
            // New lead, no quotation, older than 2h → overdue
            overdueResponse++
          }
        }
      }

      // ── TILE 2: Quotation Backlog ───────────────────────────────────────────
      if (!isClosed && !quoIssued && status === 'New Lead') {
        pendingQuotations++
        if (submAt && (now - new Date(submAt)) / 3600000 > 24) {
          overdueQuotations++
        }
      }

      // ── TILE 3: Follow-ups ──────────────────────────────────────────────────
      if (nextFU && !isClosed) {
        if (nextFU <= today)   followupsToday++
        if (nextFU <= d3Str)   followupsNext3Days++
      }

      // ── TILE 4: Pipeline Health ─────────────────────────────────────────────
      if (status === 'Closed Won') {
        // MTD check — use submAt or page created time as proxy
        const ref = submAt || page.created_time
        if (ref && new Date(ref) >= mStart) {
          closedWonMTD.push({
            name,
            biz,
            repId: assigned[0] || null,
          })
        }
      }

      if ((status === 'Negotiation' || status === 'Sales Order Issued')) {
        stuckByStatus[status] = (stuckByStatus[status] || 0) + 1
      }

      // Per-rep stats
      for (const repId of assigned) {
        if (!repStats[repId]) repStats[repId] = { name: repMap[repId] || repId.slice(0,8), closedWon: 0, active: 0 }
        if (status === 'Closed Won') repStats[repId].closedWon++
        else if (!isClosed) repStats[repId].active++
      }

      // Product breakdown
      for (const prod of products) {
        productCount[prod] = (productCount[prod] || 0) + 1
      }

      // Source breakdown
      if (source) sourceCount[source] = (sourceCount[source] || 0) + 1
    }

    const responseRate2h = eligibleResponse > 0 ? Math.round((responded2h / eligibleResponse) * 100) : null

    return res.status(200).json({
      total: pages.length,
      tile1: {
        newLeads24h,
        newLeadsWeek,
        overdueResponse,
        responseRate2h,
        eligibleResponse,
        responded2h,
      },
      tile2: {
        pendingQuotations,
        overdueQuotations,
      },
      tile3: {
        followupsToday,
        followupsNext3Days,
      },
      tile4: {
        closedWonMTD: closedWonMTD.length,
        stuckNegotiation: stuckByStatus['Negotiation'] || 0,
        stuckSalesOrder: stuckByStatus['Sales Order Issued'] || 0,
        byRep: Object.values(repStats).sort((a,b) => b.closedWon - a.closedWon),
      },
      productBreakdown: productCount,
      sourceBreakdown: sourceCount,
      updatedAt: now.toISOString(),
    })

  } catch (e) {
    console.error('cupterra/enquiry-stats error:', e)
    return res.status(500).json({ error: e.message })
  }
}
