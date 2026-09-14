const defaultDossierData = {
  playerId: 'demo-player',
  dossierId: 'DOS-2026-ALX99',
  title: 'Elite Prospect Intelligence Dossier',
  version: '2026.3',
  generatedAt: '2026-09-14T10:00:00.000Z',
  confidentiality: 'Confidential • Scout Accredited Only',
  status: 'Ready For Export',
  scoutSummary: {
    executiveHeadline: 'Dynamically explosive winger with verified top-decile sprint velocity and European work rights.',
    projectedCeiling: 'Tier 1 / Top 5 European Development Squad Candidate',
    readinessRating: 94,
    recommendedPathway: 'Direct First-Team Bridge / Pre-Season Trial Invitee',
  },
  sections: {
    tacticalPillars: {
      overall: 89,
      physical: 92,
      technical: 87,
      tactical: 85,
      mental: 91,
      strengths: ['1v1 Wide Isolation', 'Accelerative Burst', 'High-Press Transition', 'Crossing Delivery'],
      developmentFocus: ['Weak Foot Finishing', 'Defensive Compactness In Deep Block'],
    },
    medicalClearance: {
      status: 'Full Medical Clearance — Grade A',
      cardiacEcg: 'Normal Sinus Rhythm (Verified FIFA Standard)',
      concussionBaseline: 'SCAT5 Baseline Cleared (Score: 28/30)',
      activeRestrictions: 'None',
      riskIndex: 'Low (0.92 ACWR)',
    },
    athleticGps: {
      peakSprintSpeed: '33.8 km/h',
      highSpeedRunningPerMatch: '980m (>25 km/h)',
      repeatSprintAbility: '14 sprints / 90 min',
      acwrRatio: 1.08,
      fitnessTier: 'Elite Professional Readiness',
    },
    transferAndValuation: {
      estimatedValueEur: 185000,
      valueRange: '€150,000 - €230,000',
      contractStatus: 'Free Agent',
      euPassport: true,
      fifaTalentId: 'FIFA-DK-8921-X',
    },
  },
  exportsHistory: [
    {
      id: 'exp-1',
      format: 'PDF',
      targetClub: 'AZ Alkmaar',
      scoutRecipient: 'Lars van der Beek',
      exportedAt: '2026-09-14T09:40:00.000Z',
      dossierVersion: '2026.3',
      downloadUrl: '/api/dossier/demo-player/export/exp-1.pdf',
      status: 'Delivered',
    },
    {
      id: 'exp-2',
      format: 'JSON',
      targetClub: 'FC Midtjylland',
      scoutRecipient: 'Soren Poulsen',
      exportedAt: '2026-09-13T16:15:00.000Z',
      dossierVersion: '2026.2',
      downloadUrl: '/api/dossier/demo-player/export/exp-2.json',
      status: 'Archived',
    },
  ],
  exportTemplates: [
    {
      id: 'template-executive',
      name: 'Executive Scout Summary (1-Pager)',
      description: 'Streamlined briefing highlighting key metrics, valuation, and immediate contact details.',
      pageCount: 1,
      recommendedFor: 'Sporting Directors & Heads of Recruitment',
    },
    {
      id: 'template-comprehensive',
      name: 'Complete Technical & Medical Dossier',
      description: 'Comprehensive 8-pillar report including GPS biometrics, ECG certifications, video timestamps, and tactical radar.',
      pageCount: 6,
      recommendedFor: 'Lead Scouts, Performance Coaches, & Medical Staff',
    },
    {
      id: 'template-transfer',
      name: 'Transfer & Mandate Pitch Deck',
      description: 'Focused deck with valuation justification, contract terms flexibility, and tactical role alignment.',
      pageCount: 3,
      recommendedFor: 'Agents, Intermediaries, & Club Transfer Committees',
    },
  ],
};

function ensureDossierRecord(data, playerId) {
  if (!data.dossiers) {
    data.dossiers = [];
  }

  let record = data.dossiers.find((d) => d.playerId === playerId);
  if (!record) {
    record = JSON.parse(JSON.stringify(defaultDossierData));
    record.playerId = playerId;
    record.dossierId = `DOS-${new Date().getFullYear()}-${playerId.toUpperCase().slice(0, 6)}`;
    data.dossiers.push(record);
  }

  return record;
}

function compileDossier(data, playerId) {
  const dossier = ensureDossierRecord(data, playerId);
  
  // Enrich with live data from other modules if present
  const transfer = data.transfers?.find((t) => t.playerId === playerId);
  if (transfer?.valuation) {
    dossier.sections.transferAndValuation.estimatedValueEur = transfer.valuation.estimatedValueEur;
    dossier.sections.transferAndValuation.valueRange = `€${transfer.valuation.valueRangeMinEur.toLocaleString()} - €${transfer.valuation.valueRangeMaxEur.toLocaleString()}`;
    dossier.sections.transferAndValuation.contractStatus = transfer.transferStatus || 'Free Agent';
  }

  const medical = data.medicals?.find((m) => m.playerId === playerId);
  if (medical) {
    dossier.sections.medicalClearance.status = medical.clearanceStatus || dossier.sections.medicalClearance.status;
  }

  const gps = data.gpsReports?.find((g) => g.playerId === playerId);
  if (gps?.peakSprintSpeedKmh) {
    dossier.sections.athleticGps.peakSprintSpeed = `${gps.peakSprintSpeedKmh} km/h`;
  }

  const passport = data.passports?.find((p) => p.playerId === playerId);
  if (passport?.metrics?.fifaId) {
    dossier.sections.transferAndValuation.fifaTalentId = passport.metrics.fifaId;
  }

  return dossier;
}

function generateDossierExport(dossier, { format = 'PDF', targetClub = 'General Scout Desk', scoutRecipient = 'Accredited Scout', templateId = 'template-executive' } = {}) {
  const exportId = `exp-${Date.now()}`;
  const ext = format.toLowerCase() === 'json' ? 'json' : 'pdf';
  const newExport = {
    id: exportId,
    format: format.toUpperCase(),
    templateId,
    targetClub: targetClub.trim(),
    scoutRecipient: scoutRecipient.trim(),
    exportedAt: new Date().toISOString(),
    dossierVersion: dossier.version || '2026.3',
    downloadUrl: `/api/dossier/${dossier.playerId}/export/${exportId}.${ext}`,
    status: 'Delivered',
  };

  if (!dossier.exportsHistory) {
    dossier.exportsHistory = [];
  }
  dossier.exportsHistory.unshift(newExport);

  return newExport;
}

module.exports = {
  defaultDossierData,
  ensureDossierRecord,
  compileDossier,
  generateDossierExport,
};
