const defaultMedicalRecord = {
  playerId: 'demo-player',
  clearanceStatus: 'Full Match Clearance',
  cardiacScreeningDate: '2026-06-10',
  cardiacScreeningStatus: 'Cleared (FIFA Level 1)',
  bloodPanelStatus: 'Normal (Optimal Ferritin & Vitamin D)',
  concussionBaselineDate: '2026-05-18',
  orthopedicSummary: 'No structural knee or ankle instability. Symmetrical hamstring strength.',
  injuries: [
    {
      id: 'inj-1',
      playerId: 'demo-player',
      type: 'Hamstring Strain (Grade 1)',
      bodyPart: 'Left Bicep Femoris',
      dateOccurred: '2025-11-12',
      returnToPlayDate: '2025-12-05',
      recoveryWeeks: 3,
      recurrenceRisk: 'Low',
      treatingPhysio: 'Dr. Emil Lind, Nordic Sports Clinic',
      status: 'Fully Resolved',
      notes: 'Completed eccentric Nordic curl progression. Strength test 100% symmetrical.',
    },
    {
      id: 'inj-2',
      playerId: 'demo-player',
      type: 'Ankle Inversion Sprain (Grade 1)',
      bodyPart: 'Right Lateral Ankle',
      dateOccurred: '2025-04-02',
      returnToPlayDate: '2025-04-18',
      recoveryWeeks: 2,
      recurrenceRisk: 'Low',
      treatingPhysio: 'Dr. Emil Lind, Nordic Sports Clinic',
      status: 'Fully Resolved',
      notes: 'Full proprioception and hop testing passed prior to squad return.',
    },
  ],
  rehabProtocols: [
    {
      id: 'prot-1',
      title: 'Hamstring Eccentric Durability',
      focus: 'Injury Prevention & Sprint Deceleration',
      frequency: '3x / week',
      completedRounds: 18,
      status: 'Active Maintenance',
    },
    {
      id: 'prot-2',
      title: 'Ankle Proprioception & Kinetic Chain',
      focus: 'Multi-directional Stability & Cutting',
      frequency: '2x / week',
      completedRounds: 12,
      status: 'Active Maintenance',
    },
  ],
};

function calculateMedicalReadiness(record = defaultMedicalRecord) {
  const injuries = record.injuries || [];
  const activeInjuries = injuries.filter(
    (i) => i.status && !i.status.toLowerCase().includes('resolved')
  );

  const totalInjuries = injuries.length;
  const isCleared = record.clearanceStatus === 'Full Match Clearance';
  const hasCardiac = Boolean(record.cardiacScreeningDate);
  const hasConcussion = Boolean(record.concussionBaselineDate);

  let readinessScore = 100;
  if (!isCleared) readinessScore -= 30;
  if (activeInjuries.length > 0) readinessScore -= activeInjuries.length * 25;
  if (!hasCardiac) readinessScore -= 10;
  if (!hasConcussion) readinessScore -= 10;

  readinessScore = Math.max(20, Math.min(100, readinessScore));

  return {
    clearanceStatus: record.clearanceStatus || 'Pending Review',
    readinessScore,
    totalInjuries,
    activeInjuriesCount: activeInjuries.length,
    cardiacVerified: hasCardiac,
    concussionBaselineVerified: hasConcussion,
    safetyTier: readinessScore >= 90 ? 'Elite Medical Grade' : readinessScore >= 70 ? 'Standard Clearance' : 'Restricted',
  };
}

function ensureMedicalRecord(data, playerId) {
  if (!data.medicalRecords) {
    data.medicalRecords = [];
  }

  const existing = data.medicalRecords.find((r) => r.playerId === playerId);
  if (!existing && playerId === 'demo-player') {
    data.medicalRecords.push(JSON.parse(JSON.stringify(defaultMedicalRecord)));
  } else if (!existing) {
    data.medicalRecords.push({
      playerId,
      clearanceStatus: 'Pending Review',
      cardiacScreeningDate: '',
      cardiacScreeningStatus: 'Pending Submission',
      bloodPanelStatus: 'Pending',
      concussionBaselineDate: '',
      orthopedicSummary: 'No medical assessment recorded yet.',
      injuries: [],
      rehabProtocols: [],
    });
  }
}

module.exports = {
  defaultMedicalRecord,
  calculateMedicalReadiness,
  ensureMedicalRecord,
};
