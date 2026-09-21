const defaultPathwayData = {
  playerId: 'demo-player',
  currentStage: 'Development Squad Bridge (Tier 1)',
  targetHorizon: '3-Year European First-Team Pathway',
  projectedCeiling: 'Top 5 European League Starter',
  trajectoryRating: 91,
  phases: [
    {
      id: 'phase-1',
      title: 'Academy & Senior Bridge (Months 0-12)',
      targetLeague: 'Danish Superliga / Eredivisie U23',
      status: 'In Progress',
      horizon: '2026 - 2027',
      primaryObjectives: [
        'Secure starting minutes in reserve/U23 league fixtures',
        'Earn minimum 15 first-team matchday squad selections',
        'Maintain >33.5 km/h peak velocity and 0.95+ ACWR resilience',
      ],
      kpiTargets: {
        minutesProjected: '850+ mins',
        goalContributions: '6 (Goals + Assists)',
        sprintSpeedTarget: '33.8 km/h',
        marketValuationTarget: '€185,000 - €250,000',
      },
    },
    {
      id: 'phase-2',
      title: 'Challenger League Starter (Months 12-24)',
      targetLeague: 'Danish Superliga / Belgian Pro League',
      status: 'Target',
      horizon: '2027 - 2028',
      primaryObjectives: [
        'Establish regular starting XI role (25+ appearances)',
        'Compete in UEFA European qualifying playoff rounds',
        'Rank in top 10% for wide progressive carries and key passes',
      ],
      kpiTargets: {
        minutesProjected: '2,200+ mins',
        goalContributions: '14 (Goals + Assists)',
        sprintSpeedTarget: '34.0 km/h',
        marketValuationTarget: '€600,000 - €1,200,000',
      },
    },
    {
      id: 'phase-3',
      title: 'European Elite Tier-1 Transfer (Months 24-36)',
      targetLeague: 'Bundesliga / Ligue 1 / Premier League',
      status: 'Target',
      horizon: '2028 - 2029',
      primaryObjectives: [
        'UEFA competition group stage regular starter',
        'Senior national team call-up contention',
        'High-value transfer transaction with verified sell-on clauses',
      ],
      kpiTargets: {
        minutesProjected: '2,500+ mins',
        goalContributions: '18+ (Goals + Assists)',
        sprintSpeedTarget: '34.2 km/h',
        marketValuationTarget: '€3,500,000+',
      },
    },
  ],
  milestones: [
    {
      id: 'ms-1',
      phaseId: 'phase-1',
      title: 'First-Team Training Roster Inclusion',
      targetDate: '2026-10-01',
      status: 'Completed',
      metric: 'Daily senior team training integration',
      notes: 'Completed during pre-season combine evaluation',
    },
    {
      id: 'ms-2',
      phaseId: 'phase-1',
      title: 'Senior Domestic Cup Debut',
      targetDate: '2026-11-15',
      status: 'In Progress',
      metric: 'Minimum 20 min substitution appearance',
      notes: 'Targeting national cup round 3 fixture',
    },
    {
      id: 'ms-3',
      phaseId: 'phase-1',
      title: 'Professional Multi-Year Contract Signing',
      targetDate: '2026-12-31',
      status: 'In Progress',
      metric: 'First-team bridge contract executed',
      notes: 'Under review through active club recruitment mandates',
    },
    {
      id: 'ms-4',
      phaseId: 'phase-2',
      title: 'Starting XI Regular Status (10+ League Starts)',
      targetDate: '2027-04-30',
      status: 'Target',
      metric: '10 starts in top-flight league competition',
      notes: 'Requires 85%+ tactical discipline score from coaching staff',
    },
    {
      id: 'ms-5',
      phaseId: 'phase-2',
      title: 'Double-Digit Goal Contributions Season',
      targetDate: '2027-11-30',
      status: 'Target',
      metric: '10+ combined goals and assists in all comps',
      notes: 'Focus on 1v1 wide isolation finishing and early delivery',
    },
    {
      id: 'ms-6',
      phaseId: 'phase-3',
      title: 'UEFA European Group Stage Debut',
      targetDate: '2028-09-30',
      status: 'Target',
      metric: 'Appearance in UEFA Conference/Europa League',
      notes: 'Club European qualification pathway alignment',
    },
  ],
  benchmarkedClubs: [
    {
      id: 'club-fcm',
      club: 'FC Midtjylland',
      country: 'Denmark',
      transitionIndex: 94,
      u21MinutesShare: '34%',
      trackRecord: 'Proven track record of transitioning U21 prospects into top-5 European sales (Premier League & Serie A).',
      fitFactor: 'Data-driven high sprint intensity profile',
    },
    {
      id: 'club-az',
      club: 'AZ Alkmaar',
      country: 'Netherlands',
      transitionIndex: 92,
      u21MinutesShare: '38%',
      trackRecord: 'Top Eredivisie developmental bridge with UEFA Youth League pedigree and technical winger advancement.',
      fitFactor: 'Technical 1v1 dribble efficiency alignment',
    },
    {
      id: 'club-scf',
      club: 'SC Freiburg',
      country: 'Germany',
      transitionIndex: 89,
      u21MinutesShare: '29%',
      trackRecord: 'Exceptional tactical discipline incubator in Bundesliga with clear progression between U23 and senior XI.',
      fitFactor: 'Counter-pressing trigger adaptability',
    },
    {
      id: 'club-krc',
      club: 'KRC Genk',
      country: 'Belgium',
      transitionIndex: 91,
      u21MinutesShare: '35%',
      trackRecord: 'World-renowned incubator for elite European attacking talent and progressive transition forwards.',
      fitFactor: 'Explosive acceleration and verticality',
    },
  ],
  simulatedScenarios: [
    {
      id: 'scen-1',
      name: 'Rapid Nordic Starter Pathway',
      pathwayType: 'Accelerated Domestic Bridge',
      projectedYearsToTop5: 2.5,
      projectedPeakValuationEur: 4200000,
      keyAdvantage: 'Immediate senior match exposure and high physical resilience testing.',
      keyRisk: 'Managing acute-to-chronic workload during winter congestion.',
      dateSimulated: '2026-09-16T10:00:00.000Z',
    },
  ],
};

