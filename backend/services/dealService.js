/**
 * Contract Offer Terms & Negotiation Deal Room Engine
 * Computes financial breakdowns, net wage estimations, bonus incentives,
 * and handles the contract negotiation state machine for NiceScout.
 */

const defaultContractTemplates = [
  {
    id: 'deal-1',
    playerId: 'demo-player',
    opportunityId: '1',
    club: 'FC Midtjylland',
    league: 'Danish Superliga Academy Bridge',
    contractType: 'First Team Pathway / Development Pro',
    durationYears: 2,
    baseSalaryMonthly: 4200,
    currency: 'EUR',
    signingBonus: 8000,
    appearanceBonus: 400,
    goalAssistBonus: 300,
    housingStipendMonthly: 850,
    releaseClause: 350000,
    status: 'Offered',
    scoutContact: 'Mikkel Soren (Nordic Recruitment)',
    negotiationHistory: [
      {
        id: 'hist-1',
        sender: 'club',
        author: 'Mikkel Soren',
        action: 'Initial Offer Submitted',
        baseSalaryMonthly: 4200,
        notes: '2-year development contract with senior cup call-up incentives.',
        timestamp: '2026-08-28T14:00:00.000Z',
      },
    ],
    createdAt: '2026-08-28T14:00:00.000Z',
    updatedAt: '2026-08-29T10:30:00.000Z',
  },
  {
    id: 'deal-2',
    playerId: 'demo-player',
    opportunityId: '2',
    club: 'AZ Alkmaar',
    league: 'Eredivisie U23 Pathway',
    contractType: 'U23 Professional Review Contract',
    durationYears: 1.5,
    baseSalaryMonthly: 3800,
    currency: 'EUR',
    signingBonus: 5000,
    appearanceBonus: 350,
    goalAssistBonus: 250,
    housingStipendMonthly: 700,
    releaseClause: 250000,
    status: 'UnderReview',
    scoutContact: 'Noah Janssen (Talent ID)',
    negotiationHistory: [
      {
        id: 'hist-2',
        sender: 'club',
        author: 'Noah Janssen',
        action: 'Draft Term Sheet',
        baseSalaryMonthly: 3800,
        notes: 'Includes full academy accommodation and sports nutrition support.',
        timestamp: '2026-08-27T11:00:00.000Z',
      },
    ],
    createdAt: '2026-08-27T11:00:00.000Z',
    updatedAt: '2026-08-28T09:00:00.000Z',
  },
];

function ensureDealsRecord(data, playerId = 'demo-player') {
  if (!data.deals) {
    data.deals = defaultContractTemplates.map((d) => ({
      ...d,
      playerId,
      negotiationHistory: d.negotiationHistory.map((h) => ({ ...h })),
    }));
  }
  return data.deals;
}

function calculateDealValue(deal) {
  const months = (deal.durationYears || 1) * 12;
  const totalBase = (deal.baseSalaryMonthly || 0) * months;
  const totalHousing = (deal.housingStipendMonthly || 0) * months;
  const estimatedBonuses = ((deal.appearanceBonus || 0) * 20) + ((deal.goalAssistBonus || 0) * 10);
  const guaranteedTotal = totalBase + (deal.signingBonus || 0) + totalHousing;
  const projectedTotal = guaranteedTotal + estimatedBonuses;

  return {
    months,
    guaranteedTotal,
    projectedTotal,
    monthlyNetEstimate: Math.round((deal.baseSalaryMonthly || 0) * 0.68), // ~32% estimated tax baseline
    dealScore: Math.min(Math.round((projectedTotal / 120000) * 88) + 10, 99),
  };
}

module.exports = {
  defaultContractTemplates,
  ensureDealsRecord,
  calculateDealValue,
};
