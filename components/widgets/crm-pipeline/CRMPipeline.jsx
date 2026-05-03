// components/widgets/crm-pipeline/CRMPipeline.jsx
import { useState, useCallback } from 'react'
import WidgetShell    from '@/components/widgets/WidgetShell'
import MonthNav       from '@/components/widgets/MonthNav'
import { HeroCard, KPICard } from '@/components/widgets/KPICard'
import PipelineFunnel from '@/components/widgets/PipelineFunnel'
import SalesRepCards  from '@/components/widgets/SalesRepCards'
import LeadSources    from '@/components/widgets/LeadSources'
import LiveColumn     from '@/components/widgets/LiveColumn'
import { useCRMData } from '@/components/widgets/crm-pipeline/useCRMData'
import { DEFAULT_ENABLED_SECTIONS } from '@/lib/configs/sections-registry'
import s from '@/styles/widget.module.css'

function prevMonth(fm) {
  const d = fm ? new Date(fm.year, fm.month - 1, 1) : new Date()
  d.setMonth(d.getMonth() - 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}
function nextMonth(fm) {
  if (!fm) return null
  const d   = new Date(fm.year, fm.month + 1, 1)
  const now = new Date()
  if (d.getFullYear() > now.getFullYear() ||
      (d.getFullYear() === now.getFullYear() && d.getMonth() >= now.getMonth())) return null
  return { year: d.getFullYear(), month: d.getMonth() }
}
function fmtLabel(fm) {
  const d = fm ? new Date(fm.year, fm.month, 1) : new Date()
  return d.toLocaleString('default', { month: 'short', year: 'numeric' })
}

function resolveEnabledSections(config) {
  if (Array.isArray(config.enabledSections)) return config.enabledSections
  const order = config.sectionOrder || DEFAULT_ENABLED_SECTIONS
  const secs  = config.sections || {}
  return order.filter(k => secs[k] !== false)
}

export default function CRMPipeline({ config, token, bypass = false, defaultFilterMonth = null, mockData = null }) {
  const [theme,         setTheme]         = useState('dark')
  const [filterMonth,   setFilterMonth]   = useState(defaultFilterMonth)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const { data, loading, error } = useCRMData({
    token,
    apiEndpoint:  config.apiEndpoint,
    filterMonth,
    refreshSignal,
    mockData,
  })

  const handlePrev    = useCallback(() => setFilterMonth(fm => prevMonth(fm)), [])
  const handleNext    = useCallback(() => setFilterMonth(fm => nextMonth(fm)), [])
  const handleRefresh = useCallback(() => setRefreshSignal(n => n + 1), [])
  const toggleTheme   = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  const isCurrentMonth  = !filterMonth
  const monthLabel      = fmtLabel(filterMonth)
  const enabledSections = resolveEnabledSections(config)

  // ── Data ──────────────────────────────────────────────────
  const st = data?.stats || {}
  const monthLeads      = st.monthLeads      ?? 0
  const closedWon       = st.closedWon       ?? 0
  const closedLost      = st.closedLost      ?? 0
  const closeRate       = st.closeRate       ?? null
  const avgDaysToClose  = st.avgDaysToClose  ?? null
  const avgQuoteToWin   = st.avgQuoteToWin   ?? null
  const followupsToday  = st.followupsToday  ?? 0
  const followupsNext3  = st.followupsNext3  ?? 0
  const overdueResponse = st.overdueResponse ?? 0
  const stageFunnel     = st.stageFunnel     ?? []
  const reps            = st.reps            ?? []
  const sources         = st.sources         ?? []
  const stillActive     = st.stillActive     ?? 0
  const updatedAt       = data?.meta?.updatedAt ?? null

  // ── KPI display values ────────────────────────────────────
  const crDisplay = closeRate !== null ? `${Math.round(closeRate * 100)}%` : '—'
  const crColor   = closeRate !== null
    ? (closeRate >= 0.5 ? 'lime' : closeRate >= 0.3 ? 'amber' : 'red')
    : 'muted'
  const crSub  = closedLost > 0 ? `${closedWon}W · ${closedLost}L` : 'Closed Won / Quotes Sent'

  const avgDaysDisplay = avgDaysToClose !== null ? `${avgDaysToClose}d` : '—'
  const avgDaysColor   = avgDaysToClose !== null ? 'amber' : 'muted'

  const quoteWinDisplay = avgQuoteToWin !== null ? `${avgQuoteToWin}d` : '—'
  const quoteWinColor   = avgQuoteToWin !== null ? 'amber' : 'muted'

  // ── Section layout ────────────────────────────────────────
  const hasPipeline     = enabledSections.includes('pipeline')
  const hasLive         = enabledSections.includes('liveColumn')
  const otherSections   = enabledSections.filter(id => id !== 'pipeline' && id !== 'liveColumn')

  function renderSection(id) {
    switch (id) {
      case 'salesReps':
        return <SalesRepCards key="reps" reps={reps} monthLabel={monthLabel} empty={reps.length === 0} />
      case 'leadSources':
        return <LeadSources key="sources" sources={sources} monthLabel={monthLabel} empty={sources.length === 0} />
      default:
        return null
    }
  }

  const term = config.terminology || {}

  return (
    <WidgetShell theme={theme} loading={loading} error={error} bypass={bypass}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerLeft}>
          <span className={s.eyebrow}>{config.eyebrow}</span>
          <span className={s.title}>{config.widgetTitle}</span>
        </div>
        <MonthNav filterMonth={filterMonth} onPrev={handlePrev} onNext={handleNext}
          onRefresh={handleRefresh} onThemeToggle={toggleTheme} updatedAt={updatedAt} loading={loading} />
      </div>

      {data && (
        <>
          {/* Row 1 — 5 KPI cards (matches HTML widget exactly) */}
          <div className={s.heroRow}>
            <HeroCard
              eyebrow={config.eyebrow}
              value={monthLeads}
              label={`${term.newLeads ?? 'New Leads'} — ${monthLabel}`}
            />
            <KPICard
              label={term.closedWon ?? 'Closed Won'}
              value={closedWon}
              subtitle={`of ${monthLabel} leads`}
              color={closedWon > 0 ? 'lime' : 'muted'}
            />
            <KPICard
              label={term.closeRate ?? 'Close Rate'}
              value={crDisplay}
              subtitle={crSub}
              color={crColor}
            />
            <KPICard
              label={term.avgDaysToClose ?? 'Avg Days to Close'}
              value={avgDaysDisplay}
              subtitle="Lead to Closed Won"
              color={avgDaysColor}
            />
            <KPICard
              label={term.quoteToWin ?? 'Quote to Win'}
              value={quoteWinDisplay}
              subtitle="Quote sent to Closed Won"
              color={quoteWinColor}
            />
          </div>

          {/* Row 2 — Pipeline + Live column (current) or Pipeline full-width (past) */}
          {hasPipeline && (
            isCurrentMonth && hasLive ? (
              <div className={s.row2}>
                <div className={s.pipelineCol}>
                  <PipelineFunnel
                    stageFunnel={stageFunnel} stages={config.stages}
                    monthLeads={monthLeads} monthLabel={monthLabel}
                    stillActive={stillActive} isPastMonth={false}
                  />
                </div>
                <div className={s.liveCol}>
                  <LiveColumn
                    followupsToday={followupsToday}
                    followupsNext3={followupsNext3}
                    overdueResponse={overdueResponse}
                  />
                </div>
              </div>
            ) : (
              <PipelineFunnel
                stageFunnel={stageFunnel} stages={config.stages}
                monthLeads={monthLeads} monthLabel={monthLabel}
                stillActive={stillActive} isPastMonth={!isCurrentMonth}
              />
            )
          )}

          {/* Row 3 — Remaining sections */}
          {otherSections.length > 0 && (
            <div
              className={s.row3}
              style={otherSections.length === 1 ? { gridTemplateColumns: '1fr' } : {}}
            >
              {otherSections.map(id => renderSection(id))}
            </div>
          )}
        </>
      )}
    </WidgetShell>
  )
}
