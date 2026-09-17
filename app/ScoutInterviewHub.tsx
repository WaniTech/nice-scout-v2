import {
    defaultInterviewPrepReport,
    InterviewPrepReport,
    InterviewQuestion
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    getInterviewPrepReport,
    logInterviewSimulation,
    updateInterviewQuestionPractice,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ScoutInterviewHubScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState<InterviewPrepReport>(defaultInterviewPrepReport);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [simClub, setSimClub] = useState<string>('');
  const [simScore, setSimScore] = useState<string>('90');
  const [simFeedback, setSimFeedback] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getInterviewPrepReport(playerId)
      .then((data) => {
        if (active && data?.questionsBank) {
          setReport(data);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [playerId]);

  const handleTogglePracticed = async (question: InterviewQuestion) => {
    try {
      const res = await updateInterviewQuestionPractice(playerId, question.id, {
        notes: question.userNotes,
      });

      setReport((prev) => ({
        ...prev,
        overallReadinessScore: res.overallReadinessScore,
        questionsBank: prev.questionsBank.map((q) =>
          q.id === question.id ? res.question : q
        ),
      }));
    } catch {
      Alert.alert('Error', 'Unable to toggle question practice status.');
    }
  };

  const handleSaveNotes = async (questionId: string) => {
    try {
      const res = await updateInterviewQuestionPractice(playerId, questionId, {
        notes: notesDraft,
      });

      setReport((prev) => ({
        ...prev,
        overallReadinessScore: res.overallReadinessScore,
        questionsBank: prev.questionsBank.map((q) =>
          q.id === questionId ? res.question : q
        ),
      }));
      setEditingQuestionId(null);
      setNotesDraft('');
    } catch {
      Alert.alert('Error', 'Unable to save answer notes.');
    }
  };

  const handleRunSimulation = async () => {
    if (!simClub.trim()) {
      Alert.alert('Required', 'Please enter the club or scout desk name for the simulated interview.');
      return;
    }

    setIsSimulating(true);
    try {
      const session = await logInterviewSimulation(playerId, {
        club: simClub.trim(),
        score: parseInt(simScore, 10) || 85,
        feedback: simFeedback.trim() || 'Strong articulation of role discipline and tactical readiness.',
      });

      setReport((prev) => ({
        ...prev,
        simulationSessions: [session, ...prev.simulationSessions],
      }));

      Alert.alert('Simulation Saved', `Interview trial run for ${session.club} saved with a score of ${session.score}%!`);
      setSimClub('');
      setSimFeedback('');
    } catch {
      Alert.alert('Error', 'Unable to record interview simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  const { overallReadinessScore, targetClubs, modules, questionsBank, simulationSessions } = report;

  const categories = ['All', ...Array.from(new Set(questionsBank.map((q) => q.category)))];

  const filteredQuestions = selectedCategory === 'All'
    ? questionsBank
    : questionsBank.filter((q) => q.category === selectedCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Scout Interview Hub</Text>
          <Text style={styles.headerSubtitle}>Trial Briefings &amp; Sporting Director Prep</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreBadgeVal}>{overallReadinessScore}%</Text>
          <Text style={styles.scoreBadgeLbl}>Ready</Text>
        </View>
      </View>

      {/* Target Club Scheduled Briefings */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={styles.cardTitle}>Scheduled Scout Interviews</Text>
        </View>

        {targetClubs.map((tc) => (
          <View key={tc.id} style={styles.targetClubItem}>
            <View style={styles.targetTop}>
              <Text style={styles.targetClubName}>{tc.club} ({tc.country})</Text>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>{tc.status}</Text>
              </View>
            </View>
            <Text style={styles.targetType}>{tc.interviewType}</Text>
            <Text style={styles.targetInterviewer}>Led by: {tc.interviewer}</Text>
            <View style={styles.focusList}>
              {tc.focusAreas.map((f, idx) => (
                <View key={idx} style={styles.focusChip}>
                  <Ionicons name="shield-checkmark" size={12} color="#1E40AF" />
                  <Text style={styles.focusChipText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Tactical & Cultural Prep Modules */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="school-outline" size={18} color="#059669" />
          <Text style={styles.cardTitle}>Core Preparation Modules</Text>
        </View>

        {modules.map((mod) => (
          <View key={mod.id} style={styles.moduleItem}>
            <View style={styles.moduleTop}>
              <Text style={styles.moduleTitle}>{mod.title}</Text>
              <Text style={styles.modulePct}>{mod.completionPercentage}%</Text>
            </View>
            <Text style={styles.moduleDesc}>{mod.description}</Text>
            <View style={styles.takeawaysList}>
              {mod.keyTakeaways.map((point, idx) => (
                <View key={idx} style={styles.takeawayRow}>
                  <Ionicons name="checkmark-circle-outline" size={14} color="#059669" />
                  <Text style={styles.takeawayText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* Interactive Question Bank */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="help-buoy-outline" size={18} color="#D97706" />
          <Text style={styles.cardTitle}>Scout Q&amp;A Drill Bank</Text>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, selectedCategory === cat && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryTabText, selectedCategory === cat && styles.categoryTabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredQuestions.map((q) => (
          <View key={q.id} style={styles.questionItem}>
            <View style={styles.questionTop}>
              <View style={styles.questionHeaderLeft}>
                <TouchableOpacity
                  style={[styles.checkbox, q.practiced && styles.checkboxActive]}
                  onPress={() => handleTogglePracticed(q)}
                >
                  {q.practiced && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </TouchableOpacity>
                <Text style={styles.categoryLabel}>{q.category}</Text>
              </View>
              <Text style={[styles.practicedTag, q.practiced ? styles.tagPracticed : styles.tagPending]}>
                {q.practiced ? 'Practiced' : 'Pending'}
              </Text>
            </View>

            <Text style={styles.questionPrompt}>{q.question}</Text>

            <Text style={styles.talkingPointsHeader}>Recommended Talking Points:</Text>
            {q.suggestedTalkingPoints.map((pt, idx) => (
              <View key={idx} style={styles.talkingPointRow}>
                <Ionicons name="arrow-forward-circle" size={13} color="#2563EB" />
                <Text style={styles.talkingPointText}>{pt}</Text>
              </View>
            ))}

            {editingQuestionId === q.id ? (
              <View style={styles.editNotesBox}>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder="Enter your personalized talking points or match examples..."
                  placeholderTextColor="#94A3B8"
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                />
                <View style={styles.notesActionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setEditingQuestionId(null);
                      setNotesDraft('');
                    }}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={() => handleSaveNotes(q.id)}
                  >
                    <Text style={styles.saveBtnText}>Save Notes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.notesDisplayRow}>
                <Text style={styles.userNotesText}>
                  {q.userNotes ? `My Notes: "${q.userNotes}"` : 'No personalized notes recorded.'}
                </Text>
                <TouchableOpacity
                  style={styles.editNotesToggle}
                  onPress={() => {
                    setEditingQuestionId(q.id);
                    setNotesDraft(q.userNotes);
                  }}
                >
                  <Ionicons name="pencil" size={13} color="#2563EB" />
                  <Text style={styles.editNotesToggleText}>{q.userNotes ? 'Edit' : 'Add Note'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Simulated Interview Studio */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic-outline" size={18} color="#7E22CE" />
          <Text style={styles.cardTitle}>Simulated Interview Studio</Text>
        </View>

        <Text style={styles.simIntro}>
          Log mock scout trial interviews to audit verbal clarity, tactical terminology, and sporting director presentation.
        </Text>

        <TextInput
          style={styles.simInput}
          placeholder="Target Club (e.g. FC Midtjylland, Vitoria SC)"
          placeholderTextColor="#94A3B8"
          value={simClub}
          onChangeText={setSimClub}
        />
        <TextInput
          style={styles.simInput}
          placeholder="Estimated Score (1 - 100)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={simScore}
          onChangeText={setSimScore}
        />
        <TextInput
          style={[styles.simInput, { height: 70 }]}
          multiline
          placeholder="Feedback & key learnings from the simulation..."
          placeholderTextColor="#94A3B8"
          value={simFeedback}
          onChangeText={setSimFeedback}
        />

        <TouchableOpacity
          style={[styles.runSimBtn, isSimulating && styles.btnDisabled]}
          onPress={handleRunSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
              <Text style={styles.runSimBtnText}>Save Simulation Run</Text>
            </>
          )}
        </TouchableOpacity>

        {/* History of simulations */}
        <Text style={styles.simHistoryHeader}>Recent Interview Simulation Runs</Text>
        {simulationSessions.map((sim) => (
          <View key={sim.id} style={styles.simSessionRow}>
            <View style={styles.simScoreCircle}>
              <Text style={styles.simScoreVal}>{sim.score}%</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.simClubText}>{sim.club}</Text>
              <Text style={styles.simDateText}>{new Date(sim.date).toLocaleDateString()}</Text>
              <Text style={styles.simFeedbackText}>"{sim.feedback}"</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  scoreBadgeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  scoreBadgeLbl: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  targetClubItem: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  targetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  targetClubName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },
  targetType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  targetInterviewer: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  focusList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  focusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  focusChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1E40AF',
  },
  moduleItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moduleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modulePct: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  moduleDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 16,
  },
  takeawaysList: {
    gap: 4,
  },
  takeawayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  takeawayText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  categoryTabActive: {
    backgroundColor: '#0F172A',
  },
  categoryTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  questionItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  questionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  practicedTag: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagPracticed: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  tagPending: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  questionPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
    marginBottom: 8,
  },
  talkingPointsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  talkingPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 3,
  },
  talkingPointText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
    lineHeight: 15,
  },
  notesDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 8,
  },
  userNotesText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },
  editNotesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  editNotesToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  editNotesBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 8,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
    fontSize: 11,
    color: '#0F172A',
    height: 60,
    textAlignVertical: 'top',
  },
  notesActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cancelBtnText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  saveBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  simIntro: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  simInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 8,
  },
  runSimBtn: {
    backgroundColor: '#7E22CE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  runSimBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  simHistoryHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 8,
  },
  simSessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  simScoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simScoreVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7E22CE',
  },
  simClubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  simDateText: {
    fontSize: 10,
    color: '#64748B',
  },
  simFeedbackText: {
    fontSize: 11,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
