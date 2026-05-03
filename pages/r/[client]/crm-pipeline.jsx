// pages/r/[client]/crm-pipeline.jsx
// React CRM Pipeline widget — test route at /r/{client-slug}/crm-pipeline
import { getConfig } from '@/lib/configs'
import CRMPipeline   from '@/components/widgets/crm-pipeline/CRMPipeline'

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
  const config = getConfig(params.client)
  const token  = query.token || null

  // Security headers — allow only Notion embedding + no indexing
  res.setHeader('X-Robots-Tag', 'noindex')
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self' https://notion.so https://*.notion.so https://*.notion.site")

  return {
    props: {
      config: config ?? null,
      token,
    },
  }
}
