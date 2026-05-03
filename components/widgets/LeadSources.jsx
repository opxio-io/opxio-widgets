// components/widgets/LeadSources.jsx
import s from '@/styles/widget.module.css'

const ICONS = {
  'Facebook Ads': '📘', 'TikTok': '🎵', 'Referral': '🤝',
  'Walk-in': '🚶', 'Threads': '🧵', 'Instagram': '📸',
  'Google Ads': '🔍', 'Others': '📡', 'WhatsApp': '💬',
}

export default function LeadSources({ sourceBreakdown = {}, terminology = {} }) {
  const sources  = Object.entries(sourceBreakdown).sort((a, b) => b[1].leads - a[1].leads)
  const totalLeads = sources.reduce((sum, [, v]) => sum + v.leads, 0)

  return (
    <div className={s.card} style={{ gridColumn: '1 / -1' }}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>{terminology.leadSources || 'Lead Sources'}</span>
        <span className={s.badge}>{totalLeads} total</span>
      </div>
      <div className={s.srcGrid}>
        {sources.map(([src, v]) => {
          const rate = v.leads > 0 ? Math.round((v.closed / v.leads) * 100) : 0
          return (
            <div key={src} className={s.srcCard}>
              <div className={s.srcIcon}>{ICONS[src] || '📌'}</div>
              <div className={s.srcName}>{src}</div>
              <div className={s.srcN}>{v.leads}</div>
              <div className={s.srcMeta}>
                <span>{v.closed} closed</span>
                <span className={s.srcRate}>{rate}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
