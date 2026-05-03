// components/widgets/SalesRepCards.jsx
import { useState } from 'react'
import s from '@/styles/widget.module.css'

const PAGE_SIZE = 4

export default function SalesRepCards({ repBreakdown = [], terminology = {} }) {
  const [page, setPage] = useState(0)
  const reps  = repBreakdown
  const total = reps.length

  const layout  = total <= 2 ? s.repGrid2 : s.repGrid4
  const pages   = Math.ceil(total / PAGE_SIZE)
  const visible = total <= 4 ? reps : reps.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const maxWon  = Math.max(...reps.map(r => r.closedWon), 1)

  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>{terminology.salesRepPerf || 'Sales Rep Performance'}</span>
        <span className={`${s.badge} ${s.badgeBlue}`}>{total} rep{total !== 1 ? 's' : ''}</span>
      </div>

      <div className={`${s.repGrid} ${layout}`}>
        {visible.map((rep, idx) => {
          const rank     = reps.indexOf(rep) + 1
          const isLeader = rank === 1
          const decided  = rep.closedWon + rep.closedLost
          const cr       = decided > 0 ? Math.round((rep.closedWon / decided) * 100) : 0
          const barW     = maxWon > 0 ? Math.round((rep.closedWon / maxWon) * 100) : 0

          return (
            <div key={rep.name} className={`${s.repCard}${isLeader ? ` ${s.repLeader}` : ''}`}>
              <div className={s.repTop}>
                <span className={s.repName}>{rep.name}</span>
                <span className={s.repRank}>#{rank}</span>
              </div>
              <div className={s.repHeroVal}>{rep.closedWon}</div>
              <div className={s.repHeroLbl}>{terminology.closedWonLabel || 'Closed Won'}</div>
              <div className={s.repBarWrap}>
                <div className={s.repBarLbl}>
                  <span>Close Rate</span>
                  <span style={{ color: 'var(--g)', fontWeight: 700 }}>{cr}%</span>
                </div>
                <div className={s.repBarTrack}>
                  <div className={s.repBarFill} style={{ width: `${barW}%` }} />
                </div>
              </div>
              <div className={s.repMeta}>
                <span>{terminology.activities || 'Activities'}</span>
                <span className={s.repMetaVal}>{rep.activities}</span>
              </div>
            </div>
          )
        })}
      </div>

      {pages > 1 && (
        <div className={s.paginator}>
          <button className={s.pageBtn} disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className={s.pageInfo}>Page {page + 1} of {pages}</span>
          <button className={s.pageBtn} disabled={page === pages - 1} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}
