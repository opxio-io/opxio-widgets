// POST /api/portal/login
// { email } → sends magic link to client if found in Notion Contacts

import { createClient } from '@supabase/supabase-js'
import { getPage, queryDB, plain, DB, hdrs } from '../../../lib/notion'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function findProjectByEmail(email) {
  const token = process.env.NOTION_API_KEY
  // Search Contacts DB for email match
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DB.CONTACTS}/query`, {
      method: 'POST',
      headers: hdrs(token),
      body: JSON.stringify({ filter: { property: 'Email', email: { equals: email } } }),
    })
    const data = await res.json()
    const contact = data.results?.[0]
    if (!contact) return null

    const contactId = contact.id.replace(/-/g, '')
    const firstName = plain(contact.properties['First Name']?.rich_text || []) ||
                      plain(contact.properties.Name?.title || []) || 'there'

    // Find project linked to this contact via Portal Token
    const { data: session } = await supabase
      .from('portal_sessions')
      .select('project_id')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return { contactId, firstName, projectId: session?.project_id || null }
  } catch (e) {
    console.error('[portal/login] findProjectByEmail:', e.message)
    return null
  }
}

async function sendMagicLinkEmail(email, firstName, token, projectId) {
  const magicLink = `https://api.opxio.io/portal/auth?token=${token}`

  // Use Resend if available, otherwise log
  if (process.env.RESEND_API_KEY) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Opxio <hello@opxio.io>',
        to: email,
        subject: 'Your new Opxio portal link',
        html: `
          <div style="font-family:'DM Sans',sans-serif;background:#0A0A0A;color:#fff;padding:40px 32px;max-width:480px;margin:0 auto">
            <div style="font-size:20px;font-weight:800;letter-spacing:-.03em;margin-bottom:32px">
              op<span style="color:#AAFF00">x</span>io
            </div>
            <p style="font-size:15px;color:#888;margin-bottom:8px">Hi ${firstName},</p>
            <p style="font-size:15px;color:#888;margin-bottom:28px;line-height:1.6">
              Here's your new access link. Valid for 7 days.
            </p>
            <a href="${magicLink}" style="display:inline-block;background:#AAFF00;color:#000;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;">
              Access your portal →
            </a>
            <p style="font-size:11px;color:#333;margin-top:32px">— Opxio</p>
          </div>
        `,
      }),
    })
  } else {
    console.log(`[portal/login] Magic link for ${email}: ${magicLink}`)
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Email required' })

  // Rate limit: 3 requests per hour per email (check Supabase)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('portal_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('email', email)
    .gt('created_at', oneHourAgo)

  if (count >= 3) {
    return res.status(429).json({ error: 'Too many requests. Try again in an hour.' })
  }

  // Log attempt
  await supabase.from('portal_login_attempts').insert({ email })

  // Always return success (don't reveal if email exists)
  const found = await findProjectByEmail(email)

  if (found) {
    const newToken = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Upsert session
    await supabase.from('portal_sessions').upsert({
      token: newToken,
      contact_id: found.contactId,
      project_id: found.projectId,
      email,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    }, { onConflict: 'email' })

    await sendMagicLinkEmail(email, found.firstName, newToken, found.projectId)
  }

  return res.json({ sent: true })
}
