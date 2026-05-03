// components/widgets/LeadSources.jsx
import s from '@/styles/widget.module.css'

const ICONS = {
  'Instagram':  '📸', 'Facebook': '👥', 'WhatsApp': '💬', 'LinkedIn': '💼',
  'TikTok':     '🎵', 'Referral': '🤝', 'Google':   '🔍', 'Walk-in':  '🚶',
  'Cold Call':  '📞', 'Email':    '📧', 'Website':  '🌐', 'Others':   '📌',
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
          {sources.map(src => (
            <div key={src.name} className={s.srcCard}>
              <div className={s.srcIcon}>{ICONS[src.name] || '📌'}</div>
              <div className={s.srcName}>{src.name}</div>
              <div className={s.srcN}>{src.count}</div>
              <div className={s.srcMeta}>
                <span>{src.won ?? 0}W · {src.lost ?? 0}L</span>
                <span className={s.srcRate}>
                  {src.closeRate != null ? `${Math.round(src.closeRate * 100)}%` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
