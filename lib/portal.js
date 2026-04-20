// lib/portal.js
// Creates a portal session when deposit is paid and sends magic link email

import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function createPortalSession({ projectId, contactId, email, firstName, companyName }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Upsert — one active session per project
  const { error } = await supabase.from('portal_sessions').upsert({
    token,
    project_id: projectId,
    contact_id: contactId,
    email,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
    last_accessed: null,
  }, { onConflict: 'project_id' })

  if (error) {
    console.warn('[portal] createPortalSession error:', error.message)
    return null
  }

  await sendPortalActivationEmail({ email, firstName, token, companyName })
  return token
}

async function sendPortalActivationEmail({ email, firstName, token, companyName }) {
  const magicLink = `https://api.opxio.io/portal/auth?token=${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log(`[portal] Activation link for ${email}: ${magicLink}`)
    return
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Opxio <hello@opxio.io>',
      to: email,
      subject: 'Your Opxio project portal is ready',
      html: `
        <div style="font-family:'DM Sans',Helvetica,sans-serif;background:#0A0A0A;color:#fff;padding:48px 36px;max-width:520px;margin:0 auto;border-radius:16px">
          <div style="font-size:22px;font-weight:800;letter-spacing:-.03em;margin-bottom:36px">
            op<span style="color:#AAFF00">x</span>io
          </div>
          <p style="font-size:15px;color:#999;margin-bottom:8px;line-height:1.6">Hi ${firstName || 'there'},</p>
          <p style="font-size:15px;color:#999;margin-bottom:28px;line-height:1.6">
            Your project portal is now live. You can track build progress, view invoices, and send us requests from one place.
          </p>
          <a href="${magicLink}" style="display:inline-block;background:#AAFF00;color:#000;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-.01em">
            Access your portal →
          </a>
          <p style="font-size:11px;color:#2A2A2A;margin-top:36px;line-height:1.6">
            This link is valid for 7 days. If it expires, you can request a new one at<br>
            <a href="https://api.opxio.io/portal/login" style="color:#444;text-decoration:none">api.opxio.io/portal/login</a>
          </p>
          <p style="font-size:11px;color:#2A2A2A;margin-top:20px">— Opxio</p>
        </div>
      `,
    }),
  }).catch(e => console.warn('[portal] email send failed:', e.message))
}
