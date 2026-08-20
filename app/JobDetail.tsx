import { applicationSteps, colors, findOpportunity, OpportunityStage } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteApplication,
  getPlayerApplications,
  PlayerApplication,
  saveApplication,
  updateApplicationStage,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function OpportunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const opportunity = findOpportunity(id);
  const [stage, setStage] = useState<OpportunityStage>(opportunity?.stage ?? 'New');
  const [application, setApplication] = useState<PlayerApplication | null>(null);
  const [syncNotice, setSyncNotice] = useState('');

  useEffect(() => {
    let ignore = false;
    const playerId = currentUser?.id ?? 'demo-player';
    const opportunityId = Array.isArray(id) ? id[0] : id;

    async function loadApplication() {
      if (!opportunityId) {
        return;
      }

      try {
        const applications = await getPlayerApplications(playerId);
        const foundApplication = applications.find((entry) => entry.opportunityId === opportunityId);

        if (!ignore && foundApplication) {
          setApplication(foundApplication);
          setStage(foundApplication.stage);
        }
      } catch {
        if (!ignore) {
          setSyncNotice('Showing local detail while API is unavailable');
        }
      }
    }

    loadApplication();

    return () => {
      ignore = true;
    };
  }, [currentUser?.id, id]);

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
});
