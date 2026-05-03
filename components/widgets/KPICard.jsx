// components/widgets/KPICard.jsx
import s from '@/styles/widget.module.css'

const COLOR_MAP = {
  lime:  'var(--g)',
  amber: 'var(--amber)',
  blue:  'var(--blue)',
  red:   'var(--red)',
  muted: 'var(--zero)',
}

export function HeroCard({ eyebrow, value, label }) {
  return (
    <div className={s.card}>
      <span className={s.heroEyebrow}>{eyebrow}</span>
      <div className={s.heroVal}>{value}</div>
      <div className={s.heroLabel}>{label}</div>
    </div>
  )
}

export function KPICard({ label, value, subtitle, color = 'lime' }) {
  return (
    <div className={s.card}>
      <span className={s.kpiLbl}>{label}</span>
      <div className={s.kpiVal} style={{ color: COLOR_MAP[color] || color }}>{value}</div>
      {subtitle && <div className={s.kpiSub}>{subtitle}</div>}
    </div>
  )
}
