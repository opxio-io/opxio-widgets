// components/widgets/PipelineFunnel.jsx
import s from '@/styles/widget.module.css'

export default function PipelineFunnel({ stageFunnel = [], stages = [], monthLeads = 0, monthLabel, stillActive = 0, isPastMonth }) {
  const maxCount = Math.max(...stageFunnel.map(f => f.count), 1)
  const colorMap  = Object.fromEntries(stages.map(st => [st.key, st.color]))

  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>Pipeline Stages</span>
        <span className={s.badge}>{monthLeads} Enquiries — {monthLabel}</span>
      </div>
      {stageFunnel.map((row, i) => {
        const w = Math.max(Math.round((row.count / maxCount) * 100), row.count > 0 ? 3 : 0)
        return (
          <div key={row.stage} className={s.fItem}>
            <span className={s.fLbl}>{stages.find(st => st.key === row.stage)?.label || row.stage}</span>
            <div className={s.fTrack}>
              <div className={s.fFill} style={{ width: `${w}%`, background: colorMap[row.stage] || '#555' }} />
            </div>
            <span className={s.fN}>{row.count}</span>
          </div>
        )
      })}
      {isPastMonth && stillActive > 0 && (
        <div className={s.cohortNote}>
          <span className={s.cohortDot} />
          {stillActive} leads from the {monthLabel} cohort are still open — close rate will update as they resolve.
        </div>
      )}
    </div>
  )
}
