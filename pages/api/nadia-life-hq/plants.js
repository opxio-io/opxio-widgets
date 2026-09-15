const NOTION_VERSION = '2022-06-28'
const DATABASE_ID = '99d22665d3d54ec886714d1b24daed53'

function plainText(property) {
  return (property?.rich_text || property?.title || []).map(part => part.plain_text || '').join('')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  if (!process.env.NOTION_TOKEN) return res.status(500).json({ error: 'NOTION_TOKEN is not configured' })

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ page_size: 100 }),
    })

    const data = await response.json()
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Notion request failed' })

    const plants = data.results.map(page => {
      const p = page.properties || {}
      return {
        id: page.id,
        name: plainText(p.Plant) || 'Untitled plant',
        commonName: plainText(p['Common Name']),
        health: p.Health?.select?.name || null,
        room: p.Room?.select?.name || null,
        petSafe: Boolean(p['Pet Safe']?.checkbox),
        nextWater: p['Next Water']?.date?.start || null,
        nextFertilize: p['Next Fertilize']?.date?.start || null,
      }
    })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dueWater = plants.filter(p => p.nextWater && new Date(p.nextWater) <= today).length
    const needsAttention = plants.filter(p => p.health === 'Needs Attention').length

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ count: plants.length, dueWater, needsAttention, plants })
  } catch (error) {
    return res.status(500).json({ error: 'Unable to load Notion data' })
  }
}
