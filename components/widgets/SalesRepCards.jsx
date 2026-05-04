// components/widgets/SalesRepCards.jsx
import { useState } from 'react'
import s from '@/styles/widget.module.css'

const PAGE_SIZE = 4

// Crown — absolutely positioned on top edge above #1 rank badge
const Crown = () => (
  <img
    src="/icons/crown.png"
    alt="crown"
    width={22}
    height={22}
    style={{
      position: 'absolute',
      top: '-14px',
      right: '10px',
      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.6))',
      pointerEvents: 'none',
    }}
    onError={e => { e.currentTarget.style.display = 'none' }}
  />
)

export default function SalesRepCards({ reps = [], monthLabel, empty }) {
  const [page, setPage] = useState(0)
  const pages = Math.ceil(reps.length / PAGE_SIZE)
  const slice = reps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const cols  = slice.length <= 2 ? 2 : 4

  // Close rate relative to max across all reps (by activities)
  const maxRate = Math.max(
    ...reps.map(r => {
      const acts = r.activities || r.leads || 0
      return acts > 0 ? Math.round((r.closedWon / acts) * 100) : 0
    }), 1
  )

  return (
    <div className={s.card}>
      <div className={s.panelHdr}>
        <span className={s.panelTitle}>Sales Rep Performance</span>
        <span className={`${s.badge} ${s.badgeBlue}`}>{reps.length} rep{reps.length !== 1 ? 's' : ''}</span>
      </div>

      {empty || reps.length === 0 ? (
        <div className={s.emptyState}>No rep data for {monthLabel}</div>
      ) : (
        <>
          <div className={`${s.repGrid} ${cols === 2 ? s.repGrid2 : s.repGrid4}`}>
            {slice.map((rep, i) => {
              const globalRank = page * PAGE_SIZE + i + 1
              const isLeader   = globalRank === 1
              const acts       = rep.activities || rep.leads || 0
              const rate       = acts > 0 ? Math.round((rep.closedWon / acts) * 100) : 0
              const barW       = maxRate > 0 ? Math.round((rate / maxRate) * 100) : 0
              const rateAmber  = rate < 30

              return (
                <div key={rep.name}
                  className={`${s.repCard}${isLeader ? ` ${s.repLeader}` : ''}`}
                  style={{ position: 'relative' }}
                >
                  {/* Header */
                  <div className={s.repCardHdr}>
                    <div className={s.repCardName}>{rep.name}</div>
                    <span className={s.repRank}>#{globalRank}</span>
                  </div>

                  {/* Hero number — centered */}
                  <div className={s.repHero}>
                    <div className={s.repHeroVal}>{rep.closedWon ?? 0}</div>
                    <div className={s.repHeroLbl}>Closed Won</div>
                  </div>

                  {/* Close rate bar */}
                  <div className={s.repBarWrap}>
                    <div className={s.repBarMeta}>
                      <span className={s.repBarLbl}>Close Rate</span>
                      <span className={`${s.repBarPct}${rateAmber ? ` ${s.repBarPctAmber}` : ''}`}>
                        {rate}%
                      </span>
                    </div>
                    <div className={s.repBarTrack}>
                      <div
                        className={s.repBarFill}
                        style={{ width: `${barW}%`, opacity: isLeader ? 1 : 0.6 }}
                      />
                    </div>
                  </div>

                  {/* Activities stat */}
                  <div className={s.repStat}>
                    <span className={s.repStatLbl}>Activities</span>
                    <span className={s.repStatVal}>{acts}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {pages > 1 && (
            <div className={s.paginator}>
              <button className={s.pageBtn} onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Prev</button>
              <span className={s.pageInfo}>Page {page + 1} of {pages}</span>
              <button className={s.pageBtn} onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
