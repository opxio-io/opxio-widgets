// Handles: feedback, expansion, message, download
// Route determined by [action] param

import { createClient } from '@supabase/supabase-js'
import { getPage, createPage, plain, DB, hdrs, patchPage } from '../../../lib/notion'
import { parse } from 'cookie'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getSession(req) {
  const cookies = parse(req.headers.cookie || '')
  const sessionToken = cookies.portal_session
  if (!sessionToken) return null
  const { data } = await supabase
    .from('portal_sessions')
    .select('*')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data || null
}

async function sendNotification(subject, body) {
  if (!process.env.RESEND_API_KEY) { console.log('[portal notify]', subject, body); return }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Opxio Portal <hello@opxio.io>',
      to: 'hello@opxio.io',
      subject,
      text: body,
    }),
  }).catch(e => console.warn('[portal notify email]', e.message))
}

export default async function handler(req, res) {
  const { action } = req.query

  // ── FEEDBACK ────────────────────────────────────────────────────────────────
  if (action === 'feedback') {
    if (req.method !== 'POST') return res.status(405).end()
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'unauthorized' })

    const { project_id, phase_name, type, description, attachment } = req.body
    const nToken = process.env.NOTION_API_KEY
    const today = new Date().toISOString().split('T')[0]

    try {
      await createPage({
        parent: { database_id: DB.CLIENT_IMPL },
        properties: {
          'Name': { title: [{ text: { content: `${type} — ${phase_name || 'Portal'}` } }] },
          ...(project_id ? { 'Project Tracker': { relation: [{ id: project_id }] } } : {}),
          'Notes': { rich_text: [{ text: { content: `Phase: ${phase_name || 'N/A'}\nType: ${type}\n\n${description}${attachment ? `\n\nAttachment: ${attachment}` : ''}` } }] },
          'Date': { date: { start: today } },
          'Source': { select: { name: 'Client Portal' } },
        }
      }, nToken)

      await sendNotification(
        `[Opxio Portal] ${type} — ${phase_name}`,
        `Project: ${project_id}\nPhase: ${phase_name}\nType: ${type}\n\n${description}${attachment ? `\n\nAttachment: ${attachment}` : ''}`
      )

      return res.json({ ok: true })
    } catch (e) {
      console.error('[portal/feedback]', e)
      return res.status(500).json({ error: e.message })
    }
  }

  // ── EXPANSION ────────────────────────────────────────────────────────────────
  if (action === 'expansion') {
    if (req.method !== 'POST') return res.status(405).end()
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'unauthorized' })

    const { project_id, description, area, urgency } = req.body
    const nToken = process.env.NOTION_API_KEY

    try {
      // Get project to find company
      const projectPage = await getPage(project_id, nToken)
      const companyId = projectPage.properties.Company?.relation?.[0]?.id?.replace(/-/g, '') || null

      await createPage({
        parent: { database_id: DB.EXPANSIONS },
        properties: {
          'Name': { title: [{ text: { content: `Expansion Request — ${area}` } }] },
          ...(project_id ? { 'Project': { relation: [{ id: project_id }] } } : {}),
          ...(companyId  ? { 'Company': { relation: [{ id: companyId }] } } : {}),
          'Notes': { rich_text: [{ text: { content: `${description}\n\nUrgency: ${urgency}` } }] },
          'Status': { select: { name: 'Requested' } },
          'Source': { select: { name: 'Client Portal' } },
        }
      }, nToken)

      await sendNotification(
        `[Opxio Portal] Expansion Request — ${area}`,
        `Project: ${project_id}\nArea: ${area}\nUrgency: ${urgency}\n\n${description}`
      )

      return res.json({ ok: true })
    } catch (e) {
      console.error('[portal/expansion]', e)
      return res.status(500).json({ error: e.message })
    }
  }

  // ── MESSAGE ──────────────────────────────────────────────────────────────────
  if (action === 'message') {
    if (req.method !== 'POST') return res.status(405).end()
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'unauthorized' })

    const { project_id, subject, message } = req.body
    const nToken = process.env.NOTION_API_KEY
    const today = new Date().toISOString().split('T')[0]

    try {
      // Get project for company link
      const projectPage = await getPage(project_id, nToken)
      const companyId = projectPage.properties.Company?.relation?.[0]?.id?.replace(/-/g, '') || null

      await createPage({
        parent: { database_id: DB.ACTIVITY_LOG },
        properties: {
          'Name': { title: [{ text: { content: `Portal Message — ${subject}` } }] },
          ...(project_id ? { 'Project': { relation: [{ id: project_id }] } } : {}),
          ...(companyId  ? { 'Company': { relation: [{ id: companyId }] } } : {}),
          'Notes': { rich_text: [{ text: { content: `Subject: ${subject}\n\n${message}` } }] },
          'Date': { date: { start: today } },
          'Type': { select: { name: 'Client Portal Message' } },
        }
      }, nToken)

      await sendNotification(
        `[Opxio Portal] Message — ${subject}`,
        `Project: ${project_id}\nSubject: ${subject}\n\n${message}`
      )

      return res.json({ ok: true })
    } catch (e) {
      console.error('[portal/message]', e)
      return res.status(500).json({ error: e.message })
    }
  }

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────────
  if (action === 'download') {
    if (req.method !== 'GET') return res.status(405).end()
    const session = await getSession(req)
    if (!session) return res.status(401).json({ error: 'unauthorized' })

    const { type, id } = req.query
    const endpoint = type === 'receipt' ? 'generate_receipt' : 'generate_invoice'

    try {
      const apiRes = await fetch(`https://api.opxio.io/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_id: id }),
      })

      if (!apiRes.ok) {
        const err = await apiRes.text()
        console.error('[portal/download]', err)
        return res.status(500).json({ error: 'PDF generation failed' })
      }

      const contentType = apiRes.headers.get('content-type') || 'application/pdf'
      const buffer = await apiRes.arrayBuffer()

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${type}-${id.slice(0, 8)}.pdf"`)
      return res.send(Buffer.from(buffer))
    } catch (e) {
      console.error('[portal/download]', e)
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(404).json({ error: 'Not found' })
}

export const config = { api: { bodyParser: true } }
