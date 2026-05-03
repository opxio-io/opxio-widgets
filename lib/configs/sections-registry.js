// lib/configs/sections-registry.js
// Master registry of all available widget sections per widget type.
// 'available' = can be added today. 'coming-soon' = locked, shown greyed out.

export const CRM_PIPELINE_SECTIONS = {
  pipeline: {
    id:          'pipeline',
    label:       'Pipeline Stages',
    description: 'Funnel view of all leads by stage',
    icon:        '📊',
    always:      true,  // cannot be removed
    status:      'available',
  },
  liveColumn: {
    id:          'liveColumn',
    label:       'Live Action Items',
    description: 'Follow-ups due today + overdue quotations — current month only',
    icon:        '⚡',
    status:      'available',
    currentMonthOnly: true,
  },
  salesReps: {
    id:          'salesReps',
    label:       'Sales Rep Performance',
    description: 'Leaderboard of rep stats for the selected month',
    icon:        '👤',
    status:      'available',
  },
  leadSources: {
    id:          'leadSources',
    label:       'Lead Sources',
    description: 'Breakdown of where leads are coming from',
    icon:        '🔍',
    status:      'available',
  },
  popularProducts: {
    id:          'popularProducts',
    label:       'Popular Products',
    description: 'Top product categories by enquiry volume',
    icon:        '📦',
    status:      'coming-soon',
  },
  topDeals: {
    id:          'topDeals',
    label:       'Top Open Deals',
    description: 'Highest value deals still in pipeline',
    icon:        '💰',
    status:      'coming-soon',
  },
  revenueByMonth: {
    id:          'revenueByMonth',
    label:       'Revenue Trend',
    description: 'Monthly closed won value chart',
    icon:        '📈',
    status:      'coming-soon',
  },
  retainerSummary: {
    id:          'retainerSummary',
    label:       'Retainer Summary',
    description: 'Active retainers, renewals due, health status',
    icon:        '🔄',
    status:      'coming-soon',
  },
  paymentStatus: {
    id:          'paymentStatus',
    label:       'Payment Status',
    description: 'Invoice aging — overdue, pending, received',
    icon:        '💳',
    status:      'coming-soon',
  },
}

// Ordered list of section IDs for display in admin (available first, coming-soon at bottom)
export const CRM_PIPELINE_SECTION_ORDER = [
  'pipeline', 'liveColumn', 'salesReps', 'leadSources',
  'popularProducts', 'topDeals', 'revenueByMonth', 'retainerSummary', 'paymentStatus',
]

export const WIDGET_SECTIONS = {
  'crm-pipeline': { registry: CRM_PIPELINE_SECTIONS, order: CRM_PIPELINE_SECTION_ORDER },
}

// Default enabled sections for crm-pipeline (if client has no Supabase config yet)
export const DEFAULT_ENABLED_SECTIONS = ['pipeline', 'liveColumn', 'salesReps', 'leadSources']
