// components/widgets/LeadSources.jsx
import s from '@/styles/widget.module.css'

const ICONS = {
  'Instagram':  '📸', 'Facebook': '👥', 'WhatsApp': '💬', 'LinkedIn': '💼',
  'TikTok':     '🎵', 'Referral': '🤝', 'Google':   '🔍', 'Walk-in':  '🚶',
  'Cold Call':  '📞', 'Email':    '📧', 'Website':  '🌐', 'Others':   '📌',
}

function getCountColor(count, closeRate) {
  if (!count) return 'rgba(255,255,255,.18)'
  if (closeRate != null && closeRate >= 0.25) return 'var(--g)'
  return 'var(--text)'
}

function getRateStyle(rate) {
  // rate is 0–1
  const pct = rate != null ? Math.round(rate * 100) : -1
  if (pct >= 25) return { color: 'var(--g)', background: 'rgba(200,255,0,.1)' }
  if (pct > 0)   return { color: 'var(--amber)', background: 'rgba(251,191,36,.1)' }
  return { color: 'rgba(255,255,255,.35)', background: 'rgba(255,255,255,.05)' }
}

export default function LeadSources({ sources = [], monthLabel, empty }) {
  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>Lead Sources</span>
        <span className={s.badge}>{monthLabel}</span>
      </div>

      {empty || sources.length === 0 ? (
        <div className={s.emptyState}>No source data for {monthLabel}</div>
      ) : (
        <div className={s.srcGrid}>
          {sources.map(src => {
            const rate   = src.closeRate ?? null
            const closed = (src.won ?? 0) + (src.lost ?? 0)
            const pct    = rate != null ? Math.round(rate * 100) : null
            const rStyle = getRateStyle(rate)
            const cColor = getCountColor(src.count, rate)

            return (
              <div key={src.name} className={s.srcCard}>
                <div className={s.srcCardTop}>
                  <div className={s.srcIcon}>{ICONS[src.name] || '📌'}</div>
                  <div className={s.srcName}>{src.name}</div>
                </div>
                <div className={s.srcCount} style={{ color: cColor }}>{src.count}</div>
                <div className={s.srcCardFoot}>
                  <span className={s.srcLeadsLbl}>{closed} closed</span>
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
