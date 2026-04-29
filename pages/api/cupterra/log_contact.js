// pages/api/cupterra/log_contact.js
// Increments Contact Attempts on a lead. At 3 attempts → Status = Closed Lost.

import { getClientByToken, getNotionToken } from "../../../lib/supabase"

const ENQUIRY_DB_DEFAULT = '71c9ba4af0694291876bf78422805f18'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.query.token || req.headers['x-widget-token'] || req.body?.token
  if (!token) return res.status(401).json({ error: 'Missing token' })
  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: 'Invalid token' })

  const NOTION_KEY = getNotionToken(client)
  const page_id = req.body?.page_id
  if (!page_id) return res.status(400).json({ error: 'Missing page_id' })

  const headers = {
    'Authorization': `Bearer ${NOTION_KEY}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  try {
    // Fetch current page
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${page_id}`, { headers })
    if (!pageRes.ok) throw new Error(`Fetch page failed: ${await pageRes.text()}`)
    const page = await pageRes.json()

    const props = page.properties
    const currentAttempts = props['Contact Attempts']?.number ?? 0
    const currentStatus   = props['Status']?.status?.name ?? ''

    // Don't log if already closed
    if (currentStatus === 'Closed Won' || currentStatus === 'Closed Lost') {
      return res.status(200).json({ ok: true, skipped: true, reason: 'Lead already closed', attempts: currentAttempts })
    }

    const newAttempts = currentAttempts + 1
    const closedLost  = newAttempts >= 3

    const updateProps = {
      'Contact Attempts': { number: newAttempts },
      'Last Contacted': {
        date: { start: new Date().toISOString().slice(0, 10) }
      },
    }

    if (closedLost) {
      updateProps['Status'] = { status: { name: 'Closed Lost' } }
    }

    const updateRes = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ properties: updateProps }),
    })
    if (!updateRes.ok) throw new Error(`Update failed: ${await updateRes.text()}`)

    return res.status(200).json({
      ok: true,
      attempts: newAttempts,
      closed_lost: closedLost,
      message: closedLost
        ? `3 contact attempts reached — lead marked Closed Lost`
        : `Contact logged (${newAttempts}/3)`,
    })

  } catch (e) {
    console.error('log_contact error:', e)
    return res.status(500).json({ error: e.message })
  }
}
