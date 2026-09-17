const defaultInterviewPrepData = {
  playerId: 'demo-player',
  overallReadinessScore: 88,
  targetClubs: [
    {
      id: 'target-1',
      club: 'FC Midtjylland',
      country: 'Denmark',
      interviewType: 'Tactical & Sporting Director Briefing',
      scheduledDate: '2026-09-22T14:00:00.000Z',
      status: 'Scheduled',
      interviewer: 'Mikkel Soren (Head of Nordic Recruitment)',
      focusAreas: ['High-Press Trigger Response', 'Cultural Adaptation & Danish League Tempo', 'Development Plan'],
    },
    {
      id: 'target-2',
      club: 'AZ Alkmaar',
      country: 'Netherlands',
      interviewType: 'Technical Philosophy & Video Review',
      scheduledDate: '2026-09-28T11:00:00.000Z',
      status: 'Upcoming',
      interviewer: 'Noah Janssen (Talent ID Lead)',
      focusAreas: ['Positional Versatility (Winger vs Inside Forward)', 'Tactical Decision Making under Compact Blocks'],
    },
  ],
  modules: [
    {
      id: 'mod-tactical',
      category: 'Tactical Articulation',
      title: 'Explaining Role & System Fit',
      completionPercentage: 90,
      description: 'Techniques for clearly explaining your strengths, spatial awareness, and transition reactions to scouting directors.',
      keyTakeaways: [
        'Frame weaknesses as active development targets with measurable drills.',
        'Use specific match scenarios when discussing decision-making.',
        'Highlight pressing triggers and defensive recovery discipline.',
      ],
    },
    {
      id: 'mod-culture',
      category: 'Club Culture & Values',
      title: 'Academy Integration & Mentality',
      completionPercentage: 85,
      description: 'Understanding professional club standards, coachability, and resilience during trial periods.',
      keyTakeaways: [
        'Demonstrate understanding of the club\'s tactical heritage.',
        'Communicate openness to squad rotation and developmental milestones.',
        'Emphasize professional recovery and athletic nutrition routines.',
      ],
    },
    {
      id: 'mod-media',
      category: 'Media & Presentation',
      title: 'Personal Pitch & Career Trajectory',
      completionPercentage: 90,
      description: 'Delivering a concise 90-second player introduction combining biometrics, passport status, and ambition.',
      keyTakeaways: [
        'State verified sprint speeds (33.8 km/h) and ACWR injury resilience.',
        'Mention EU passport and clear work rights up front.',
        'Conclude with eagerness to compete for first-team pathway.',
      ],
    },
  ],
  questionsBank: [
    {
      id: 'q-1',
      question: 'How do you react when an opposing fullback is instructed to double-mark you or play aggressive contact?',
      category: 'Tactical Adaptation',
      suggestedTalkingPoints: [
        'Drop into the half-space to receive between lines',
        'Use quick one-touch combination play with the central midfielder',
        'Pin the defender to create underlapping runs for our fullback',
      ],
      userNotes: 'Emphasize combination play and dragging defenders to open space for midfielders.',
      practiced: true,
    },
    {
      id: 'q-2',
      question: 'What is your reaction if the manager shifts you to the opposite wing or inside forward mid-match?',
      category: 'Positional Flexibility',
      suggestedTalkingPoints: [
        'Versatility to cut inside on dominant foot or cross early',
        'Adaptation to central shooting lanes and late penalty-box arrivals',
        'Tactical discipline to execute specific pressing assignments',
      ],
      userNotes: 'Highlight 1v1 dribble efficiency from both touchlines and diagonal cutting runs.',
      practiced: true,
    },
    {
      id: 'q-3',
      question: 'Can you describe your off-the-ball recovery duties following an offensive turnover in the final third?',
      category: 'Counter-Pressing',
      suggestedTalkingPoints: [
        'Immediate 5-second counter-pressing burst to disrupt transition',
        'Curving the pressing run to block passing lanes into central pivots',
        'Dropping into mid-block structure if initial counter-press is broken',
      ],
      userNotes: '',
      practiced: false,
    },
    {
      id: 'q-4',
      question: 'How do you handle moving abroad and integrating into a foreign dressing room and culture?',
      category: 'Mental & Lifestyle',
      suggestedTalkingPoints: [
        'Prior commitment to language learning and active social bonding',
        'Focus on structured nutrition, sleep, and athletic routine',
        'Family/agency support network maintaining mental clarity',
      ],
      userNotes: 'Mention EU passport and international showcase combine experiences.',
      practiced: false,
    },
  ],
  simulationSessions: [
    {
      id: 'sim-1',
      club: 'FC Midtjylland',
      date: '2026-09-15T09:30:00.000Z',
      score: 92,
      feedback: 'Excellent tactical clarity on transition duties. Concise delivery on GPS biometrics and readiness.',
    },
  ],
};

function ensureInterviewPrepRecord(data, playerId) {
  if (!data.interviewPreps) {
    data.interviewPreps = [];
  }

  let record = data.interviewPreps.find((r) => r.playerId === playerId);
  if (!record) {
    record = JSON.parse(JSON.stringify(defaultInterviewPrepData));
    record.playerId = playerId;
    data.interviewPreps.push(record);
  }

  return record;
}

function calculatePrepReadiness(record) {
  const practicedCount = record.questionsBank.filter((q) => q.practiced).length;
  const totalQuestions = record.questionsBank.length || 1;
  const questionScore = (practicedCount / totalQuestions) * 100;

  const moduleAvg = record.modules.reduce((acc, m) => acc + (m.completionPercentage || 0), 0) / (record.modules.length || 1);

  return Math.round(questionScore * 0.4 + moduleAvg * 0.6);
}

function toggleQuestionPracticed(record, questionId, notes) {
  const question = record.questionsBank.find((q) => q.id === questionId);
  if (!question) return null;

  question.practiced = !question.practiced;
  if (notes !== undefined) {
    question.userNotes = String(notes).trim();
  }

  record.overallReadinessScore = calculatePrepReadiness(record);
  return question;
}

function logSimulatedInterview(record, { club, score, feedback }) {
  const newSession = {
    id: `sim-${Date.now()}`,
    club: (club || 'European Scout Desk').trim(),
    date: new Date().toISOString(),
    score: Number(score) || 85,
    feedback: (feedback || 'Strong tactical communication and clear career ambition.').trim(),
  };

  if (!record.simulationSessions) {
    record.simulationSessions = [];
  }
  record.simulationSessions.unshift(newSession);
  record.overallReadinessScore = calculatePrepReadiness(record);

  return newSession;
}

module.exports = {
  defaultInterviewPrepData,
  ensureInterviewPrepRecord,
  calculatePrepReadiness,
  toggleQuestionPracticed,
  logSimulatedInterview,
};
