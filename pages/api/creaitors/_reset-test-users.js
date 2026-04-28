// TEMPORARY — delete after use
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()
  const { secret } = req.body || {}
  if (secret !== "opxio-reset-2026") return res.status(403).json({ error: "nope" })

  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
  const token = "f647b9df0a380951e524f18de1194faac46cdac82694bfb15fb032f13fab00d1"
  const { data: client } = await sb.from("clients").select("*").eq("access_token", token).single()
  if (!client) return res.status(404).json({ error: "not found" })

  const defaults = {
    "502736ebbe34829aada981e516950457": { name: "Maisarah", pw: "maisarah2026" },
    "e0c736ebbe3483b685990149c8c57a64": { name: "Firdaus", pw: "firdaus2026" }
  }

  const labels = { ...client.labels }
  labels.workspace_staff = { ...labels.workspace_staff }

  for (const [id, info] of Object.entries(defaults)) {
    if (labels.workspace_staff[id]) {
      labels.workspace_staff[id] = {
        ...labels.workspace_staff[id],
        password_hash: bcrypt.hashSync(info.pw, 10),
        must_change: true,
        backup_code_hash: null
      }
    }
  }

  const { error } = await sb.from("clients").update({ labels }).eq("id", client.id)
  if (error) return res.status(500).json({ error: error.message })
  return res.json({ ok: true, reset: Object.keys(defaults) })
}
