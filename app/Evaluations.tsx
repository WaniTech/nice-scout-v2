import {
    colors,
    defaultFeedbackReport,
    ScoutEvaluation,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    acknowledgeScoutFeedback,
    getPlayerFeedbackReport,
    submitScoutEvaluation,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function EvaluationsScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState(defaultFeedbackReport);
  const [busy, setBusy] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New Evaluation Form State
  const [scoutName, setScoutName] = useState('');
  const [club, setClub] = useState('');
  const [matchOpponent, setMatchOpponent] = useState('');
  const [overallRating, setOverallRating] = useState('8.5');
  const [recommendation, setRecommendation] = useState('Recommend Immediate Trial');
  const [coachingNotes, setCoachingNotes] = useState('');

  useEffect(() => {
    let active = true;
    getPlayerFeedbackReport(playerId)
      .then((data) => {
        if (active && data?.evaluations) setReport(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [playerId]);

  const handleAcknowledge = async (evalItem: ScoutEvaluation) => {
    if (evalItem.acknowledged) return;
    setBusy(true);
    try {
      const updated = await acknowledgeScoutFeedback(playerId, evalItem.id, { acknowledged: true });
      setReport((prev) => ({
        ...prev,
        evaluations: prev.evaluations.map((e) => (e.id === updated.id ? updated : e)),
      }));
    } catch {
      Alert.alert('Error', 'Could not acknowledge evaluation right now.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddEvaluation = async () => {
    if (!scoutName.trim() || !club.trim() || !matchOpponent.trim()) {
      Alert.alert('Required Fields', 'Please fill in scout name, club, and match opponent.');
      return;
    }

    setBusy(true);
    try {
      const ratingNum = parseFloat(overallRating) || 8.0;
      const created = await submitScoutEvaluation(playerId, {
        scoutName: scoutName.trim(),
        club: club.trim(),
        league: 'Scouting Assessment',
        matchOpponent: matchOpponent.trim(),
        matchDate: new Date().toISOString().split('T')[0],
        overallRating: ratingNum,
        categories: {
          gameIntelligence: ratingNum,
          technicalExecution: ratingNum,
          physicalImpact: Math.max(1, ratingNum - 0.3),
          tacticalDiscipline: ratingNum,
        },
        recommendation: recommendation.trim(),
        strengthsObserved: ['1v1 Isolation', 'Turnover Transition'],
        coachingNotes: coachingNotes.trim() || 'Recorded from recent scout match observation.',
      });

      setReport((prev) => ({
        ...prev,
        evaluations: [created, ...prev.evaluations],
        metrics: {
          ...prev.metrics,
          totalEvaluations: prev.metrics.totalEvaluations + 1,
        },
      }));

      setShowAddForm(false);
      setScoutName('');
      setClub('');
      setMatchOpponent('');
      setCoachingNotes('');
      Alert.alert('Evaluation Saved', 'Scout match evaluation logged successfully.');
    } catch {
      Alert.alert('Error', 'Could not save evaluation right now.');
    } finally {
      setBusy(false);
    }
  };

  const { metrics, evaluations } = report;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Scout Audit & Feedback</Text>
          <Text style={styles.title}>Match Evaluations</Text>
          <Text style={styles.subtitle}>Verified scout match reports, rating breakdowns, and trial recommendations.</Text>
        </View>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.averageRating}</Text>
          <Text style={styles.metricLabel}>Scout Rating</Text>
          <Text style={styles.metricSub}>Out of 10.0</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalEvaluations}</Text>
          <Text style={styles.metricLabel}>Evaluations</Text>
          <Text style={styles.metricSub}>Live Matches</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.recommendationCount}</Text>
          <Text style={styles.metricLabel}>Trials Advised</Text>
          <Text style={styles.metricSub}>Scout Backed</Text>
        </View>
      </View>

      {/* Category Breakdown Radar Progress */}
      <View style={styles.card}>
        <Text style={styles.cardKicker}>Category Ratings</Text>
        <Text style={styles.cardTitle}>Scout Assessment Pillars</Text>

        <View style={styles.pillarGrid}>
          <PillarRow label="Game Intelligence" score={metrics.categoryAverages.gameIntelligence} color="#2563EB" />
          <PillarRow label="Technical Execution" score={metrics.categoryAverages.technicalExecution} color="#10B981" />
          <PillarRow label="Physical Impact" score={metrics.categoryAverages.physicalImpact} color="#D97706" />
          <PillarRow label="Tactical Discipline" score={metrics.categoryAverages.tacticalDiscipline} color="#7C3AED" />
        </View>
      </View>

      {/* Top Observed Strengths */}
      <View style={styles.card}>
        <Text style={styles.cardKicker}>Observed Strengths</Text>
        <Text style={styles.cardTitle}>Verified Scout Tags</Text>
        <View style={styles.tagWrap}>
          {metrics.topObservedStrengths.map((strength) => (
            <View key={strength} style={styles.strengthTag}>
              <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
              <Text style={styles.strengthText}>{strength}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Button */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Match Evaluation Logs</Text>
        <TouchableOpacity
          style={styles.addFormButton}
          onPress={() => setShowAddForm((prev) => !prev)}
        >
          <Ionicons name={showAddForm ? 'close' : 'add'} size={18} color="#FFFFFF" />
          <Text style={styles.addFormButtonText}>{showAddForm ? 'Cancel' : 'Log Evaluation'}</Text>
        </TouchableOpacity>
      </View>

      {/* Log Evaluation Modal / Form */}
      {showAddForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Record Scout Match Report</Text>

          <TextInput
            style={styles.input}
            placeholder="Scout Name (e.g., Lars Holm)"
            placeholderTextColor={colors.muted}
            value={scoutName}
            onChangeText={setScoutName}
          />
          <TextInput
            style={styles.input}
            placeholder="Club (e.g., Brondby IF)"
            placeholderTextColor={colors.muted}
            value={club}
            onChangeText={setClub}
          />
          <TextInput
            style={styles.input}
            placeholder="Match Opponent (e.g., FC Copenhagen U19)"
            placeholderTextColor={colors.muted}
            value={matchOpponent}
            onChangeText={setMatchOpponent}
          />
          <TextInput
            style={styles.input}
            placeholder="Overall Rating (1.0 - 10.0)"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            value={overallRating}
            onChangeText={setOverallRating}
          />
          <TextInput
            style={styles.input}
            placeholder="Recommendation (e.g., Recommend Immediate Trial)"
            placeholderTextColor={colors.muted}
            value={recommendation}
            onChangeText={setRecommendation}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Coaching & Tactical Notes..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            value={coachingNotes}
            onChangeText={setCoachingNotes}
          />

          <TouchableOpacity style={styles.submitButton} disabled={busy} onPress={handleAddEvaluation}>
            <Text style={styles.submitButtonText}>Submit Match Report</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Match Evaluation Timeline */}
      {evaluations.map((evalItem) => (
        <View key={evalItem.id} style={styles.evalCard}>
          <View style={styles.evalHeader}>
            <View style={styles.scoutAvatar}>
              <Ionicons name="clipboard-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.scoutInfo}>
              <Text style={styles.scoutNameText}>{evalItem.scoutName}</Text>
              <Text style={styles.scoutClubText}>
                {evalItem.club} • {evalItem.league}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingScore}>{evalItem.overallRating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/ 10</Text>
            </View>
          </View>

          <View style={styles.matchMetaRow}>
            <Ionicons name="football-outline" size={14} color={colors.muted} />
            <Text style={styles.matchMetaText}>
              vs {evalItem.matchOpponent} ({evalItem.matchDate})
            </Text>
          </View>

          <View style={styles.recommendationBox}>
            <Ionicons name="star" size={15} color="#D97706" />
            <Text style={styles.recommendationText}>{evalItem.recommendation}</Text>
          </View>

          <Text style={styles.coachingNotesText}>"{evalItem.coachingNotes}"</Text>

          {evalItem.strengthsObserved && evalItem.strengthsObserved.length > 0 ? (
            <View style={styles.evalTagsRow}>
              {evalItem.strengthsObserved.map((tag) => (
                <View key={tag} style={styles.evalTagPill}>
                  <Text style={styles.evalTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.evalFooter}>
            <View style={styles.ackStatus}>
              <Ionicons
                name={evalItem.acknowledged ? 'checkmark-circle' : 'time-outline'}
                size={16}
                color={evalItem.acknowledged ? colors.primary : colors.muted}
              />
              <Text style={[styles.ackStatusText, evalItem.acknowledged && styles.ackStatusTextDone]}>
                {evalItem.acknowledged ? 'Acknowledged by Player' : 'Pending Player Review'}
              </Text>
            </View>

            {!evalItem.acknowledged ? (
              <TouchableOpacity
                style={styles.ackButton}
                disabled={busy}
                onPress={() => handleAcknowledge(evalItem)}
              >
                <Text style={styles.ackButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function PillarRow({ label, score, color }: { label: string; score: number; color: string }) {
  const percentage = Math.min(100, Math.max(0, (score / 10) * 100));
  return (
    <View style={styles.pillarRow}>
      <View style={styles.pillarMeta}>
        <Text style={styles.pillarLabel}>{label}</Text>
        <Text style={styles.pillarScore}>{score.toFixed(1)} / 10</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 110 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 20 },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerCopy: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 28, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 4 },

  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  metricLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 2 },
  metricSub: { color: colors.muted, fontSize: 10, marginTop: 1 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardKicker: { color: colors.accent, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 2, marginBottom: 14 },

  pillarGrid: { gap: 12 },
  pillarRow: { gap: 6 },
  pillarMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pillarLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  pillarScore: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  track: { height: 8, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  strengthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E5F3EC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  strengthText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  addFormButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addFormButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  formTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  evalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  evalHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoutAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E5F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutInfo: { flex: 1 },
  scoutNameText: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  scoutClubText: { color: colors.muted, fontSize: 12, marginTop: 1 },
  ratingBadge: { flexDirection: 'row', alignItems: 'baseline', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  ratingScore: { color: '#B45309', fontSize: 16, fontWeight: '900' },
  ratingMax: { color: '#B45309', fontSize: 10, fontWeight: '700', marginLeft: 2 },

  matchMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  matchMetaText: { color: colors.muted, fontSize: 12, fontWeight: '600' },

  recommendationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  recommendationText: { color: '#92400E', fontSize: 12, fontWeight: '800' },

  coachingNotesText: { color: colors.ink, fontSize: 13, lineHeight: 19, fontStyle: 'italic', marginTop: 10 },

  evalTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  evalTagPill: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  evalTagText: { color: colors.muted, fontSize: 11, fontWeight: '700' },

  evalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  ackStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ackStatusText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  ackStatusTextDone: { color: colors.primary },
  ackButton: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ackButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
