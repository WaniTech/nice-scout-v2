import {
    ClubMandate,
    colors,
    defaultTransferReport,
    PitchSubmission,
    TransferReport,
    TransferStatus
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import {
    getPlayerTransferReport,
    submitClubMandatePitch,
    updatePlayerTransferStatus,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const transferStatuses: TransferStatus[] = [
  'Free Agent',
  'Under Contract',
  'Loan Listed',
  'Transfer Listed',
  'Academy Prospect',
];

const filterTabs = ['All Mandates', 'High Fit (90%+)', 'Eredivisie', 'Superliga', 'Verified Only'];

export default function TransferMarketScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { subscribe, on } = useSocket();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState<TransferReport>(defaultTransferReport);
  const [selectedFilter, setSelectedFilter] = useState('All Mandates');
  const [selectedMandateForPitch, setSelectedMandateForPitch] = useState<ClubMandate | null>(null);
  const [pitchMessage, setPitchMessage] = useState('');
  const [attachedClips, setAttachedClips] = useState(2);
  const [pitchModalVisible, setPitchModalVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPlayerTransferReport(playerId)
      .then((data) => {
        if (active && data?.valuation) {
          setReport(data);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [playerId]);

  useEffect(() => {
    subscribe(`player:${playerId}`);

    const cleanupPitch = on('mandate_pitch_submitted', (payload: unknown) => {
      const data = payload as { pitch?: PitchSubmission };
      if (data?.pitch) {
        setReport((prev) => ({
          ...prev,
          pitches: [data.pitch!, ...(prev.pitches || []).filter((p) => p.id !== data.pitch!.id)],
        }));
      }
    });

    const cleanupStatus = on('transfer_status_updated', (payload: unknown) => {
      const data = payload as { transfer?: TransferReport };
      if (data?.transfer) {
        setReport((prev) => ({
          ...prev,
          transferStatus: data.transfer!.transferStatus,
          contractExpiry: data.transfer!.contractExpiry,
          releaseClauseEur: data.transfer!.releaseClauseEur,
        }));
      }
    });

    return () => {
      cleanupPitch();
      cleanupStatus();
    };
  }, [playerId, subscribe, on]);

  const handleStatusChange = async (status: TransferStatus) => {
    try {
      const updated = await updatePlayerTransferStatus(playerId, { transferStatus: status });
      setReport((prev) => ({
        ...prev,
        transferStatus: updated.transferStatus,
      }));
      Alert.alert('Status Updated', `Your transfer market listing status is now: ${status}`);
    } catch {
      Alert.alert('Error', 'Could not update transfer listing status.');
    }
  };

  const openPitchModal = (mandate: ClubMandate) => {
    setSelectedMandateForPitch(mandate);
    setPitchMessage(
      `Player dossier for ${mandate.club} scouting recruitment mandate. Top sprint speed 33.8 km/h, verified EU passport, and match analysis attached.`
    );
    setAttachedClips(2);
    setPitchModalVisible(true);
  };

  const handleSendPitch = async () => {
    if (!selectedMandateForPitch) return;
    setBusy(true);
    try {
      const pitch = await submitClubMandatePitch(playerId, selectedMandateForPitch.id, {
        message: pitchMessage,
        attachedClipCount: attachedClips,
      });

      setReport((prev) => ({
        ...prev,
        pitches: [pitch, ...(prev.pitches || []).filter((p) => p.id !== pitch.id)],
      }));

      setPitchModalVisible(false);
      setSelectedMandateForPitch(null);
      Alert.alert('Dossier Submitted', `Your pitch was successfully delivered to ${selectedMandateForPitch.club}!`);
    } catch {
      Alert.alert('Error', 'Failed to submit pitch. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const { valuation, mandates, pitches, transferStatus } = report;

  const filteredMandates = (mandates || []).filter((m) => {
    if (selectedFilter === 'High Fit (90%+)') return m.fitScore >= 90;
    if (selectedFilter === 'Eredivisie') return m.league === 'Eredivisie';
    if (selectedFilter === 'Superliga') return m.league === 'Danish Superliga';
    if (selectedFilter === 'Verified Only') return m.verifiedMandate;
    return true;
  });

  const formatEur = (val: number) => {
    return '€' + val.toLocaleString();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.kicker}>Transfer Market Engine</Text>
          <Text style={styles.title}>Valuation & Club Mandates</Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name="trending-up" size={14} color={colors.primary} />
          <Text style={styles.statusPillText}>{transferStatus}</Text>
        </View>
      </View>

      {/* Market Valuation Overview Card */}
      <View style={styles.valuationCard}>
        <View style={styles.valuationHeaderRow}>
          <View>
            <Text style={styles.valuationKicker}>Algorithmic Transfer Valuation</Text>
            <Text style={styles.valuationAmount}>{formatEur(valuation?.estimatedValueEur || 185000)}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{valuation?.marketTier || 'High Potential U21'}</Text>
          </View>
        </View>

        <View style={styles.valuationRangeRow}>
          <Text style={styles.rangeLabel}>
            Estimated Bracket:{' '}
            <Text style={styles.rangeValue}>
              {formatEur(valuation?.valueRangeMinEur || 150000)} – {formatEur(valuation?.valueRangeMaxEur || 230000)}
            </Text>
          </Text>
          <View style={styles.demandWrap}>
            <Ionicons name="flame" size={14} color="#FF7A00" />
            <Text style={styles.demandText}>Demand Index: {valuation?.demandIndex || 88}/100</Text>
          </View>
        </View>

        {/* Valuation Growth Timeline */}
        <View style={styles.growthContainer}>
          <Text style={styles.sectionSubtitle}>Valuation Growth Timeline</Text>
          <View style={styles.growthTimeline}>
            {(valuation?.historicalGrowth || []).map((point, idx) => (
              <View key={idx} style={styles.growthPoint}>
                <View style={styles.growthDot} />
                <Text style={styles.growthValue}>{formatEur(point.valueEur)}</Text>
                <Text style={styles.growthDate}>{point.date}</Text>
                <Text style={styles.growthMilestone} numberOfLines={1}>
                  {point.milestone}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Key Valuation Drivers Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="stats-chart" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Valuation Factor Breakdown</Text>
        </View>

        {(valuation?.valuationFactors || []).map((factor, idx) => (
          <View key={idx} style={styles.factorRow}>
            <View style={styles.factorMain}>
              <View style={styles.factorTitleRow}>
                <Text style={styles.factorName}>{factor.name}</Text>
                <View style={[styles.impactBadge, factor.impact === 'High' ? styles.impactHigh : styles.impactMed]}>
                  <Text style={styles.impactText}>{factor.impact} Impact</Text>
                </View>
              </View>
              <Text style={styles.factorDesc}>{factor.description}</Text>
            </View>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreNumber}>{factor.score}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Transfer Status Switcher */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="swap-horizontal" size={18} color={colors.primary} />
          <Text style={styles.sectionTitle}>Transfer Listing Status</Text>
        </View>
        <Text style={styles.sectionHelper}>
          Select your current contract availability for scouts and recruitment directors:
        </Text>
        <View style={styles.statusButtonsGrid}>
          {transferStatuses.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusSelectBtn, transferStatus === st && styles.statusSelectBtnActive]}
              onPress={() => handleStatusChange(st)}
            >
              <Text style={[styles.statusSelectText, transferStatus === st && styles.statusSelectTextActive]}>
                {st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Active Club Recruitment Mandates */}
      <View style={styles.mandatesSection}>
        <View style={styles.mandatesHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Club Recruitment Mandates</Text>
            <Text style={styles.sectionHelper}>Verified club searches matching your tactical profile</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.filterTab, selectedFilter === tab && styles.filterTabActive]}
              onPress={() => setSelectedFilter(tab)}
            >
              <Text style={[styles.filterTabText, selectedFilter === tab && styles.filterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Mandates List */}
        {filteredMandates.map((mandate) => {
          const isPitched = (pitches || []).some((p) => p.mandateId === mandate.id);
          return (
            <View key={mandate.id} style={styles.mandateCard}>
              <View style={styles.mandateTopRow}>
                <View style={styles.clubInfo}>
                  <View style={styles.clubHeader}>
                    <Text style={styles.clubName}>{mandate.club}</Text>
                    {mandate.verifiedMandate && (
                      <Ionicons name="checkmark-circle" size={16} color="#00875A" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  <Text style={styles.leagueText}>
                    {mandate.league} • {mandate.country}
                  </Text>
                  <Text style={styles.scoutText}>
                    Scout: {mandate.scoutName} ({mandate.scoutRole})
                  </Text>
                </View>

                <View style={styles.fitScoreBadge}>
                  <Text style={styles.fitScoreText}>{mandate.fitScore}%</Text>
                  <Text style={styles.fitScoreLabel}>Profile Fit</Text>
                </View>
              </View>

              <View style={styles.mandateDetailsGrid}>
                <View style={styles.mandateDetailItem}>
                  <Text style={styles.detailLabel}>Target Role</Text>
                  <Text style={styles.detailValue}>{mandate.targetPosition}</Text>
                </View>
                <View style={styles.mandateDetailItem}>
                  <Text style={styles.detailLabel}>Budget Bracket</Text>
                  <Text style={styles.detailValue}>{mandate.budgetBracket}</Text>
                </View>
                <View style={styles.mandateDetailItem}>
                  <Text style={styles.detailLabel}>Age Requirement</Text>
                  <Text style={styles.detailValue}>{mandate.preferredAgeRange}</Text>
                </View>
                <View style={styles.mandateDetailItem}>
                  <Text style={styles.detailLabel}>Passport / Clearance</Text>
                  <Text style={styles.detailValue}>{mandate.passportRequirement}</Text>
                </View>
              </View>

              <View style={styles.tacticalBox}>
                <Text style={styles.tacticalLabel}>Tactical Search Spec:</Text>
                <Text style={styles.tacticalText}>{mandate.tacticalProfile}</Text>
              </View>

              <View style={styles.factorTagsWrap}>
                {(mandate.matchFactors || []).map((factor, fIdx) => (
                  <View key={fIdx} style={styles.factorTag}>
                    <Ionicons name="checkmark" size={12} color={colors.primary} />
                    <Text style={styles.factorTagText}>{factor}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.mandateFooterRow}>
                <Text style={styles.deadlineText}>Deadline: {mandate.deadline}</Text>
                <TouchableOpacity
                  style={[styles.pitchBtn, isPitched && styles.pitchBtnPitched]}
                  onPress={() => openPitchModal(mandate)}
                >
                  <Ionicons
                    name={isPitched ? 'checkmark-done' : 'paper-plane'}
                    size={15}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.pitchBtnText}>{isPitched ? 'Pitch Again' : 'Pitch Dossier'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Active Pitch Submissions List */}
      {(pitches || []).length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="document-text" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Submitted Club Pitches</Text>
          </View>
          {(pitches || []).map((p) => (
            <View key={p.id} style={styles.pitchItem}>
              <View style={styles.pitchItemHeader}>
                <Text style={styles.pitchClub}>{p.club}</Text>
                <View style={styles.pitchStatusBadge}>
                  <Text style={styles.pitchStatusText}>{p.status}</Text>
                </View>
              </View>
              <Text style={styles.pitchMsg}>{p.message}</Text>
              <View style={styles.pitchMetaRow}>
                <Text style={styles.pitchDate}>{new Date(p.pitchDate).toLocaleDateString()}</Text>
                <Text style={styles.pitchClips}>{p.attachedClipCount} clips attached</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pitch Modal */}
      <Modal visible={pitchModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pitch Dossier to {selectedMandateForPitch?.club}</Text>
              <TouchableOpacity onPress={() => setPitchModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.ink} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelper}>
              Send your verified profile, GPS metrics, and scout video highlights directly to{' '}
              {selectedMandateForPitch?.scoutName} ({selectedMandateForPitch?.scoutRole}).
            </Text>

            <Text style={styles.inputLabel}>Cover Message / Scout Note:</Text>
            <TextInput
              style={styles.messageInput}
              multiline
              numberOfLines={4}
              value={pitchMessage}
              onChangeText={setPitchMessage}
              placeholder="Write a message highlighting your readiness and tactical fit..."
            />

            <View style={styles.clipsSelectorRow}>
              <Text style={styles.clipsLabel}>Attach Verified Performance Reels:</Text>
              <View style={styles.clipCounter}>
                <TouchableOpacity
                  style={styles.clipCountBtn}
                  onPress={() => setAttachedClips((c) => Math.max(1, c - 1))}
                >
                  <Ionicons name="remove" size={16} color={colors.ink} />
                </TouchableOpacity>
                <Text style={styles.clipCountText}>{attachedClips} Reels</Text>
                <TouchableOpacity
                  style={styles.clipCountBtn}
                  onPress={() => setAttachedClips((c) => Math.min(5, c + 1))}
                >
                  <Ionicons name="add" size={16} color={colors.ink} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPitchModalVisible(false)}
                disabled={busy}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitPitchBtn}
                onPress={handleSendPitch}
                disabled={busy}
              >
                <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.submitPitchBtnText}>{busy ? 'Submitting...' : 'Send Pitch'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6F8',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTextWrap: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CEEAD6',
    gap: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  valuationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  valuationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  valuationKicker: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  valuationAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: '#EFF6FF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  valuationRangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rangeLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  rangeValue: {
    fontWeight: '700',
    color: '#1E293B',
  },
  demandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  demandText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
  },
  growthContainer: {
    marginTop: 14,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 10,
  },
  growthTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  growthPoint: {
    alignItems: 'center',
    flex: 1,
  },
  growthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginBottom: 4,
  },
  growthValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  growthDate: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  growthMilestone: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionHelper: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  factorMain: {
    flex: 1,
    paddingRight: 12,
  },
  factorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  factorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  impactBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  impactHigh: {
    backgroundColor: '#FEF2F2',
  },
  impactMed: {
    backgroundColor: '#FFFBEB',
  },
  impactText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B91C1C',
  },
  factorDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  scoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  statusButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusSelectBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusSelectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  statusSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mandatesSection: {
    marginBottom: 16,
  },
  mandatesHeaderRow: {
    marginBottom: 8,
  },
  filterScroll: {
    marginBottom: 14,
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  mandateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mandateTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clubName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  leagueText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  scoutText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  fitScoreBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  fitScoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  fitScoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  mandateDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  mandateDetailItem: {
    width: '48%',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  tacticalBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  tacticalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 2,
  },
  tacticalText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  factorTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  factorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  factorTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2E7D32',
  },
  mandateFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  deadlineText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  pitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  pitchBtnPitched: {
    backgroundColor: '#059669',
  },
  pitchBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pitchItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pitchItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pitchClub: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pitchStatusBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pitchStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  pitchMsg: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 6,
  },
  pitchMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pitchDate: {
    fontSize: 11,
    color: '#94A3B8',
  },
  pitchClips: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  modalHelper: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  messageInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 13,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 90,
    marginBottom: 16,
  },
  clipsSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  clipsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  clipCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clipCountBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitPitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  submitPitchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
