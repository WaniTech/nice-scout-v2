/**
 * Player Career Passport & Verified Scout CV Engine
 * Computes digital scouting passport status, verifies athletic metrics,
 * tracks career timeline milestones, and generates shareable scout credentials.
 */

const defaultCareerMilestones = [
  {
    id: 'milestone-1',
    club: 'FC Midtjylland Academy',
    role: 'U19 Starting Winger',
    period: '2023 - 2025',
    appearances: 38,
    goals: 14,
    assists: 11,
    verified: true,
    category: 'Academy',
  },
  {
    id: 'milestone-2',
    club: 'HB Koge Reserve',
    role: 'Senior Cup Trialist',
    period: '2025 - 2026',
    appearances: 12,
    goals: 5,
    assists: 4,
    verified: true,
    category: 'Senior Reserve',
  },
  {
    id: 'milestone-3',
    club: 'Denmark U20 National Pool',
    role: 'Invited Training Camp',
    period: 'Spring 2026',
    appearances: 3,
    goals: 1,
    assists: 2,
    verified: true,
    category: 'International',
  },
];

const passportMetricsTemplate = {
  fifaId: 'FIFA-DK-2026-88912',
  passportStatus: 'Verified Pro Prospect',
  verificationTier: 'Tier 1 Talent ID',
  nationality: 'Danish (EU Citizen)',
  secondNationality: 'None',
  workPermitStatus: 'Full EU Working Rights (No Visa Required)',
  preferredFoot: 'Right (Left 4/5)',
  heightWeight: '178 cm / 72 kg',
  agencyRepresentation: 'Nordic Sports Talent Management',
  medicalClearance: 'FIFA Grade A (Clean 2026)',
  scoutEndorsements: 6,
};

function ensurePassportRecord(data, playerId = 'demo-player') {
  if (!data.passports) {
    data.passports = [];
  }

  let passport = data.passports.find((p) => p.playerId === playerId);
  if (!passport) {
    passport = {
      playerId,
      metrics: { ...passportMetricsTemplate },
      milestones: defaultCareerMilestones.map((m) => ({ ...m })),
      verificationScore: 94,
      shareableUrl: `https://nicescout.app/passport/${playerId}`,
      updatedAt: new Date().toISOString(),
    };
    data.passports.push(passport);
  }
  return passport;
}

function calculatePassportScore(passport) {
  let score = 70;
  if (passport.milestones && passport.milestones.length > 0) {
    score += Math.min(passport.milestones.length * 6, 18);
  }
  if (passport.metrics && passport.metrics.workPermitStatus.includes('Full EU')) {
    score += 6;
  }
  return Math.min(score, 99);
}

module.exports = {
  defaultCareerMilestones,
  passportMetricsTemplate,
  ensurePassportRecord,
  calculatePassportScore,
};
