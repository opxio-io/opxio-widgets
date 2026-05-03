// components/widgets/LiveColumn.jsx
import s from '@/styles/widget.module.css'

export default function LiveColumn({ followupsToday = 0, followupsNext3 = 0, overdueResponse = 0 }) {
  return (
    <div className={s.liveCol}>
      <div className={s.card}>
        <span className={s.kpiLbl}>Follow-ups Due Today</span>
        <div className={s.kpiVal} style={{ color: followupsToday > 0 ? 'var(--blue)' : 'var(--zero)' }}>
          {followupsToday}
        </div>
        <div className={s.kpiSub}>Entire pipeline · {followupsNext3} due within 3 days</div>
      </div>
      <div className={s.card}>
        <span className={s.kpiLbl}>Overdue Quotations</span>
        <div className={s.kpiVal} style={{ color: overdueResponse > 0 ? 'var(--red)' : 'var(--zero)' }}>
          {overdueResponse}
        </div>
        <div className={s.kpiSub}>Entire pipeline · no quote issued after 2h</div>
      </div>
    </div>
  )
}
