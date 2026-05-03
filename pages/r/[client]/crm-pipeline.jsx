// pages/r/[client]/crm-pipeline.jsx
// React CRM Pipeline widget — /r/{client-slug}/crm-pipeline
// Config loaded from Supabase (admin-configured), falls back to JS config
import { getConfig }   from '@/lib/configs'
import CRMPipeline     from '@/components/widgets/crm-pipeline/CRMPipeline'

export default function CRMPipelinePage({ config, token }) {
  if (!config) {
    return (
      <div style={{ background: '#191919', color: '#555', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', fontSize: 13, letterSpacing: '.5px' }}>
        CLIENT NOT FOUND
      </div>
    )
  }
  return <CRMPipeline config={config} token={token} />
}

export async function getServerSideProps({ params, query, res }) {
  // Security headers
  res.setHeader('X-Robots-Tag', 'noindex')
  res.setHeader(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://notion.so https://*.notion.so https://*.notion.site"
  )

  const clientId = params.client
  const token    = query.token || null

  // 1. Load JS config as base
  const jsConfig = getConfig(clientId)
  if (!jsConfig || jsConfig.clientId === 'default') {
    return { props: { config: null, token } }
  }

  // 2. Try to load Supabase-saved config
  let savedConfig = null
  try {
    const adminKey = process.env.ADMIN_KEY || ''
    if (adminKey) {
      const r = await fetch(
        `https://api.opxio.io/api/admin/widget-configs/${clientId}?adminKey=${encodeURIComponent(adminKey)}`,
        { headers: { 'x-admin-key': adminKey }, signal: AbortSignal.timeout(3000) }
      )
      if (r.ok) {
        const rows = await r.json()
        const row  = rows.find(r => r.widget_type === 'crm-pipeline')
        if (row?.config) savedConfig = row.config
      }
    }
  } catch (_) {
    // Supabase fetch failed — fall back to JS config silently
  }

  // 3. Merge: JS config → Supabase overrides
  const config = savedConfig
    ? {
        ...jsConfig,
        ...savedConfig,
        terminology: { ...(jsConfig.terminology || {}), ...(savedConfig.terminology || {}) },
        sections:    { ...(jsConfig.sections    || {}), ...(savedConfig.sections    || {}) },
        stages:      savedConfig.stages || jsConfig.stages,
        sectionOrder: savedConfig.sectionOrder || jsConfig.sectionOrder,
      }
    : jsConfig

  return { props: { config, token } }
}
