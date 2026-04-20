// POST /api/portal/auth
// Validates a client_token from magic link, sets session cookie, returns project_id

import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { token } = req.body || {}
  if (!token) return res.status(400).json({ error: 'Token required' })

  try {
    // Look up token in portal_sessions table
    const { data: session, error } = await supabase
      .from('portal_sessions')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !session) {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    // Set httpOnly session cookie (7 days)
    const cookie = serialize('portal_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Update last_accessed
    await supabase
      .from('portal_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('token', token)

    res.setHeader('Set-Cookie', cookie)
    return res.json({ project_id: session.project_id })
  } catch (e) {
    console.error('[portal/auth]', e)
    return res.status(500).json({ error: 'Auth failed' })
  }
}
