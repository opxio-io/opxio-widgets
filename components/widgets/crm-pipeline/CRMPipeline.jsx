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

// Resolve enabledSections — supports both new (array) and legacy (sections obj + sectionOrder) format
function resolveEnabledSections(config) {
  if (Array.isArray(config.enabledSections)) return config.enabledSections
  // Legacy format migration
  const order = config.sectionOrder || DEFAULT_ENABLED_SECTIONS
  const secs  = config.sections || {}
  return order.filter(k => secs[k] !== false)
}

export default function CRMPipeline({ config, token, bypass = false }) {
  const [theme,         setTheme]         = useState('dark')
  const [filterMonth,   setFilterMonth]   = useState(null)
  const [refreshSignal, setRefreshSignal] = useState(0)

  const { data, loading, error } = useCRMData({
    token,
    apiEndpoint:  config.apiEndpoint,
    filterMonth,
    refreshSignal,
  })

  const handlePrev    = useCallback(() => setFilterMonth(fm => prevMonth(fm)), [])
  const handleNext    = useCallback(() => setFilterMonth(fm => nextMonth(fm)), [])
  const handleRefresh = useCallback(() => setRefreshSignal(n => n + 1), [])
  const toggleTheme   = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])

  const isCurrentMonth = !filterMonth
  const monthLabel     = fmtLabel(filterMonth)
  const enabledSections = resolveEnabledSections(config)

  const newLeads    = data?.stats?.monthLeads    ?? 0
  const quotesSent  = data?.stats?.quotesSent    ?? 0
  const closedWon   = data?.stats?.closedWon     ?? 0
  const closedLost  = data?.stats?.closedLost    ?? 0
  const closeRate   = data?.stats?.closeRate     ?? null
  const followUps   = data?.stats?.followUps     ?? 0
  const overdue     = data?.stats?.overdueQuotes ?? 0
  const stageFunnel = data?.stats?.stageFunnel   ?? []
  const reps        = data?.stats?.reps          ?? []
  const sources     = data?.stats?.sources       ?? []
  const stillActive = data?.stats?.stillActive   ?? 0
  const updatedAt   = data?.meta?.updatedAt      ?? null
  const totalPipeline = data?.stats?.totalPipeline ?? null

  const closeRateDisplay = closeRate !== null ? `${Math.round(closeRate * 100)}%` : '—'
  const closeRateColor   = closeRate !== null
    ? (closeRate >= 0.5 ? 'lime' : closeRate >= 0.3 ? 'amber' : 'red')
    : 'muted'

  // Section renderer
  function renderSection(id) {
    switch(id) {
      case 'pipeline':
        return isCurrentMonth ? (
          <div key="pipeline" className={s.row2}>
            <div className={s.pipelineCol}>
              <PipelineFunnel stageFunnel={stageFunnel} stages={config.stages} monthLeads={newLeads} monthLabel={monthLabel} stillActive={stillActive} isPastMonth={false} />
            </div>
            {enabledSections.includes('liveColumn') ? null : null /* live handled separately */}
          </div>
        ) : (
          <PipelineFunnel key="pipeline" stageFunnel={stageFunnel} stages={config.stages} monthLeads={newLeads} monthLabel={monthLabel} stillActive={stillActive} isPastMonth={true} />
        )
      case 'salesReps':
        return <SalesRepCards key="reps" reps={reps} monthLabel={monthLabel} empty={reps.length === 0} />
      case 'leadSources':
        return <LeadSources key="sources" sources={sources} monthLabel={monthLabel} empty={sources.length === 0} />
      case 'liveColumn':
        return isCurrentMonth
          ? <LiveColumn key="live" followUps={followUps} overdueQuotes={overdue} totalPipeline={totalPipeline} />
          : null
      default:
        return null
    }
  }

  // Pipeline + live column special case: they go side-by-side in current month
  const hasPipeline = enabledSections.includes('pipeline')
  const hasLive     = enabledSections.includes('liveColumn')
  const otherSections = enabledSections.filter(id => id !== 'pipeline' && id !== 'liveColumn')

  return (
    <WidgetShell theme={theme} onThemeToggle={toggleTheme} loading={loading} error={error} bypass={bypass}>
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
          {/* KPI row — always shown */}
          <div className={s.heroRow}>
            <HeroCard eyebrow={config.eyebrow} value={newLeads} label={`${config.terminology?.newLeads ?? 'New Leads'} — ${monthLabel}`} />
            <KPICard label={config.terminology?.quotesSent ?? 'Quotations Sent'} value={quotesSent} color="blue" />
            <KPICard label={config.terminology?.closedWon  ?? 'Closed Won'}      value={closedWon}  color="lime" />
            <KPICard label={config.terminology?.closeRate  ?? 'Close Rate'} value={closeRateDisplay}
              subtitle={closedLost > 0 ? `${closedWon}W · ${closedLost}L` : null} color={closeRateColor} />
          </div>

          {/* Pipeline + Live side-by-side (current month) or stacked (past month) */}
          {hasPipeline && (
            isCurrentMonth && hasLive ? (
              <div className={s.row2}>
                <div className={s.pipelineCol}>
                  <PipelineFunnel stageFunnel={stageFunnel} stages={config.stages} monthLeads={newLeads} monthLabel={monthLabel} stillActive={stillActive} isPastMonth={false} />
                </div>
                <div className={s.liveCol}>
                  <LiveColumn followUps={followUps} overdueQuotes={overdue} totalPipeline={totalPipeline} />
                </div>
              </div>
            ) : (
              <>
                <PipelineFunnel stageFunnel={stageFunnel} stages={config.stages} monthLeads={newLeads} monthLabel={monthLabel} stillActive={stillActive} isPastMonth={!isCurrentMonth} />
                {hasLive && isCurrentMonth && (
                  <LiveColumn followUps={followUps} overdueQuotes={overdue} totalPipeline={totalPipeline} />
                )}
              </>
            )
          )}

          {/* Remaining sections in configured order */}
          {otherSections.length > 0 && (
            <div className={s.row3}>
              {otherSections.map(id => renderSection(id))}
            </div>
          )}
        </>
      )}
    </WidgetShell>
  )
}