function ensurePathwayRecord(data, playerId) {
  if (!data.pathways) {
    data.pathways = [];
  }

  let record = data.pathways.find((p) => p.playerId === playerId);
  if (!record) {
    record = JSON.parse(JSON.stringify(defaultPathwayData));
    record.playerId = playerId;
    data.pathways.push(record);
  }

  return record;
}

function calculatePathwayScore(record) {
  const completed = record.milestones.filter((m) => m.status === 'Completed').length;
  const inProgress = record.milestones.filter((m) => m.status === 'In Progress').length;
  const total = record.milestones.length || 1;

  const score = Math.round(((completed * 1.0 + inProgress * 0.5) / total) * 100);
  return Math.min(100, Math.max(65, score + 65));
}

function toggleMilestoneStatus(record, milestoneId, status, notes) {
  const milestone = record.milestones.find((m) => m.id === milestoneId);
  if (!milestone) return null;

  if (status) {
    milestone.status = status;
  } else {
    // Cycle: Target -> In Progress -> Completed -> Target
    if (milestone.status === 'Target') {
      milestone.status = 'In Progress';
    } else if (milestone.status === 'In Progress') {
      milestone.status = 'Completed';
    } else {
      milestone.status = 'Target';
    }
  }

  if (notes !== undefined) {
    milestone.notes = String(notes).trim();
  }

  record.trajectoryRating = calculatePathwayScore(record);
  return milestone;
}

function simulatePathwayScenario(record, { name, pathwayType, targetHorizonYears, customFocus }) {
  const horizon = Number(targetHorizonYears) || 3;
  let peakVal = 3500000;
  if (pathwayType?.includes('Accelerated') || pathwayType?.includes('Nordic')) {
    peakVal = 4200000;
  } else if (pathwayType?.includes('Elite') || pathwayType?.includes('Benelux')) {
    peakVal = 5500000;
  }

  const newScenario = {
    id: `scen-${Date.now()}`,
    name: (name || 'Custom Career Trajectory Simulation').trim(),
    pathwayType: (pathwayType || 'European Development Bridge').trim(),
    projectedYearsToTop5: horizon,
    projectedPeakValuationEur: peakVal,
    keyAdvantage: customFocus
      ? `Tailored development emphasis on: ${customFocus}`
      : 'Optimal balance of competitive senior minutes and physical longevity.',
    keyRisk: 'Adaptation speed to higher pressing intensity leagues.',
    dateSimulated: new Date().toISOString(),
  };

  if (!record.simulatedScenarios) {
    record.simulatedScenarios = [];
  }
  record.simulatedScenarios.unshift(newScenario);
  record.trajectoryRating = calculatePathwayScore(record);

  return newScenario;
}

module.exports = {
  defaultPathwayData,
  ensurePathwayRecord,
  calculatePathwayScore,
  toggleMilestoneStatus,
  simulatePathwayScenario,
};
