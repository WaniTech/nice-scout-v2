const defaultTransferData = {
  playerId: 'demo-player',
  transferStatus: 'Free Agent',
  contractExpiry: '2026-12-31',
  releaseClauseEur: null,
  valuation: {
    estimatedValueEur: 185000,
    valueRangeMinEur: 150000,
    valueRangeMaxEur: 230000,
    marketTier: 'High Potential U21 Prospect',
    demandIndex: 88,
    valuationFactors: [
      {
        name: 'Athletic GPS & High-Speed Running',
        score: 92,
        impact: 'High',
        description: 'Top 5% sprint velocity (33.8 km/h) and aerobic capacity.',
      },
      {
        name: 'Technical Precision & Cross Delivery',
        score: 87,
        impact: 'High',
        description: 'Elite 1v1 dribble success (71%) and accurate delivery into the box.',
      },
      {
        name: 'Passport & Work Rights Verification',
        score: 95,
        impact: 'High',
        description: 'EU passport verified; no work permit restrictions in UEFA leagues.',
      },
      {
        name: 'Age Curve & Development Ceiling',
        score: 89,
        impact: 'Medium',
        description: 'Age 20 profile with 4+ years of prime developmental projection.',
      },
      {
        name: 'Contract Availability & Wage Flexibility',
        score: 90,
        impact: 'Medium',
        description: 'Immediate availability with zero transfer fee barrier.',
      },
    ],
    historicalGrowth: [
      { date: '2025-06', valueEur: 75000, milestone: 'Regional Academy Starter' },
      { date: '2025-11', valueEur: 110000, milestone: 'Superliga U19 Showcase Standout' },
      { date: '2026-03', valueEur: 145000, milestone: 'GPS Peak Speed Record & 5 Scout Inquiries' },
      { date: '2026-09', valueEur: 185000, milestone: 'Medical Clearance & Nordic Combine Invite' },
    ],
  },
  mandates: [
    {
      id: 'mandate-101',
      club: 'AZ Alkmaar',
      league: 'Eredivisie',
      country: 'Netherlands',
      scoutName: 'Lars van der Beek',
      scoutRole: 'Lead Nordic & Benelux ID',
      targetPosition: 'Winger / Attacking Midfield',
      preferredAgeRange: '18 - 22',
      budgetBracket: '€150k - €250k / Free Agent',
      tacticalProfile: 'Direct 1v1 threat, pressing intensity, quick transitional play.',
      passportRequirement: 'EU Passport Required',
      status: 'Open',
      deadline: '2026-09-30',
      fitScore: 94,
      matchFactors: ['Position Match', 'EU Passport Verified', 'High-Speed Sprint Tier', 'Age Range Fit'],
      verifiedMandate: true,
    },
    {
      id: 'mandate-102',
      club: 'FC Midtjylland',
      league: 'Danish Superliga',
      country: 'Denmark',
      scoutName: 'Soren Poulsen',
      scoutRole: 'Head of Youth Recruitment',
      targetPosition: 'Right Winger / Inside Forward',
      preferredAgeRange: '19 - 23',
      budgetBracket: 'Development Squad Wage + Performance Bonuses',
      tacticalProfile: 'Data-driven high sprint volume, set-piece delivery, vertical passing.',
      passportRequirement: 'Nordic / EU Clearance',
      status: 'Open',
      deadline: '2026-10-15',
      fitScore: 91,
      matchFactors: ['Tactical Alignment', 'GPS Load Readiness', 'Scout Evaluation Rating > 8.0'],
      verifiedMandate: true,
    },
    {
      id: 'mandate-103',
      club: 'Vitoria SC',
      league: 'Liga Portugal',
      country: 'Portugal',
      scoutName: 'Tiago Mendes',
      scoutRole: 'International Scouting Coordinator',
      targetPosition: 'Attacking Midfield / Right Winger',
      preferredAgeRange: '18 - 24',
      budgetBracket: '€100k - €180k',
      tacticalProfile: 'Technical dribbling in tight spaces, progressive ball carries, key passes.',
      passportRequirement: 'Worldwide with Work Permit bridge',
      status: 'Open',
      deadline: '2026-10-30',
      fitScore: 86,
      matchFactors: ['Technical Score 87', 'Combine Tournament RSVP', 'Versatility Index'],
      verifiedMandate: true,
    },
    {
      id: 'mandate-104',
      club: 'KRC Genk',
      league: 'Belgian Pro League',
      country: 'Belgium',
      scoutName: 'Filip De Smet',
      scoutRole: 'Youth Academy Scouting Director',
      targetPosition: 'Left / Right Winger',
      preferredAgeRange: '17 - 21',
      budgetBracket: 'U23 Contract with First Team Pathway',
      tacticalProfile: 'Explosive acceleration, weak-foot competency, counter-pressing.',
      passportRequirement: 'EU Passport',
      status: 'Reviewing',
      deadline: '2026-09-25',
      fitScore: 88,
      matchFactors: ['Sprint Profile', 'Age Ceiling', 'EU Passport'],
      verifiedMandate: false,
    },
  ],
  pitches: [
    {
      id: 'pitch-1',
      mandateId: 'mandate-101',
      playerId: 'demo-player',
      club: 'AZ Alkmaar',
      pitchDate: '2026-09-08T14:30:00.000Z',
      status: 'Shortlisted',
      message: 'Official dossier submitted with verified GPS sprint data (33.8 km/h) and showcase invitation.',
      attachedClipCount: 3,
    },
  ],
};

