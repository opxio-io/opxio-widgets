// components/widgets/SalesRepCards.jsx
import { useState } from 'react'
import s from '@/styles/widget.module.css'

const PAGE_SIZE = 4

export default function SalesRepCards({ reps = [], monthLabel, empty }) {
  const [page, setPage] = useState(0)
  const pages = Math.ceil(reps.length / PAGE_SIZE)
  const slice = reps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const cols  = slice.length <= 2 ? 2 : 4

  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>Sales Reps</span>
        <span className={s.badge}>{monthLabel}</span>
      </div>

      {empty || reps.length === 0 ? (
        <div className={s.emptyState}>No rep data for {monthLabel}</div>
      ) : (
        <>
          <div className={`${s.repGrid} ${cols === 2 ? s.repGrid2 : s.repGrid4}`}>
            {slice.map((rep, i) => {
              const rank     = page * PAGE_SIZE + i + 1
              const isLeader = rank === 1
              const maxWon   = reps[0]?.closedWon || 1
              const pct      = Math.round(((rep.closedWon || 0) / maxWon) * 100)
              return (
                <div key={rep.name} className={`${s.repCard}${isLeader ? ` ${s.repLeader}` : ''}`}>
                  <div className={s.repTop}>
                    <span className={s.repName}>{rep.name}</span>
                    <span className={s.repRank}>#{rank}</span>
                  </div>
                  <div className={s.repHeroVal}>{rep.closedWon ?? 0}</div>
                  <div className={s.repHeroLbl}>Closed Won</div>
                  <div className={s.repBarWrap}>
                    <div className={s.repBarLbl}>
                      <span>Win rate</span>
                      <span>{rep.closeRate != null ? `${Math.round(rep.closeRate * 100)}%` : '—'}</span>
                    </div>
                    <div className={s.repBarTrack}>
                      <div className={s.repBarFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className={s.repMeta}>
                    <span>Leads</span>
                    <span className={s.repMetaVal}>{rep.leads ?? 0}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className={s.paginator}>
              <button className={s.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 0}>←</button>
              <span className={s.pageInfo}>{page + 1} / {pages}</span>
              <button className={s.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
