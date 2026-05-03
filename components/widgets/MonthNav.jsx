// components/widgets/MonthNav.jsx
import s from '@/styles/widget.module.css'

function fmtLabel(fm) {
  const d = fm ? new Date(fm.year, fm.month, 1) : new Date()
  return d.toLocaleString('default', { month: 'short', year: 'numeric' })
}

export default function MonthNav({ filterMonth, onPrev, onNext, onRefresh, onThemeToggle, updatedAt, loading }) {
  const now = new Date()
  const isCurrentMonth = !filterMonth ||
    (filterMonth.year === now.getFullYear() && filterMonth.month === now.getMonth())

  const ts = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={s.headerRight}>
      {ts && <span className={s.ts}>Updated {ts}</span>}
      <div className={s.mnWrap}>
        <button className={s.mnBtn} onClick={onPrev} title="Previous month">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M6.5 2L3.5 5L6.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <span className={s.mnLbl}>{fmtLabel(filterMonth)}</span>
        <button className={s.mnBtn} onClick={onNext} disabled={isCurrentMonth} title="Next month"
          style={isCurrentMonth ? { opacity: .35, cursor: 'default' } : {}}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M3.5 2L6.5 5L3.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <button className={s.iconBtn} onClick={onThemeToggle} title="Toggle theme">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>
      <button className={`${s.iconBtn}${loading ? ` ${s.spinning}` : ''}`} onClick={onRefresh} title="Refresh">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>
  )
}
