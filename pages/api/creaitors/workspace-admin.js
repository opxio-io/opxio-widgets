/**
 * POST /api/creaitors/workspace-admin
 *
 * Admin actions for workspace management.
 * Requires: ?token=<client_access_token>&admin_pin=<4-digit-pin>
 *
 * Actions (body.action):
 *
 *   "list" — returns staff list + pending reset requests
 *   "reset" — { staff_id } — resets password to default, clears request
 *   "set_pin" — { new_pin } — change the admin PIN (first time setup: default is "0000")
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
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")
  if (req.method === "OPTIONS") return res.status(200).end()
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" })

  const token = req.query.token || req.headers["x-widget-token"]
  if (!token) return res.status(401).json({ error: "missing_token" })

  const client = await getClientByToken(token)
  if (!client) return res.status(403).json({ error: "invalid_token" })

  // Admin PIN auth (simple 4-digit pin, stored in labels)
  const adminPin = req.body?.admin_pin || req.query.admin_pin
  const storedPin = client.labels?.workspace_admin_pin || "0000" // default first-time pin
  if (adminPin !== storedPin) {
    return res.status(401).json({ error: "wrong_pin" })
  }

  const { action } = req.body || {}
  const labels = { ...client.labels }
  const ws = labels.workspace_staff || {}
  const sb = getSb()

  // ── LIST ──
  if (action === "list") {
    const staff = Object.entries(ws).map(([id, s]) => ({
      id, name: s.name, dept: s.dept, must_change: !!s.must_change
    })).sort((a, b) => a.dept.localeCompare(b.dept) || a.name.localeCompare(b.name))

    const requests = (labels.workspace_reset_requests || [])
      .filter(r => r.status === "pending")

    return res.json({ staff, requests, is_default_pin: storedPin === "0000" })
  }

  // ── RESET PASSWORD ──
  if (action === "reset") {
    const { staff_id } = req.body
    if (!staff_id) return res.status(400).json({ error: "missing_staff_id" })
    const staff = ws[staff_id]
    if (!staff) return res.status(404).json({ error: "staff_not_found" })

    const defaultPw = staff.name.split(" ")[0].toLowerCase() + "2026"
    const newHash = bcrypt.hashSync(defaultPw, 10)

    labels.workspace_staff = { ...ws }
    labels.workspace_staff[staff_id] = { ...staff, password_hash: newHash, must_change: true }

    // Clear any pending request for this staff
    labels.workspace_reset_requests = (labels.workspace_reset_requests || [])
      .filter(r => !(r.staff_id === staff_id && r.status === "pending"))

    const { error } = await sb.from("clients").update({ labels }).eq("id", client.id)
    if (error) return res.status(500).json({ error: "update_failed" })
    invalidateClientCache(client.slug)

    return res.json({ ok: true, name: staff.name, default_password: defaultPw })
  }

  // ── SET ADMIN PIN ──
  if (action === "set_pin") {
    const { new_pin } = req.body
    if (!new_pin || !/^\d{4,6}$/.test(new_pin)) {
      return res.status(400).json({ error: "pin_must_be_4_to_6_digits" })
    }

    labels.workspace_admin_pin = new_pin
    const { error } = await sb.from("clients").update({ labels }).eq("id", client.id)
    if (error) return res.status(500).json({ error: "update_failed" })
    invalidateClientCache(client.slug)

    return res.json({ ok: true })
  }

  return res.status(400).json({ error: "invalid_action" })
}
