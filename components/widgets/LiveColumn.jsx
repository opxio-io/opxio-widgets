// components/widgets/LiveColumn.jsx
import s from '@/styles/widget.module.css'

export default function LiveColumn({ live = {}, terminology = {} }) {
  return (
    <div className={s.liveCol}>
      <div className={s.card}>
        <span className={s.kpiLbl}>{terminology.followupsToday || 'Follow-ups Due Today'}</span>
        <div className={s.kpiVal} style={{ color: (live.followupsToday || 0) > 0 ? 'var(--blue)' : 'var(--zero)' }}>
          {live.followupsToday || 0}
        </div>
        <div className={s.kpiSub}>Entire pipeline · {live.followupsNext3 || 0} due within 3 days</div>
      </div>
      <div className={s.card}>
        <span className={s.kpiLbl}>{terminology.overdueQuotations || 'Overdue Quotations'}</span>
        <div className={s.kpiVal} style={{ color: (live.overdueResponse || 0) > 0 ? 'var(--red)' : 'var(--zero)' }}>
          {live.overdueResponse || 0}
        </div>
        <div className={s.kpiSub}>Entire pipeline · no quote issued after 2h</div>
      </div>
    </div>
  )
}
