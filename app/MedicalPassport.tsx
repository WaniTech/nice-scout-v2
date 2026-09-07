import {
    colors,
    defaultMedicalReport,
    MedicalReport,
    PlayerInjury,
    RehabProtocol,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    addRehabProtocol,
    getPlayerMedicalReport,
    logPlayerInjury,
    updateMedicalClearance,
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

export default function MedicalPassportScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState<MedicalReport>(defaultMedicalReport);
  const [busy, setBusy] = useState(false);
  const [showAddInjury, setShowAddInjury] = useState(false);
  const [showAddProtocol, setShowAddProtocol] = useState(false);

  // Injury Form State
  const [injuryType, setInjuryType] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [dateOccurred, setDateOccurred] = useState('');
  const [recoveryWeeks, setRecoveryWeeks] = useState('2');
  const [recurrenceRisk, setRecurrenceRisk] = useState('Low');
  const [treatingPhysio, setTreatingPhysio] = useState('');
  const [injuryNotes, setInjuryNotes] = useState('');

  // Protocol Form State
  const [protocolTitle, setProtocolTitle] = useState('');
  const [protocolFocus, setProtocolFocus] = useState('');
  const [protocolFrequency, setProtocolFrequency] = useState('3x / week');

  useEffect(() => {
    let active = true;
    getPlayerMedicalReport(playerId)
      .then((data) => {
        if (active && data?.record) setReport(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [playerId]);

  const handleAddInjury = async () => {
    if (!injuryType.trim() || !bodyPart.trim() || !dateOccurred.trim()) {
      Alert.alert('Missing Fields', 'Please provide injury type, body part, and date occurred.');
      return;
    }

    setBusy(true);
    try {
      const created = await logPlayerInjury(playerId, {
        type: injuryType.trim(),
        bodyPart: bodyPart.trim(),
        dateOccurred: dateOccurred.trim(),
        recoveryWeeks: parseInt(recoveryWeeks, 10) || 2,
        recurrenceRisk: recurrenceRisk.trim(),
        treatingPhysio: treatingPhysio.trim() || 'Team Sports Physician',
        status: 'Fully Resolved',
        notes: injuryNotes.trim() || 'Rehab completed according to return-to-play protocol.',
      });

      setReport((prev) => ({
        ...prev,
        record: {
          ...prev.record,
          injuries: [created, ...prev.record.injuries],
        },
        readiness: {
          ...prev.readiness,
          totalInjuries: prev.readiness.totalInjuries + 1,
        },
      }));

      setShowAddInjury(false);
      setInjuryType('');
      setBodyPart('');
      setDateOccurred('');
      setInjuryNotes('');
      Alert.alert('Injury Logged', 'Medical history has been updated and synchronized.');
    } catch {
      Alert.alert('Error', 'Could not log injury at this time.');
    } finally {
      setBusy(false);
    }
  };

  const handleAddProtocol = async () => {
    if (!protocolTitle.trim() || !protocolFocus.trim()) {
      Alert.alert('Missing Fields', 'Please enter protocol title and focus area.');
      return;
    }

    setBusy(true);
    try {
      const created = await addRehabProtocol(playerId, {
        title: protocolTitle.trim(),
        focus: protocolFocus.trim(),
        frequency: protocolFrequency.trim(),
        status: 'Active Maintenance',
      });

      setReport((prev) => ({
        ...prev,
        record: {
          ...prev.record,
          rehabProtocols: [created, ...prev.record.rehabProtocols],
        },
      }));

      setShowAddProtocol(false);
      setProtocolTitle('');
      setProtocolFocus('');
      Alert.alert('Protocol Added', 'Rehab & prevention routine recorded.');
    } catch {
      Alert.alert('Error', 'Could not save protocol.');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleClearance = async () => {
    const nextStatus =
      report.record.clearanceStatus === 'Full Match Clearance'
        ? 'Restricted Training Only'
        : 'Full Match Clearance';

    setBusy(true);
    try {
      const updated = await updateMedicalClearance(playerId, {
        clearanceStatus: nextStatus,
      });

      setReport((prev) => ({
        ...prev,
        record: updated,
        readiness: {
          ...prev.readiness,
          clearanceStatus: nextStatus,
          readinessScore: nextStatus === 'Full Match Clearance' ? 100 : 70,
        },
      }));

      Alert.alert('Clearance Updated', `Player status is now: ${nextStatus}`);
    } catch {
      Alert.alert('Error', 'Could not update medical clearance.');
    } finally {
      setBusy(false);
    }
  };

  const { readiness, record } = report;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Medical & Athletic Passport</Text>
          <Text style={styles.title}>Physical Clearance</Text>
          <Text style={styles.subtitle}>Verified screening records, injury history, and return-to-play protocols.</Text>
        </View>
      </View>

      {/* Main Medical Clearance Status Banner */}
      <View style={styles.clearanceCard}>
        <View style={styles.clearanceTop}>
          <View style={styles.clearanceIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color="#15803D" />
          </View>
          <View style={styles.clearanceMeta}>
            <Text style={styles.clearanceKicker}>FIFA & Club Medical Tier</Text>
            <Text style={styles.clearanceTitle}>{readiness.clearanceStatus}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{readiness.safetyTier}</Text>
          </View>
        </View>

        <View style={styles.readinessBarRow}>
          <Text style={styles.readinessScoreLabel}>Medical Readiness Index</Text>
          <Text style={styles.readinessScoreValue}>{readiness.readinessScore}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${readiness.readinessScore}%` }]} />
        </View>

        <TouchableOpacity
          style={styles.toggleClearanceBtn}
          disabled={busy}
          onPress={handleToggleClearance}
        >
          <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
          <Text style={styles.toggleClearanceText}>
            Switch to {record.clearanceStatus === 'Full Match Clearance' ? 'Restricted' : 'Full Clearance'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Clinical Screening Verification Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Clinical Screening Records</Text>
      </View>

      <View style={styles.screeningGrid}>
        <ScreeningItem
          icon="heart-outline"
          title="Cardiac Screening"
          status={record.cardiacScreeningStatus}
          date={record.cardiacScreeningDate}
          verified={readiness.cardiacVerified}
        />
        <ScreeningItem
          icon="body-outline"
          title="Concussion Baseline"
          status="SCAT5 Tested"
          date={record.concussionBaselineDate}
          verified={readiness.concussionBaselineVerified}
        />
        <ScreeningItem
          icon="water-outline"
          title="Blood Biomarkers"
          status={record.bloodPanelStatus}
          date="2026-06-15"
          verified={true}
        />
        <ScreeningItem
          icon="fitness-outline"
          title="Orthopedic Screening"
          status={record.orthopedicSummary}
          date="2026-06-10"
          verified={true}
        />
      </View>

      {/* Injury History Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Injury & Recovery History</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddInjury((prev) => !prev)}
        >
          <Ionicons name={showAddInjury ? 'close' : 'add'} size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{showAddInjury ? 'Cancel' : 'Log Injury'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Injury Form */}
      {showAddInjury ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Record Clinical Injury Event</Text>
          <TextInput
            style={styles.input}
            placeholder="Injury Type (e.g. Hamstring Strain Grade 1)"
            placeholderTextColor={colors.muted}
            value={injuryType}
            onChangeText={setInjuryType}
          />
          <TextInput
            style={styles.input}
            placeholder="Anatomical Location (e.g. Left Bicep Femoris)"
            placeholderTextColor={colors.muted}
            value={bodyPart}
            onChangeText={setBodyPart}
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Date (YYYY-MM-DD)"
              placeholderTextColor={colors.muted}
              value={dateOccurred}
              onChangeText={setDateOccurred}
            />
            <TextInput
              style={[styles.input, { width: 110 }]}
              placeholder="Weeks (e.g. 3)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={recoveryWeeks}
              onChangeText={setRecoveryWeeks}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Recurrence Risk (Low / Moderate)"
            placeholderTextColor={colors.muted}
            value={recurrenceRisk}
            onChangeText={setRecurrenceRisk}
          />
          <TextInput
            style={styles.input}
            placeholder="Treating Physiotherapist or Clinic"
            placeholderTextColor={colors.muted}
            value={treatingPhysio}
            onChangeText={setTreatingPhysio}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Rehab details, tests passed, return-to-play criteria..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
            value={injuryNotes}
            onChangeText={setInjuryNotes}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            disabled={busy}
            onPress={handleAddInjury}
          >
            <Text style={styles.submitBtnText}>Save Injury Record</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Injury Timeline Cards */}
      {record.injuries.map((inj: PlayerInjury) => (
        <View key={inj.id} style={styles.injuryCard}>
          <View style={styles.injuryHeader}>
            <View style={styles.injuryIconWrap}>
              <Ionicons name="bandage-outline" size={18} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.injuryType}>{inj.type}</Text>
              <Text style={styles.injuryBodyPart}>{inj.bodyPart}</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{inj.status}</Text>
            </View>
          </View>

          <View style={styles.injuryMetaRow}>
            <Text style={styles.injuryMetaText}>Occurred: {inj.dateOccurred}</Text>
            <Text style={styles.injuryMetaText}>•</Text>
            <Text style={styles.injuryMetaText}>Recovery: {inj.recoveryWeeks} wks</Text>
            <Text style={styles.injuryMetaText}>•</Text>
            <Text style={styles.injuryMetaText}>Risk: {inj.recurrenceRisk}</Text>
          </View>

          {inj.treatingPhysio ? (
            <Text style={styles.physioText}>Supervised by: {inj.treatingPhysio}</Text>
          ) : null}

          {inj.notes ? <Text style={styles.injuryNotesText}>{inj.notes}</Text> : null}
        </View>
      ))}

      {/* Rehab & Prevention Protocols */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Rehab & Prevention Protocols</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAddProtocol((prev) => !prev)}
        >
          <Ionicons name={showAddProtocol ? 'close' : 'add'} size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{showAddProtocol ? 'Cancel' : 'Add Protocol'}</Text>
        </TouchableOpacity>
      </View>

      {/* Add Protocol Form */}
      {showAddProtocol ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Maintenance Protocol</Text>
          <TextInput
            style={styles.input}
            placeholder="Protocol Title (e.g. Groin Adductor Squeeze)"
            placeholderTextColor={colors.muted}
            value={protocolTitle}
            onChangeText={setProtocolTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Focus Area (e.g. Pubic Stability)"
            placeholderTextColor={colors.muted}
            value={protocolFocus}
            onChangeText={setProtocolFocus}
          />
          <TextInput
            style={styles.input}
            placeholder="Frequency (e.g. 2x / week)"
            placeholderTextColor={colors.muted}
            value={protocolFrequency}
            onChangeText={setProtocolFrequency}
          />
          <TouchableOpacity
            style={styles.submitBtn}
            disabled={busy}
            onPress={handleAddProtocol}
          >
            <Text style={styles.submitBtnText}>Save Protocol</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Protocol List */}
      {record.rehabProtocols.map((prot: RehabProtocol) => (
        <View key={prot.id} style={styles.protocolCard}>
          <View style={styles.protocolTop}>
            <View style={styles.protocolIconWrap}>
              <Ionicons name="barbell-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.protocolTitle}>{prot.title}</Text>
              <Text style={styles.protocolFocus}>{prot.focus}</Text>
            </View>
            <View style={styles.protocolBadge}>
              <Text style={styles.protocolBadgeText}>{prot.frequency}</Text>
            </View>
          </View>
          <View style={styles.protocolFooter}>
            <Text style={styles.protocolStatusText}>Status: {prot.status}</Text>
            <Text style={styles.protocolRoundsText}>Completed: {prot.completedRounds} rounds</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function ScreeningItem({
  icon,
  title,
  status,
  date,
  verified,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  status: string;
  date: string;
  verified: boolean;
}) {
  return (
    <View style={styles.screeningCard}>
      <View style={styles.screeningTop}>
        <View style={styles.screeningIconWrap}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        {verified ? (
          <View style={styles.verifiedTag}>
            <Ionicons name="checkmark-circle" size={13} color="#15803D" />
            <Text style={styles.verifiedTagText}>Verified</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.screeningTitle}>{title}</Text>
      <Text style={styles.screeningStatus}>{status}</Text>
      <Text style={styles.screeningDate}>Date: {date}</Text>
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

  clearanceCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  clearanceTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clearanceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearanceMeta: { flex: 1 },
  clearanceKicker: { color: '#15803D', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  clearanceTitle: { color: '#052E16', fontSize: 18, fontWeight: '900', marginTop: 2 },
  tierBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  tierBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '800' },

  readinessBarRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  readinessScoreLabel: { color: '#166534', fontSize: 12, fontWeight: '700' },
  readinessScoreValue: { color: '#166534', fontSize: 14, fontWeight: '900' },
  track: { height: 8, backgroundColor: '#DCFCE7', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 4 },

  toggleClearanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  toggleClearanceText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },

  screeningGrid: { gap: 10, marginBottom: 20 },
  screeningCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  screeningTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  screeningIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E5F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedTagText: { color: '#15803D', fontSize: 10, fontWeight: '800' },
  screeningTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 10 },
  screeningStatus: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', marginTop: 2 },
  screeningDate: { color: colors.muted, fontSize: 11, marginTop: 4 },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  formTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginBottom: 2 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.ink,
  },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },

  injuryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  injuryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  injuryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  injuryType: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  injuryBodyPart: { color: colors.muted, fontSize: 12, marginTop: 1 },
  statusPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusPillText: { color: '#15803D', fontSize: 10, fontWeight: '800' },
  injuryMetaRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  injuryMetaText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  physioText: { color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 6 },
  injuryNotesText: { color: colors.ink, fontSize: 12, lineHeight: 17, marginTop: 4, fontStyle: 'italic' },

  protocolCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  protocolTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  protocolIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#E5F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  protocolFocus: { color: colors.muted, fontSize: 12, marginTop: 1 },
  protocolBadge: { backgroundColor: colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  protocolBadgeText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  protocolFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.line },
  protocolStatusText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  protocolRoundsText: { color: colors.muted, fontSize: 11 },
});
