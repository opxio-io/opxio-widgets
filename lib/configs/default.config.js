// lib/configs/default.config.js
// Base config — all clients inherit from this

export const defaultConfig = {
  clientId:    'default',
  clientName:  'Client',
  eyebrow:     'CLIENT',
  widgetTitle: 'CRM & Pipeline',
  apiEndpoint: null, // must be set per client

  stages: [
    { key: 'New Lead',           label: 'New Lead',           color: '#6B7280' },
    { key: 'Quotation Sent',     label: 'Quotation Sent',     color: '#4B8EC4' },
    { key: 'Negotiation',        label: 'Negotiation',        color: '#B8882E' },
    { key: 'Sales Order Issued', label: 'Sales Order Issued', color: '#7B5EA7' },
    { key: 'Closed Won',         label: 'Closed Won',         color: '#C8FF00' },
    { key: 'Closed Lost',        label: 'Closed Lost',        color: '#8B4444' },
  ],

  terminology: {
    newLeads:           'New Leads',
    closedWon:          'Closed Won',
    closedLost:         'Closed Lost',
    closeRate:          'Close Rate',
    closeRateSub:       'Closed Won / Quotes Sent',
    avgDaysToClose:     'Avg Days to Close',
    avgDaysToCloseSub:  'Lead to Closed Won',
    quoteToWin:         'Quote to Win',
    quoteToWinSub:      'Quote sent to Closed Won',
    pipelineStages:     'Pipeline Stages',
    salesRepPerf:       'Sales Rep Performance',
    leadSources:        'Lead Sources',
    followupsToday:     'Follow-ups Due Today',
    overdueQuotations:  'Overdue Quotations',
    closedWonLabel:     'Closed Won',
    activePipeline:     'Active Pipeline',
    activities:         'Activities',
  },

  sections: {
    pipeline:    true,
    salesReps:   true,
    leadSources: true,
    liveColumn:  true,
  },
}