function calculateMarketValuation(factors = {}) {
  const {
    age = 20,
    sprintSpeed = 33.8,
    matchRating = 8.4,
    milestonesCount = 4,
    hasEuPassport = true,
    scoutInquiriesCount = 8,
  } = factors;

  let baseValuation = 100000;

  // Age factor: younger under 22 gets youth multiplier
  if (age <= 20) {
    baseValuation += 45000;
  } else if (age <= 22) {
    baseValuation += 25000;
  } else if (age > 26) {
    baseValuation -= 15000;
  }

  // Physical/Sprint factor
  if (sprintSpeed >= 33.0) {
    baseValuation += 30000;
  } else if (sprintSpeed >= 31.0) {
    baseValuation += 15000;
  }

  // Match Rating factor
  if (matchRating >= 8.0) {
    baseValuation += 20000;
  }

  // Scout interest factor
  baseValuation += Math.min(30000, scoutInquiriesCount * 2500);

  // Passport factor
  if (hasEuPassport) {
    baseValuation += 15000;
  }

  // Milestones bonus
  baseValuation += milestonesCount * 5000;

  const estimatedValueEur = Math.round(baseValuation / 5000) * 5000;
  const valueRangeMinEur = Math.round((estimatedValueEur * 0.82) / 5000) * 5000;
  const valueRangeMaxEur = Math.round((estimatedValueEur * 1.25) / 5000) * 5000;

  let marketTier = 'Regional Talent';
  if (estimatedValueEur >= 200000) {
    marketTier = 'Top Tier European U21 Target';
  } else if (estimatedValueEur >= 150000) {
    marketTier = 'High Potential U21 Prospect';
  } else if (estimatedValueEur >= 100000) {
    marketTier = 'Development League Prospect';
  }

  const demandIndex = Math.min(99, Math.round(60 + (scoutInquiriesCount * 3) + (matchRating >= 8.0 ? 12 : 5)));

  return {
    estimatedValueEur,
    valueRangeMinEur,
    valueRangeMaxEur,
    marketTier,
    demandIndex,
  };
}

function ensureTransferRecord(data, playerId) {
  if (!data.transfers) {
    data.transfers = [];
  }

  let record = data.transfers.find((t) => t.playerId === playerId);
  if (!record && playerId === 'demo-player') {
    record = JSON.parse(JSON.stringify(defaultTransferData));
    data.transfers.push(record);
  }
  return record;
}

module.exports = {
  defaultTransferData,
  calculateMarketValuation,
  ensureTransferRecord,
};
