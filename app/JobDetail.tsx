import {
    applicationSteps,
    colors,
    ContractDeal,
    defaultDeals,
    defaultTrialBookings,
    findOpportunity,
    OpportunityStage,
    TrialBooking,
    TrialChecklistItem,
    TrialStatus,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    deleteApplication,
    getPlayerApplications,
    getPlayerDeals,
    getPlayerTrials,
    PlayerApplication,
    rsvpTrialBooking,
    saveApplication,
    scheduleTrialBooking,
    signContractDeal,
    submitDealCounter,
    toggleTrialChecklistItem,
    updateApplicationStage,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const timeSlotOptions = [
  'Morning Session (09:30 - 12:00 CET)',
  'Afternoon Match Assessment (14:30 - 17:00 CET)',
  'Full-Day Academy Trial (09:00 - 17:30 CET)',
];

export default function OpportunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const opportunity = findOpportunity(id);
  const [stage, setStage] = useState<OpportunityStage>(opportunity?.stage ?? 'New');
  const [application, setApplication] = useState<PlayerApplication | null>(null);
  const [trialBooking, setTrialBooking] = useState<TrialBooking | null>(null);
  const [deal, setDeal] = useState<ContractDeal | null>(null);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [counterSalary, setCounterSalary] = useState('4800');
  const [counterNotes, setCounterNotes] = useState('Requesting adjusted monthly wage to account for travel relocation.');
  const [selectedSlot, setSelectedSlot] = useState(timeSlotOptions[0]);
  const [syncNotice, setSyncNotice] = useState('');

  const playerId = currentUser?.id ?? 'demo-player';
  const opportunityId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      if (!opportunityId) return;

      try {
        const [applications, trials, deals] = await Promise.all([
          getPlayerApplications(playerId),
          getPlayerTrials(playerId),
          getPlayerDeals(playerId),
        ]);

        if (ignore) return;

        const foundApplication = applications.find((entry) => entry.opportunityId === opportunityId);
        if (foundApplication) {
          setApplication(foundApplication);
          setStage(foundApplication.stage);
        }

        const foundTrial = trials.find((t) => t.opportunityId === opportunityId);
        if (foundTrial) {
          setTrialBooking(foundTrial);
          setSelectedSlot(foundTrial.timeSlot || timeSlotOptions[0]);
        } else if (opportunity?.stage === 'Trial booked') {
          setTrialBooking(defaultTrialBookings[0]);
        }

        const foundDeal = deals.find((d) => d.opportunityId === opportunityId);
        if (foundDeal) {
          setDeal(foundDeal);
        } else if (opportunity?.stage === 'Offer talks') {
          setDeal(defaultDeals[0]);
        }
      } catch {
        if (!ignore && opportunity?.stage === 'Trial booked') {
          setTrialBooking(defaultTrialBookings[0]);
        }
        if (!ignore && opportunity?.stage === 'Offer talks') {
          setDeal(defaultDeals[0]);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [playerId, opportunityId, opportunity?.stage]);

  if (!opportunity) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ headerShown: false }} />
        <Ionicons name="alert-circle-outline" size={34} color={colors.red} />
        <Text style={styles.notFoundTitle}>Opportunity not found</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const applied = stage === 'Applied' || stage === 'Trial booked' || stage === 'Offer talks';

  const saveStage = async (nextStage: OpportunityStage) => {
    const playerId = currentUser?.id ?? 'demo-player';
    const previousStage = stage;
    setStage(nextStage);

    try {
      if (nextStage === 'New' && application) {
        await deleteApplication(playerId, application.id);
        setApplication(null);
        setSyncNotice('Opportunity removed from your saved board');
        return;
      }

      if (application) {
        const updatedApplication = await updateApplicationStage(playerId, application.id, nextStage);
        setApplication(updatedApplication);
      } else {
        const createdApplication = await saveApplication(playerId, opportunity.id, nextStage);
        setApplication(createdApplication);
      }

      setSyncNotice(`${nextStage} saved to API`);
    } catch {
      setStage(previousStage);
      setSyncNotice('Could not sync this action. Try again when the API is running.');
    }
  };

  const handleBookTrialSlot = async () => {
    try {
      const booked = await scheduleTrialBooking(playerId, {
        opportunityId: opportunity.id,
        club: opportunity.club,
        trialDate: opportunity.trialDate,
        timeSlot: selectedSlot,
        location: `${opportunity.city}, ${opportunity.country}`,
        scoutContact: opportunity.scout,
        notes: `Selected slot: ${selectedSlot}`,
      });
      setTrialBooking(booked);
      await saveStage('Trial booked');
      setSyncNotice('Trial booking confirmed with club recruitment desk!');
    } catch {
      setSyncNotice('Could not schedule trial. Please try again.');
    }
  };

  const handleRSVP = async (status: TrialStatus) => {
    if (!trialBooking) return;
    try {
      const updated = await rsvpTrialBooking(playerId, trialBooking.id, {
        status,
        reason: status === 'Confirmed' ? 'Confirmed attendance by player' : 'Reschedule requested by player',
      });
      setTrialBooking(updated);
      setSyncNotice(`Trial RSVP updated to: ${status}`);
    } catch {
      setSyncNotice('Could not update RSVP status.');
    }
  };

  const handleToggleChecklist = async (item: TrialChecklistItem) => {
    if (!trialBooking) return;
    try {
      const updated = await toggleTrialChecklistItem(playerId, trialBooking.id, item.id, !item.completed);
      setTrialBooking(updated);
    } catch {
      setTrialBooking((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          checklist: prev.checklist.map((c) => (c.id === item.id ? { ...c, completed: !c.completed } : c)),
        };
      });
    }
  };

  const handleCounterOffer = async () => {
    if (!deal || !counterSalary) return;
    try {
      const updated = await submitDealCounter(playerId, deal.id, {
        counterSalaryMonthly: Number(counterSalary),
        notes: counterNotes,
      });
      setDeal(updated);
      setShowCounterModal(false);
      setSyncNotice(`Counter-offer of €${counterSalary}/mo submitted to club recruitment desk.`);
    } catch {
      setSyncNotice('Could not submit counter-offer. Please check your connection.');
    }
  };

  const handleSignDeal = async () => {
    if (!deal) return;
    try {
      const signed = await signContractDeal(playerId, deal.id, {
        signature: `${currentUser?.name || 'Alex Rivera'} (Verified Digital Signature)`,
        confirmationNotes: 'Official contract terms accepted and digitally executed.',
      });
      setDeal(signed);
      await saveStage('Offer talks');
      setSyncNotice('Contract officially signed and registered with club registry!');
    } catch {
      setSyncNotice('Could not sign contract deal.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, stage === 'Saved' && styles.iconButtonActive]}
              onPress={() => saveStage(stage === 'Saved' ? 'New' : 'Saved')}
            >
              <Ionicons
                name={stage === 'Saved' ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={stage === 'Saved' ? '#FFFFFF' : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.clubMark}>
            <Text style={styles.clubMarkText}>{opportunity.club.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.kicker}>{opportunity.league}</Text>
          <Text style={styles.title}>{opportunity.club}</Text>
          <Text style={styles.role}>{opportunity.position}</Text>
          <Text style={styles.description}>{opportunity.description}</Text>

          <View style={styles.fitRow}>
            <View style={styles.fitBox}>
              <Text style={styles.fitValue}>{opportunity.fit}%</Text>
              <Text style={styles.fitLabel}>profile fit</Text>
            </View>
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Status</Text>
              <Text style={styles.statusValue}>{stage}</Text>
            </View>
          </View>
        </View>

        {/* Interactive Trial Scheduling & Scout RSVP Portal */}
        <View style={styles.trialPortalCard}>
          <View style={styles.portalHeader}>
            <View style={styles.portalIcon}>
              <Ionicons name="calendar" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.portalKicker}>Recruitment Schedule</Text>
              <Text style={styles.portalTitle}>Trial Invitation & RSVP</Text>
            </View>
            <View
              style={[
                styles.rsvpStatusBadge,
                trialBooking?.status === 'Confirmed' ? styles.badgeConfirmed : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.rsvpStatusText,
                  trialBooking?.status === 'Confirmed' ? styles.badgeTextConfirmed : styles.badgeTextPending,
                ]}
              >
                {trialBooking?.status || 'Slot Available'}
              </Text>
            </View>
          </View>

          <Text style={styles.portalMeta}>
            Trial Date: <Text style={{ fontWeight: '800', color: colors.ink }}>{opportunity.trialDate}</Text> • {opportunity.city}
          </Text>

          {/* Time Slot Selector */}
          <Text style={styles.slotSelectLabel}>Select Trial Time Slot</Text>
          <View style={styles.slotGrid}>
            {timeSlotOptions.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={isSelected ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RSVP Action Buttons */}
          <View style={styles.rsvpActionRow}>
            <TouchableOpacity
              style={[styles.rsvpBtn, styles.rsvpConfirmBtn]}
              onPress={() => (trialBooking ? handleRSVP('Confirmed') : handleBookTrialSlot())}
            >
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
              <Text style={styles.rsvpBtnText}>
                {trialBooking?.status === 'Confirmed' ? 'Attendance Confirmed' : 'Confirm Slot'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.rsvpBtn, styles.rsvpRescheduleBtn]}
              onPress={() => handleRSVP('Rescheduled')}
            >
              <Ionicons name="time-outline" size={16} color={colors.accent} />
              <Text style={[styles.rsvpBtnText, { color: colors.accent }]}>Reschedule</Text>
            </TouchableOpacity>
          </View>

          {/* Travel & Performance Logistics Checklist */}
          {trialBooking?.checklist ? (
            <View style={styles.checklistSection}>
              <View style={styles.checklistHeader}>
                <Text style={styles.checklistTitle}>Trial Day Logistics & Checklist</Text>
                <Text style={styles.checklistProgress}>
                  {trialBooking.checklist.filter((c) => c.completed).length} / {trialBooking.checklist.length} Complete
                </Text>
              </View>

              {trialBooking.checklist.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.checkItemRow}
                  onPress={() => handleToggleChecklist(item)}
                >
                  <Ionicons
                    name={item.completed ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={item.completed ? colors.primary : colors.muted}
                  />
                  <Text style={[styles.checkItemText, item.completed && styles.checkItemTextDone]}>
                    {item.title}
                  </Text>
                  {item.required ? (
                    <View style={styles.requiredTag}>
                      <Text style={styles.requiredTagText}>Required</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>

        {/* Contract Offer & Negotiation Deal Room Card */}
        {deal ? (
          <View style={styles.dealPortalCard}>
            <View style={styles.portalHeader}>
              <View style={[styles.portalIcon, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                <Ionicons name="document-text" size={22} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.portalKicker}>Formal Recruitment Offer</Text>
                <Text style={styles.portalTitle}>Contract Terms Sheet</Text>
              </View>
              <View
                style={[
                  styles.rsvpStatusBadge,
                  deal.status === 'Signed'
                    ? styles.badgeConfirmed
                    : deal.status === 'Countered'
                    ? styles.badgePending
                    : styles.badgeOffered,
                ]}
              >
                <Text
                  style={[
                    styles.rsvpStatusText,
                    deal.status === 'Signed'
                      ? styles.badgeTextConfirmed
                      : deal.status === 'Countered'
                      ? styles.badgeTextPending
                      : styles.badgeTextOffered,
                  ]}
                >
                  {deal.status}
                </Text>
              </View>
            </View>

            <Text style={styles.dealTypeTitle}>{deal.contractType}</Text>
            <Text style={styles.portalMeta}>
              Duration: <Text style={{ fontWeight: '800', color: colors.ink }}>{deal.durationYears} Years</Text> • Representative: {deal.scoutContact}
            </Text>

            {/* Financial Breakdown Grid */}
            <View style={styles.dealFinancialGrid}>
              <View style={styles.financialCard}>
                <Text style={styles.financialVal}>€{deal.baseSalaryMonthly.toLocaleString()}/mo</Text>
                <Text style={styles.financialLbl}>Base Salary</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialVal}>€{deal.signingBonus.toLocaleString()}</Text>
                <Text style={styles.financialLbl}>Signing Bonus</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialVal}>€{deal.housingStipendMonthly}/mo</Text>
                <Text style={styles.financialLbl}>Housing Stipend</Text>
              </View>
              <View style={styles.financialCard}>
                <Text style={styles.financialVal}>€{deal.financials?.projectedTotal.toLocaleString() || '140,000'}</Text>
                <Text style={styles.financialLbl}>Projected Value</Text>
              </View>
            </View>

            {/* Negotiation History Log */}
            {deal.negotiationHistory && deal.negotiationHistory.length > 0 ? (
              <View style={styles.negotiationHistorySection}>
                <Text style={styles.historyTitle}>Negotiation Audit Trail</Text>
                {deal.negotiationHistory.map((entry) => (
                  <View key={entry.id} style={styles.historyRow}>
                    <View style={styles.historyDot} />
                    <View style={{ flex: 1 }}>
                      <View style={styles.historyTopLine}>
                        <Text style={styles.historyAction}>{entry.action}</Text>
                        <Text style={styles.historyAuthor}>{entry.author}</Text>
                      </View>
                      <Text style={styles.historyNotes}>{entry.notes}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Counter Offer Modal / Expandable Form */}
            {showCounterModal ? (
              <View style={styles.counterForm}>
                <Text style={styles.counterFormTitle}>Submit Contract Counter-Proposal</Text>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Requested Monthly Wage (€):</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={counterSalary}
                    onChangeText={setCounterSalary}
                    keyboardType="numeric"
                    placeholder="e.g. 4800"
                  />
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Negotiation Notes / Clauses:</Text>
                  <TextInput
                    style={[styles.fieldInput, { height: 60 }]}
                    value={counterNotes}
                    onChangeText={setCounterNotes}
                    multiline
                    placeholder="Enter bonus requests or release clause adjustments..."
                  />
                </View>
                <View style={styles.counterActionRow}>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => setShowCounterModal(false)}
                  >
                    <Text style={[styles.counterBtnText, { color: colors.muted }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.counterBtn, { backgroundColor: colors.primary }]}
                    onPress={handleCounterOffer}
                  >
                    <Text style={styles.counterBtnText}>Submit Counter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* Deal Action Buttons */}
            {deal.status !== 'Signed' ? (
              <View style={styles.dealActionRow}>
                <TouchableOpacity
                  style={[styles.dealBtn, styles.dealSignBtn]}
                  onPress={handleSignDeal}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.dealBtnText}>Accept & Sign Deal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dealBtn, styles.dealCounterBtn]}
                  onPress={() => setShowCounterModal(!showCounterModal)}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color={colors.accent} />
                  <Text style={[styles.dealBtnText, { color: colors.accent }]}>
                    {showCounterModal ? 'Close Form' : 'Counter Terms'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.signedBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#15803D" />
                <Text style={styles.signedBannerText}>
                  Digitally Executed: {deal.signature || 'Alex Rivera (Verified)'}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.infoGrid}>
          <DetailItem icon="location-outline" label="Location" value={`${opportunity.city}, ${opportunity.country}`} />
          <DetailItem icon="calendar-outline" label="Trial date" value={opportunity.trialDate} />
          <DetailItem icon="hourglass-outline" label="Deadline" value={opportunity.deadline} />
          <DetailItem icon="people-outline" label="Age band" value={opportunity.ageBand} />
          <DetailItem icon="document-text-outline" label="Contract" value={opportunity.contract} />
          <DetailItem icon="card-outline" label="Compensation" value={opportunity.compensation} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scout contact</Text>
          <View style={styles.scoutRow}>
            <View style={styles.scoutIcon}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.scoutCopy}>
              <Text style={styles.scoutName}>{opportunity.scout}</Text>
              <Text style={styles.scoutText}>Verified recruitment contact for this opportunity.</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {opportunity.requirements.map((requirement) => (
            <View key={requirement} style={styles.checkRow}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.checkText}>{requirement}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Club perks</Text>
          <View style={styles.tagRow}>
            {opportunity.perks.map((perk) => (
              <Text key={perk} style={styles.tag}>{perk}</Text>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Application timeline</Text>
          {applicationSteps.map((step, index) => {
            const isDone = applied ? step.done || index <= 2 : step.done;
            return (
              <View key={step.label} style={styles.timelineRow}>
                <View style={[styles.timelineDot, isDone && styles.timelineDotDone]}>
                  {isDone ? <Ionicons name="checkmark" size={12} color="#FFFFFF" /> : null}
                </View>
                <Text style={[styles.timelineText, isDone && styles.timelineTextDone]}>{step.label}</Text>
              </View>
            );
          })}
        </View>

        {syncNotice ? (
          <View style={styles.notice}>
            <Ionicons name="cloud-done-outline" size={18} color={colors.primary} />
            <Text style={styles.noticeText}>{syncNotice}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, applied && styles.appliedButton]}
          onPress={() => saveStage(applied ? stage : 'Applied')}
        >
          <Text style={[styles.primaryButtonText, applied && styles.appliedButtonText]}>
            {applied ? 'Application sent' : 'Apply for this opportunity'}
          </Text>
          <Ionicons
            name={applied ? 'checkmark-circle' : 'send-outline'}
            size={18}
            color={applied ? colors.primary : '#FFFFFF'}
          />
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  heroCard: {
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 18,
  },
  clubMark: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  clubMarkText: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: '900',
  },
  kicker: {
    color: '#E8C77C',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  role: {
    color: '#DDE8D8',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  description: {
    color: '#E6EEE4',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
  },
  fitRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  fitBox: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
  },
  statusBox: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 12,
  },
  fitValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  fitLabel: {
    color: '#DDE8D8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  statusLabel: {
    color: '#DDE8D8',
    fontSize: 12,
    fontWeight: '800',
  },
  statusValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 5,
  },
  trialPortalCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  portalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  portalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  portalTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  rsvpStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeConfirmed: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rsvpStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextConfirmed: {
    color: '#15803D',
  },
  badgeTextPending: {
    color: '#D97706',
  },
  portalMeta: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 14,
  },
  slotSelectLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  slotGrid: {
    gap: 8,
    marginBottom: 14,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  slotItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: colors.primary,
  },
  slotItemText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  slotItemTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  rsvpActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  rsvpBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rsvpConfirmBtn: {
    backgroundColor: colors.primary,
  },
  rsvpRescheduleBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  rsvpBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  checklistSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    gap: 10,
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  checklistProgress: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  checkItemText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  checkItemTextDone: {
    color: colors.muted,
    textDecorationLine: 'line-through',
  },
  requiredTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredTagText: {
    color: colors.red,
    fontSize: 10,
    fontWeight: '800',
  },
  infoGrid: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  detailItem: {
    width: '48.5%',
    minHeight: 116,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  detailValue: {
    color: colors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '900',
    marginTop: 4,
  },
  section: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  scoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutCopy: {
    flex: 1,
  },
  scoutName: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 14,
  },
  scoutText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 9,
  },
  checkText: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 34,
  },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timelineText: {
    color: colors.muted,
    fontWeight: '800',
    fontSize: 14,
  },
  timelineTextDone: {
    color: colors.ink,
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notice: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  appliedButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  appliedButtonText: {
    color: colors.primary,
  },
  secondaryButton: {
    marginTop: 18,
    minHeight: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  notFound: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 10,
  },
  dealPortalCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeOffered: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  badgeTextOffered: {
    color: '#2563EB',
  },
  dealTypeTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  dealFinancialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 14,
  },
  financialCard: {
    width: '48.5%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
  },
  financialVal: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  financialLbl: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  negotiationHistorySection: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    paddingTop: 12,
    marginBottom: 14,
    gap: 8,
  },
  historyTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  historyRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  historyTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyAction: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  historyAuthor: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  historyNotes: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  counterForm: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  counterFormTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  fieldRow: {
    gap: 4,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  fieldInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  counterActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  counterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  counterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  dealActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dealBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dealSignBtn: {
    backgroundColor: colors.primary,
  },
  dealCounterBtn: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  dealBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  signedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  signedBannerText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
});
