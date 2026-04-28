/**
 * POST /api/creaitors/workspace-reset
 *
 * Admin endpoint: resets a staff member's workspace password.
 * Sets password to a given value and flips must_change back to true.
 *
 * Headers: x-admin-key (must match SUPABASE_SERVICE_KEY)
 * Body: { staff_id, new_password }
 * Query: ?token=<client_access_token>
 *
 * Returns:
 *   200 { ok: true, name, new_password }
 *   401 { error: "unauthorized" }
 *   404 { error: "staff_not_found" }
 */
import { getClientByToken, invalidateClientCache } from "../../../lib/supabase"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-key")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })

  // Admin auth — requires service key in header
  const adminKey = req.headers["x-admin-key"]
  if (!adminKey || adminKey !== process.env.SUPABASE_SERVICE_KEY) {
    return res.status(401).json({ error: "unauthorized" })
  }

  const token = req.query.token || req.headers["x-widget-token"]
  if (!token) return res.status(401).json({ error: "missing_token" })

  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: "invalid_token" })

  const { staff_id, new_password } = req.body || {}
  if (!staff_id) return res.status(400).json({ error: "missing_staff_id" })

  const staff = client.labels?.workspace_staff?.[staff_id]
  if (!staff) return res.status(404).json({ error: "staff_not_found" })

  // Default reset password: firstname in lowercase + "2026"
  const resetPw = new_password || (staff.name.split(" ")[0].toLowerCase() + "2026")
  const newHash = bcrypt.hashSync(resetPw, 10)

  const labels = { ...client.labels }
  labels.workspace_staff = { ...labels.workspace_staff }
  labels.workspace_staff[staff_id] = {
    ...staff,
    password_hash: newHash,
    must_change: true
  }

  const sb = getSb()
  const { error } = await sb.from("clients").update({ labels }).eq("id", client.id)
  if (error) {
    console.error("Reset failed:", error)
    return res.status(500).json({ error: "update_failed" })
  }

  invalidateClientCache(client.slug)

  return res.json({ ok: true, name: staff.name, new_password: resetPw })
}
