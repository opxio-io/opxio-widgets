// components/widgets/LeadSources.jsx
import Image from 'next/image'
import s from '@/styles/widget.module.css'

// Map source names to icon files and brand colors — matches HTML widget SRC_MAP exactly
const SRC_MAP = {
  'WhatsApp':           { icon: '/icons/social/social.png',        color: '#25D366' },
  'Instagram':          { icon: '/icons/social/instagram.png',     color: '#E1306C' },
  'Facebook':           { icon: '/icons/social/facebook.png',      color: '#60A5FA' },
  'Facebook Ads':       { icon: '/icons/social/facebook.png',      color: '#60A5FA' },
  'Iklan Facebook':     { icon: '/icons/social/facebook.png',      color: '#60A5FA' },
  'TikTok':             { icon: '/icons/social/tiktok.png',        color: '#E879F9' },
  'Threads':            { icon: '/icons/social/threads.png',       color: '#F97316' },
  'Referral':           { icon: '/icons/social/referral.png',      color: '#C8FF00' },
  'Rujukan / Kenalan':  { icon: '/icons/social/referral.png',      color: '#C8FF00' },
  'Walk-in':            { icon: '/icons/social/walk-in.png',       color: '#34D399' },
  'LinkedIn':           { icon: '/icons/social/linkedin.png',      color: '#60A5FA' },
  'Shopee':             { icon: '/icons/social/shopee.png',        color: '#F97316' },
  'Twitter':            { icon: '/icons/social/twitter.png',       color: '#60A5FA' },
  'Others':             { icon: '/icons/social/other-sources.png', color: '#9CA3AF' },
  'Lain-lain':          { icon: '/icons/social/other-sources.png', color: '#9CA3AF' },
}
function srcEntry(name) { return SRC_MAP[name] || SRC_MAP['Others'] }

function getRateStyle(rate) {
  const pct = rate != null ? Math.round(rate * 100) : -1
  if (pct >= 25) return { color: 'var(--g)',     background: 'rgba(200,255,0,.1)' }
  if (pct > 0)   return { color: 'var(--amber)',  background: 'rgba(251,191,36,.1)' }
  return           { color: 'rgba(255,255,255,.35)', background: 'rgba(255,255,255,.05)' }
}

export default function LeadSources({ sources = [], monthLabel, empty }) {
  const total = sources.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>Lead Sources</span>
        <span className={s.badge}>{total} total</span>
      </div>

      {empty || sources.length === 0 ? (
        <div className={s.emptyState}>No source data for {monthLabel}</div>
      ) : (
        <div className={s.srcGrid}>
          {sources.map(src => {
            const entry  = srcEntry(src.name)
            const won    = src.won ?? 0
            const rate   = src.closeRate ?? null
            const pct    = rate != null ? Math.round(rate * 100) : null
            const rStyle = getRateStyle(rate)
            const numCol = src.count > 0 ? 'var(--g)' : 'rgba(255,255,255,.18)'

            return (
              <div key={src.name} className={s.srcCard}>
                <div className={s.srcCardTop}>
                  <div className={s.srcIcon}>
                    <Image src={entry.icon} alt={src.name} width={22} height={22}
                      style={{ objectFit: 'contain', opacity: 0.95 }} unoptimized />
                  </div>
                  <div className={s.srcName}>{src.name}</div>
                </div>
                <div className={s.srcCount} style={{ color: numCol }}>{src.count}</div>
                <div className={s.srcCardFoot}>
                  <span className={s.srcLeadsLbl}>{won} closed</span>
                  <span className={s.srcClosePill} style={rStyle}>
                    {pct != null ? `${pct}%` : '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
