// pages/api/proposals/[id]/html.js
// GET — returns the full rendered proposal HTML for iframe preview
// Accepts optional query overrides to preview unsaved changes:
//   ?situation=...&problems_solved=...&os_type=...&fee=...

import { fetchProposalData } from "../../../../lib/pdf"
import {
  OS_DEFAULT_MODULES,
  OS_DEFAULT_ADDONS_LATER,
  renderProposal,
} from "../../../../lib/proposal_template"

function fmtDate(iso) {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
}

const isCoreItem = name =>
  /base\s*os/i.test(name) ||
  /\b(revenue|operations|business|marketing|agency|team|retention|intelligence|starter|finance)\s+os\b/i.test(name)

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end()

  const rawId = req.query.id
  if (!rawId) return res.status(400).send("Missing id")
  const pageId = rawId.replace(/-/g, "")
  const token  = process.env.NOTION_API_KEY

  try {
    const data = await fetchProposalData(pageId, token)

    // Fetch page blocks for custom content
    let customBlocks = []
    try {
      const br = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
        headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" }
      })
      const bd = await br.json()
      customBlocks = (bd.results || []).map(b => {
        const type = b.type
        const richText = b[type]?.rich_text || []
        const text = richText.map(t => t.plain_text).join("")
        return { type, text }
      }).filter(b => b.text)
    } catch {}

    // Query overrides — allow editor to preview live edits before saving
    const q = req.query
    if (q.situation       !== undefined) data.situation       = q.situation
    if (q.problems_solved !== undefined) data.problems_solved = q.problems_solved
    if (q.goals           !== undefined) data.goals           = q.goals
    if (q.os_type         !== undefined) data.os_type         = q.os_type
    if (q.fee             !== undefined) data.fee             = Number(q.fee) || data.fee
    if (q.timeline        !== undefined) data.timeline        = q.timeline
    if (q.notion_plan     !== undefined) data.notion_plan     = q.notion_plan
    if (q.install_tier    !== undefined) data.install_tier    = q.install_tier

    const osType     = data.os_type || ""
    const modules    = OS_DEFAULT_MODULES[osType] || {}
    const addonsLater = OS_DEFAULT_ADDONS_LATER[osType] || []

    const coreItems  = (data.line_items || []).filter(i => isCoreItem(i.name || ""))
    const addonItems = (data.line_items || []).filter(i => !isCoreItem(i.name || ""))
    const feeBase    = coreItems.length
      ? coreItems.reduce((s, i) => s + (i.qty || 1) * (i.unit_price || 0), 0)
      : (data.line_items || []).reduce((s, i) => s + (i.qty || 1) * (i.unit_price || 0), 0)
    const fee = q.fee !== undefined ? (Number(q.fee) || 0) : (feeBase || data.fee || 0)

    const addonNowItems = addonItems.map(i => ({
      name:        i.name || "",
      desc:        i.desc || "",
      price_label: i.unit_price ? `RM ${Number(i.unit_price).toLocaleString("en-MY")}` : "",
      cadence:     "one-time",
    }))

    const situation = [
      data.situation       ? { label: "Situation",       text: data.situation }       : null,
      data.problems_solved ? { label: "Problems Solved", text: data.problems_solved } : null,
      data.goals           ? { label: "Goals",           text: data.goals }           : null,
    ].filter(Boolean)

    const html = renderProposal({
      ref_number:   data.proposal_no || "",
      date:         fmtDate(data.issue_date) || new Date().toLocaleDateString("en-MY", { month: "long", year: "numeric" }),
      valid_until:  fmtDate(data.valid_until),
      company_name: data.company_name || "Client",
      contact_name: data.pic_name     || "",
      contact_role: data.pic_role     || "",
      whatsapp:     data.pic_phone    || "",
      email:        "hello@opxio.io",
      website:      "opxio.io",
      os_type:      osType,
      install_tier: data.install_tier || "Standard",
      notion_plan:  data.notion_plan  || "Plus",
      timeline:     data.timeline     || "3–4 weeks",
      fee,
      situation,
      modules,
      addons_now:   addonNowItems,
      addons_later: addonsLater,
      custom_blocks: customBlocks,
    })

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Cache-Control", "no-store")
    return res.status(200).send(html)
  } catch (e) {
    console.error("[proposals/html]", e.message)
    return res.status(500).send(`<html><body><pre style="padding:32px;font-family:monospace">Error: ${e.message}</pre></body></html>`)
  }
}
