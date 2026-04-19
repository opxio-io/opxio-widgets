// pages/api/proposals/[id]/blocks.js
// GET: fetch child blocks of a Notion page
// PUT: replace all child blocks with provided array

const NOTION_VERSION = "2022-06-28"

async function fetchBlocks(pageId, token) {
  const r = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION }
  })
  const d = await r.json()
  return (d.results || []).map(b => {
    const type = b.type
    const richText = b[type]?.rich_text || []
    const text = richText.map(t => t.plain_text).join("")
    return { id: b.id, type, text }
  }).filter(b => b.text || b.type === "divider")
}

async function deleteBlock(blockId, token) {
  await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION }
  })
}

async function appendBlocks(pageId, blocks, token) {
  const children = blocks.map(b => {
    const type = b.type || "paragraph"
    return {
      object: "block",
      type,
      [type]: {
        rich_text: [{ type: "text", text: { content: b.text || "" } }]
      }
    }
  }).filter(b => b[b.type]?.rich_text?.[0]?.text?.content)

  if (!children.length) return
  await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": NOTION_VERSION, "Content-Type": "application/json" },
    body: JSON.stringify({ children })
  })
}

export default async function handler(req, res) {
  const rawId = req.query.id
  if (!rawId) return res.status(400).json({ error: "Missing id" })
  const pageId = rawId.replace(/-/g, "")
  const token = process.env.NOTION_API_KEY

  if (req.method === "GET") {
    try {
      const blocks = await fetchBlocks(pageId, token)
      return res.status(200).json({ blocks })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { blocks = [] } = req.body || {}
      // 1. Delete existing blocks
      const existing = await fetchBlocks(pageId, token)
      await Promise.all(existing.map(b => deleteBlock(b.id, token)))
      // 2. Append new blocks
      await appendBlocks(pageId, blocks, token)
      return res.status(200).json({ ok: true, count: blocks.length })
    } catch (e) {
      return res.status(500).json({ error: e.message })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
