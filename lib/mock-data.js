// lib/mock-data.js — Realistic mock CRM data for admin preview
export const MOCK_CRM_DATA = {
  stats: {
    monthLeads: 31, quotesSent: 24, closedWon: 12, closedLost: 5,
    closeRate: 0.706, followUps: 8, overdueQuotes: 3,
    totalPipeline: 89, stillActive: 14,
    stageFunnel: [
      { stage: 'New Lead',           count: 7  },
      { stage: 'Quotation Sent',     count: 12 },
      { stage: 'Negotiation',        count: 5  },
      { stage: 'Sales Order Issued', count: 3  },
      { stage: 'Closed Won',         count: 12 },
      { stage: 'Closed Lost',        count: 5  },
    ],
    reps: [
      { name: 'Saiful',  leads: 14, closedWon: 7, closedLost: 2, closeRate: 0.778 },
      { name: 'Nik',     leads: 10, closedWon: 4, closedLost: 2, closeRate: 0.667 },
      { name: 'Amirul',  leads:  7, closedWon: 1, closedLost: 1, closeRate: 0.500 },
    ],
    sources: [
      { name: 'WhatsApp',  count: 14, won: 7, lost: 2, closeRate: 0.778 },
      { name: 'Instagram', count:  8, won: 3, lost: 2, closeRate: 0.600 },
      { name: 'Referral',  count:  5, won: 2, lost: 1, closeRate: 0.667 },
      { name: 'Walk-in',   count:  4, won: 0, lost: 0, closeRate: null  },
    ],
  },
  meta: { updatedAt: new Date().toISOString() },
}
