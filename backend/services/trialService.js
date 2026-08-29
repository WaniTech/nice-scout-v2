/**
 * Trial Scheduling & Logistics Engine
 * Manages trial booking slots, scout RSVP state machines, travel preparation checklists,
 * and real-time socket events for the NiceScout platform.
 */

const defaultChecklistTemplates = [
  { id: 'chk-1', title: 'GPS Sprint Report (Last 30 Days)', category: 'performance', completed: true, required: true },
  { id: 'chk-2', title: 'Valid Passport / EU Travel Permit', category: 'travel', completed: true, required: true },
  { id: 'chk-3', title: 'Sports Medical & Injury Clearance', category: 'medical', completed: false, required: true },
  { id: 'chk-4', title: 'Two Pairs of Firm-Ground / Turf Boots', category: 'equipment', completed: true, required: false },
  { id: 'chk-5', title: 'Emergency Contact & Club Accommodation Form', category: 'logistics', completed: false, required: false },
];

const availableTimeSlots = [
  'Morning Session (09:30 - 12:00 CET)',
  'Afternoon Match Assessment (14:30 - 17:00 CET)',
  'Full-Day Academy Trial (09:00 - 17:30 CET)',
];

function ensureTrialsRecord(data) {
  if (!data.trials) {
    data.trials = [
      {
        id: 'trial-1',
        playerId: 'demo-player',
        opportunityId: '1',
        club: 'FC Midtjylland',
        trialDate: 'June 24, 2026',
        timeSlot: 'Morning Session (09:30 - 12:00 CET)',
        location: 'Ikast Træningscenter, Herning, Denmark',
        status: 'Confirmed',
        scoutContact: 'Mikkel Soren',
        notes: 'First-team bridge trial. Pitch 3, bring white training kit.',
        checklist: defaultChecklistTemplates.map((item) => ({ ...item })),
        createdAt: '2026-06-10T10:00:00.000Z',
        updatedAt: '2026-06-12T14:30:00.000Z',
      },
    ];
  }
}

function calculateChecklistProgress(checklist = []) {
  if (!checklist.length) return { total: 0, completed: 0, percent: 0, requiredComplete: true };
  const total = checklist.length;
  const completed = checklist.filter((c) => c.completed).length;
  const percent = Math.round((completed / total) * 100);
  const requiredComplete = checklist.filter((c) => c.required).every((c) => c.completed);

  return { total, completed, percent, requiredComplete };
}

module.exports = {
  defaultChecklistTemplates,
  availableTimeSlots,
  ensureTrialsRecord,
  calculateChecklistProgress,
};
