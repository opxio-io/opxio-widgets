/**
 * POST /api/creaitors/workspace-reset-request
 *
 * Staff submits a password reset request.
 * Stored in client labels under workspace_reset_requests[].
 * Admin sees these in the admin widget and can approve (reset).
 *
 * Body: { staff_id }
 * Query: ?token=<client_access_token>
 *
 * Returns: { ok: true }
 */
import { getClientByToken, invalidateClientCache } from "../../../lib/supabase"
import { createClient } from "@supabase/supabase-js"

function getSb() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })

  const token = req.query.token || req.headers["x-widget-token"]
  if (!token) return res.status(401).json({ error: "missing_token" })

  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: "invalid_token" })

  const { staff_id } = req.body || {}
  if (!staff_id) return res.status(400).json({ error: "missing_staff_id" })

  const staff = client.labels?.workspace_staff?.[staff_id]
  if (!staff) return res.status(404).json({ error: "staff_not_found" })

  // Check for duplicate pending requests
  const requests = client.labels?.workspace_reset_requests || []
  const hasPending = requests.some(r => r.staff_id === staff_id && r.status === "pending")
  if (hasPending) return res.json({ ok: true, message: "already_requested" })

  // Add request
  const labels = { ...client.labels }
  labels.workspace_reset_requests = [
    ...(labels.workspace_reset_requests || []),
    {
      staff_id,
      name: staff.name,
      requested_at: new Date().toISOString(),
      status: "pending"
    }
  ]

  const sb = getSb()
  const { error } = await sb.from("clients").update({ labels }).eq("id", client.id)
  if (error) {
    console.error("Reset request failed:", error)
    return res.status(500).json({ error: "update_failed" })
  }

  invalidateClientCache(client.slug)
  return res.json({ ok: true })
}
