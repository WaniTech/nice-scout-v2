/**
 * Video Annotation & Tactical Telestration Clip Engine
 * Provides tactical markup, timestamped coaching tags, freeze-frame telestration,
 * and video share export packages for scouting evaluations.
 */

const defaultTelestrations = [
  {
    id: 'tel-1',
    clipId: 'clip-1',
    playerId: 'demo-player',
    title: '1v1 Acceleration & Near-Post Cutback',
    timestampSeconds: 14.5,
    timestampFormatted: '00:14.50',
    type: 'Telestration',
    drawingData: {
      tool: 'arrow',
      color: '#10B981',
      coordinates: [{ x: 34, y: 62 }, { x: 72, y: 45 }],
      label: 'Explosive Burst Space',
    },
    tacticalCategory: 'Attacking Transition',
    coachingNote: 'Excellent initial separation from fullback. Delivery targeted second 6-yard box space.',
    verifiedByScout: 'Mikkel Soren (FC Midtjylland)',
    shareableUrl: 'https://nicescout.app/clips/clip-1/annotate?t=14.5',
    createdAt: '2026-08-30T10:00:00.000Z',
  },
  {
    id: 'tel-2',
    clipId: 'clip-2',
    playerId: 'demo-player',
    title: 'Counter-Press Turnover Trigger',
    timestampSeconds: 42.0,
    timestampFormatted: '00:42.00',
    type: 'FreezeFrame',
    drawingData: {
      tool: 'zone_circle',
      color: '#F59E0B',
      coordinates: [{ x: 55, y: 38, radius: 18 }],
      label: 'Cover Shadow / Passing Lane Interception',
    },
    tacticalCategory: 'Defensive Pressing',
    coachingNote: 'High tactical awareness to curve run and block central midfielder outlet passing lane.',
    verifiedByScout: 'Noah Janssen (AZ Alkmaar)',
    shareableUrl: 'https://nicescout.app/clips/clip-2/annotate?t=42.0',
    createdAt: '2026-08-31T14:30:00.000Z',
  },
];

const tacticalTagTaxonomy = [
  '1v1 Isolation',
  'Attacking Transition',
  'Defensive Pressing',
  'Cutback Delivery',
  'Overlapping Run',
  'Underpressure Reception',
  'Weak-Side Run',
  'Recovery Sprint',
];

function ensureTelestrationsRecord(data, playerId = 'demo-player') {
  if (!data.telestrations) {
    data.telestrations = defaultTelestrations.map((t) => ({
      ...t,
      playerId,
    }));
  }
  return data.telestrations;
}

function calculateTelestrationSummary(annotations = []) {
  const totalAnnotations = annotations.length;
  const verifiedCount = annotations.filter((a) => Boolean(a.verifiedByScout)).length;
  const categories = Array.from(new Set(annotations.map((a) => a.tacticalCategory)));
  
  return {
    totalAnnotations,
    verifiedCount,
    categoryCount: categories.length,
    categories,
    scoutReadinessIndex: Math.min(Math.round((verifiedCount * 35) + (totalAnnotations * 15)), 99),
  };
}

module.exports = {
  defaultTelestrations,
  tacticalTagTaxonomy,
  ensureTelestrationsRecord,
  calculateTelestrationSummary,
};
