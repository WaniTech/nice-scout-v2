import {
    defaultPathwayReport,
    PathwayMilestone,
    PathwayMilestoneStatus,
    PathwayReport
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    getPlayerPathwayReport,
    simulatePathwayScenario,
    updatePathwayMilestone,
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

const pathwayOptions = [
  'Accelerated Domestic Bridge',
  'Benelux Technical Bridge',
  'German Academy Pathway',
  'Direct European First-Team Route',
];

export default function CareerPathwayScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState<PathwayReport>(defaultPathwayReport);
  const [selectedPhaseTab, setSelectedPhaseTab] = useState<string>('All');
  const [milestoneFilter, setMilestoneFilter] = useState<string>('All');
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<string>('');

  // Simulation form
  const [scenName, setScenName] = useState<string>('');
  const [scenPathway, setScenPathway] = useState<string>('Accelerated Domestic Bridge');
  const [scenYears, setScenYears] = useState<string>('3');
  const [scenFocus, setScenFocus] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getPlayerPathwayReport(playerId)
      .then((data) => {
        if (active && data?.phases) {
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

  const handleCycleMilestoneStatus = async (milestone: PathwayMilestone) => {
    try {
      const nextStatus: PathwayMilestoneStatus =
        milestone.status === 'Target'
          ? 'In Progress'
          : milestone.status === 'In Progress'
          ? 'Completed'
          : 'Target';

      const res = await updatePathwayMilestone(playerId, milestone.id, {
        status: nextStatus,
        notes: milestone.notes,
      });

      setReport((prev) => ({
        ...prev,
        trajectoryRating: res.trajectoryRating,
        milestones: prev.milestones.map((m) =>
          m.id === milestone.id ? res.milestone : m
        ),
      }));
    } catch {
      Alert.alert('Error', 'Unable to update milestone status.');
    }
  };

  const handleSaveMilestoneNotes = async (milestoneId: string) => {
    try {
      const res = await updatePathwayMilestone(playerId, milestoneId, {
        notes: notesDraft,
      });

      setReport((prev) => ({
        ...prev,
        trajectoryRating: res.trajectoryRating,
        milestones: prev.milestones.map((m) =>
          m.id === milestoneId ? res.milestone : m
        ),
      }));
      setEditingMilestoneId(null);
      setNotesDraft('');
    } catch {
      Alert.alert('Error', 'Unable to save milestone notes.');
    }
  };

  const handleRunSimulation = async () => {
    if (!scenName.trim()) {
      Alert.alert('Required', 'Please enter a name for the career simulation scenario.');
      return;
    }

    setIsSimulating(true);
    try {
      const scenario = await simulatePathwayScenario(playerId, {
        name: scenName.trim(),
        pathwayType: scenPathway,
        targetHorizonYears: parseInt(scenYears, 10) || 3,
        customFocus: scenFocus.trim() || 'Accelerated match fitness & weekly transition drills.',
      });

      setReport((prev) => ({
        ...prev,
        simulatedScenarios: [scenario, ...prev.simulatedScenarios],
      }));

      Alert.alert(
        'Trajectory Simulated',
        `Simulated ${scenario.name}: Projected Peak Valuation €${(
          scenario.projectedPeakValuationEur / 1000000
        ).toFixed(1)}M over ${scenario.projectedYearsToTop5} years.`
      );
      setScenName('');
      setScenFocus('');
    } catch {
      Alert.alert('Simulation Error', 'Unable to simulate career pathway at this time.');
    } finally {
      setIsSimulating(false);
    }
  };

  const {
    currentStage,
    targetHorizon,
    projectedCeiling,
    trajectoryRating,
    phases,
    milestones,
    benchmarkedClubs,
    simulatedScenarios,
  } = report;

  const filteredPhases = selectedPhaseTab === 'All'
    ? phases
    : phases.filter((p) => p.id === selectedPhaseTab);

  const filteredMilestones = milestoneFilter === 'All'
    ? milestones
    : milestones.filter((m) => m.status === milestoneFilter);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Career Pathway Engine</Text>
          <Text style={styles.headerSubtitle}>Pro Trajectory &amp; Development Roadmap</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeVal}>{trajectoryRating}%</Text>
          <Text style={styles.ratingBadgeLbl}>Trajectory</Text>
        </View>
      </View>

      {/* Trajectory Horizon Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroKicker}>PROJECTED CAREER ARCHITECTURE</Text>
            <Text style={styles.heroTitle}>{targetHorizon}</Text>
          </View>
          <View style={styles.ceilingPill}>
            <Ionicons name="trending-up" size={14} color="#10B981" />
            <Text style={styles.ceilingPillText}>Tier 1 Ceiling</Text>
          </View>
        </View>

        <View style={styles.heroMetricsGrid}>
          <View style={styles.heroMetricCol}>
            <Text style={styles.heroMetricLbl}>Current Baseline</Text>
            <Text style={styles.heroMetricVal}>{currentStage}</Text>
          </View>
          <View style={styles.heroMetricCol}>
            <Text style={styles.heroMetricLbl}>Target Level</Text>
            <Text style={styles.heroMetricVal}>{projectedCeiling}</Text>
          </View>
        </View>
      </View>

      {/* Development Phases Roadmap */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="git-network-outline" size={18} color="#2563EB" />
          <Text style={styles.cardTitle}>Multi-Stage Progression Roadmap</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, selectedPhaseTab === 'All' && styles.tabBtnActive]}
            onPress={() => setSelectedPhaseTab('All')}
          >
            <Text style={[styles.tabBtnText, selectedPhaseTab === 'All' && styles.tabBtnTextActive]}>
              All Phases
            </Text>
          </TouchableOpacity>
          {phases.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.tabBtn, selectedPhaseTab === p.id && styles.tabBtnActive]}
              onPress={() => setSelectedPhaseTab(p.id)}
            >
              <Text style={[styles.tabBtnText, selectedPhaseTab === p.id && styles.tabBtnTextActive]}>
                {p.title.split(' (')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredPhases.map((phase, idx) => (
          <View key={phase.id} style={styles.phaseCard}>
            <View style={styles.phaseHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.phaseHorizon}>{phase.horizon} • {phase.targetLeague}</Text>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
              </View>
              <View
                style={[
                  styles.statusTag,
                  phase.status === 'Completed'
                    ? styles.statusTagCompleted
                    : phase.status === 'In Progress'
                    ? styles.statusTagInProgress
                    : styles.statusTagTarget,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    phase.status === 'Completed'
                      ? styles.statusTextCompleted
                      : phase.status === 'In Progress'
                      ? styles.statusTextInProgress
                      : styles.statusTextTarget,
                  ]}
                >
                  {phase.status}
                </Text>
              </View>
            </View>

            <Text style={styles.phaseSubTitle}>Primary Strategic Objectives:</Text>
            {phase.primaryObjectives.map((obj, oIdx) => (
              <View key={oIdx} style={styles.objectiveRow}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={styles.objectiveText}>{obj}</Text>
              </View>
            ))}

            <View style={styles.kpiGrid}>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLbl}>Minutes</Text>
                <Text style={styles.kpiVal}>{phase.kpiTargets.minutesProjected}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLbl}>G/A Target</Text>
                <Text style={styles.kpiVal}>{phase.kpiTargets.goalContributions}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLbl}>Velocity</Text>
                <Text style={styles.kpiVal}>{phase.kpiTargets.sprintSpeedTarget}</Text>
              </View>
              <View style={styles.kpiItem}>
                <Text style={styles.kpiLbl}>Est. Value</Text>
                <Text style={[styles.kpiVal, { color: '#2563EB' }]}>
                  {phase.kpiTargets.marketValuationTarget}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Milestone Checkpoints */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="flag-outline" size={18} color="#D97706" />
          <Text style={styles.cardTitle}>Milestone Checkpoints &amp; Criteria</Text>
        </View>

        <View style={styles.filterBar}>
          {['All', 'Completed', 'In Progress', 'Target'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.miniFilter, milestoneFilter === f && styles.miniFilterActive]}
              onPress={() => setMilestoneFilter(f)}
            >
              <Text style={[styles.miniFilterText, milestoneFilter === f && styles.miniFilterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredMilestones.map((ms) => (
          <View key={ms.id} style={styles.milestoneCard}>
            <View style={styles.milestoneTop}>
              <TouchableOpacity
                style={[
                  styles.milestoneCheckbox,
                  ms.status === 'Completed' && styles.checkboxDone,
                  ms.status === 'In Progress' && styles.checkboxProg,
                ]}
                onPress={() => handleCycleMilestoneStatus(ms)}
              >
                {ms.status === 'Completed' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                {ms.status === 'In Progress' && <Ionicons name="time" size={13} color="#FFFFFF" />}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.milestoneTitle}>{ms.title}</Text>
                <Text style={styles.milestoneDate}>Target: {ms.targetDate} • {ms.metric}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.statusTag,
                  ms.status === 'Completed'
                    ? styles.statusTagCompleted
                    : ms.status === 'In Progress'
                    ? styles.statusTagInProgress
                    : styles.statusTagTarget,
                ]}
                onPress={() => handleCycleMilestoneStatus(ms)}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    ms.status === 'Completed'
                      ? styles.statusTextCompleted
                      : ms.status === 'In Progress'
                      ? styles.statusTextInProgress
                      : styles.statusTextTarget,
                  ]}
                >
                  {ms.status}
                </Text>
              </TouchableOpacity>
            </View>

            {editingMilestoneId === ms.id ? (
              <View style={styles.notesEditBox}>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  placeholder="Record verification notes, fixture details, or coach comments..."
                  placeholderTextColor="#94A3B8"
                  value={notesDraft}
                  onChangeText={setNotesDraft}
                />
                <View style={styles.notesActions}>
                  <TouchableOpacity
                    style={styles.noteCancelBtn}
                    onPress={() => {
                      setEditingMilestoneId(null);
                      setNotesDraft('');
                    }}
                  >
                    <Text style={styles.noteCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.noteSaveBtn}
                    onPress={() => handleSaveMilestoneNotes(ms.id)}
                  >
                    <Text style={styles.noteSaveText}>Save Notes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.notesRow}>
                <Text style={styles.notesText}>
                  {ms.notes ? `Log: "${ms.notes}"` : 'No notes recorded.'}
                </Text>
                <TouchableOpacity
                  style={styles.editNoteBtn}
                  onPress={() => {
                    setEditingMilestoneId(ms.id);
                    setNotesDraft(ms.notes);
                  }}
                >
                  <Ionicons name="pencil" size={12} color="#2563EB" />
                  <Text style={styles.editNoteBtnText}>{ms.notes ? 'Edit' : 'Add Note'}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Benchmarked Pathway Incubators */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="business-outline" size={18} color="#059669" />
          <Text style={styles.cardTitle}>Benchmarked Pathway Incubators</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Top European clubs ranked for developmental minutes and first-team transition velocity.
        </Text>

        {benchmarkedClubs.map((club) => (
          <View key={club.id} style={styles.clubCard}>
            <View style={styles.clubHeader}>
              <View>
                <Text style={styles.clubName}>{club.club} ({club.country})</Text>
                <Text style={styles.clubFitFactor}>{club.fitFactor}</Text>
              </View>
              <View style={styles.indexBox}>
                <Text style={styles.indexVal}>{club.transitionIndex}%</Text>
                <Text style={styles.indexLbl}>Transition</Text>
              </View>
            </View>
            <Text style={styles.clubTrackRecord}>{club.trackRecord}</Text>
            <View style={styles.clubMetaRow}>
              <Text style={styles.clubU21Share}>U21 Minutes Share: {club.u21MinutesShare}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Trajectory Scenario Simulator */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="hardware-chip-outline" size={18} color="#7E22CE" />
          <Text style={styles.cardTitle}>Trajectory Scenario Simulator</Text>
        </View>

        <Text style={styles.simIntro}>
          Simulate career outcomes based on transition route, horizon timeline, and tactical focus.
        </Text>

        <TextInput
          style={styles.inputField}
          placeholder="Scenario Title (e.g. Rapid Nordic Starter Route)"
          placeholderTextColor="#94A3B8"
          value={scenName}
          onChangeText={setScenName}
        />

        <Text style={styles.inputLabel}>Select Pathway Strategic Route:</Text>
        <View style={styles.pathwayPillsRow}>
          {pathwayOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.pathwayPill, scenPathway === opt && styles.pathwayPillActive]}
              onPress={() => setScenPathway(opt)}
            >
              <Text style={[styles.pathwayPillText, scenPathway === opt && styles.pathwayPillTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.inputField}
          placeholder="Horizon Years (e.g. 2, 3, 5)"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={scenYears}
          onChangeText={setScenYears}
        />

        <TextInput
          style={[styles.inputField, { height: 60 }]}
          multiline
          placeholder="Custom Developmental Focus (e.g. 1v1 dribble rate, sprint volume)..."
          placeholderTextColor="#94A3B8"
          value={scenFocus}
          onChangeText={setScenFocus}
        />

        <TouchableOpacity
          style={[styles.simBtn, isSimulating && styles.btnDisabled]}
          onPress={handleRunSimulation}
          disabled={isSimulating}
        >
          {isSimulating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="analytics" size={16} color="#FFFFFF" />
              <Text style={styles.simBtnText}>Simulate Trajectory Scenario</Text>
            </>
          )}
        </TouchableOpacity>

        {/* List of Simulated Scenarios */}
        <Text style={styles.scenariosHeader}>Projected Scenarios Archive</Text>
        {simulatedScenarios.map((scen) => (
          <View key={scen.id} style={styles.scenarioCard}>
            <View style={styles.scenarioTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.scenarioName}>{scen.name}</Text>
                <Text style={styles.scenarioType}>{scen.pathwayType} • {scen.projectedYearsToTop5} Years Horizon</Text>
              </View>
              <View style={styles.valBadge}>
                <Text style={styles.valBadgeText}>
                  €{(scen.projectedPeakValuationEur / 1000000).toFixed(1)}M Peak
                </Text>
              </View>
            </View>
            <Text style={styles.scenarioAdvantage}>{scen.keyAdvantage}</Text>
            <Text style={styles.scenarioRisk}>Risk Factor: {scen.keyRisk}</Text>
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
  ratingBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingBadgeVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#10B981',
  },
  ratingBadgeLbl: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroBanner: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  heroKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  ceilingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ceilingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34D399',
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10,
    gap: 12,
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLbl: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroMetricVal: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 2,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  tabsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  phaseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  phaseHorizon: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  phaseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  phaseSubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 4,
    marginBottom: 6,
  },
  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  objectiveText: {
    fontSize: 11,
    color: '#334155',
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiLbl: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  kpiVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusTagCompleted: {
    backgroundColor: '#DCFCE7',
  },
  statusTagInProgress: {
    backgroundColor: '#FEF3C7',
  },
  statusTagTarget: {
    backgroundColor: '#F1F5F9',
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextCompleted: {
    color: '#15803D',
  },
  statusTextInProgress: {
    color: '#B45309',
  },
  statusTextTarget: {
    color: '#64748B',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  miniFilter: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  miniFilterActive: {
    backgroundColor: '#0F172A',
  },
  miniFilterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  miniFilterTextActive: {
    color: '#FFFFFF',
  },
  milestoneCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkboxProg: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  milestoneDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  notesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 6,
  },
  notesText: {
    fontSize: 10,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },
  editNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  editNoteBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  notesEditBox: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 8,
    paddingTop: 6,
  },
  notesInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 8,
    fontSize: 11,
    color: '#0F172A',
    height: 50,
  },
  notesActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  noteCancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noteCancelText: {
    fontSize: 10,
    color: '#64748B',
  },
  noteSaveBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  noteSaveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clubCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  clubName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  clubFitFactor: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '600',
  },
  indexBox: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: 'center',
  },
  indexVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  indexLbl: {
    fontSize: 8,
    color: '#15803D',
    textTransform: 'uppercase',
  },
  clubTrackRecord: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    lineHeight: 15,
  },
  clubMetaRow: {
    marginTop: 6,
  },
  clubU21Share: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  simIntro: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  pathwayPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  pathwayPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  pathwayPillActive: {
    backgroundColor: '#7E22CE',
  },
  pathwayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  pathwayPillTextActive: {
    color: '#FFFFFF',
  },
  simBtn: {
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
  simBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scenariosHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 8,
  },
  scenarioCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scenarioTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  scenarioName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  scenarioType: {
    fontSize: 10,
    color: '#64748B',
  },
  valBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  valBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
  },
  scenarioAdvantage: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 15,
    marginTop: 2,
  },
  scenarioRisk: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 4,
  },
});
