import { colors, opportunities, OpportunityStage } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
  deleteApplication,
  getOpportunities,
  getPlayerApplications,
  PlayerApplication,
  saveApplication,
  updateApplicationStage,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const filters: ('All' | OpportunityStage)[] = ['All', 'Applied', 'Saved', 'Trial booked', 'New'];

export default function TrialsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [boardOpportunities, setBoardOpportunities] = useState(opportunities);
  const [applications, setApplications] = useState<PlayerApplication[]>([]);
  const [syncNotice, setSyncNotice] = useState('');
  const [stages, setStages] = useState<Record<string, OpportunityStage>>(
    Object.fromEntries(opportunities.map((opportunity) => [opportunity.id, opportunity.stage])),
  );

  useEffect(() => {
    let ignore = false;
    const playerId = currentUser?.id ?? 'demo-player';

    async function loadBoard() {
      try {
        const [remoteOpportunities, remoteApplications] = await Promise.all([
          getOpportunities(),
          getPlayerApplications(playerId),
        ]);

        if (ignore) {
          return;
        }

        const remoteStages = Object.fromEntries(
          remoteOpportunities.map((opportunity) => {
            const application = remoteApplications.find((entry) => entry.opportunityId === opportunity.id);
            return [opportunity.id, application?.stage ?? 'New'];
          }),
        ) as Record<string, OpportunityStage>;

        setBoardOpportunities(remoteOpportunities);
        setApplications(remoteApplications);
        setStages(remoteStages);
        setSyncNotice('Synced with API');
      } catch {
        if (!ignore) {
          setSyncNotice('Using local demo data while API is unavailable');
        }
      }
    }

    loadBoard();

    return () => {
      ignore = true;
    };
  }, [currentUser?.id]);

  const filteredOpportunities = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return boardOpportunities.filter((opportunity) => {
      const stage = stages[opportunity.id] ?? 'New';
      const matchesFilter = activeFilter === 'All' || stage === activeFilter;
      const matchesQuery =
        !query ||
        [
          opportunity.club,
          opportunity.league,
          opportunity.position,
          opportunity.city,
          opportunity.country,
          opportunity.tags.join(' '),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, boardOpportunities, searchText, stages]);

  const updateStage = async (id: string, nextStage: OpportunityStage) => {
    const playerId = currentUser?.id ?? 'demo-player';
    const previousStage = stages[id] ?? 'New';
    const existingApplication = applications.find((application) => application.opportunityId === id);

    setStages((previousStages) => ({ ...previousStages, [id]: nextStage }));

    try {
      if (nextStage === 'New' && existingApplication) {
        await deleteApplication(playerId, existingApplication.id);
        setApplications((previousApplications) =>
          previousApplications.filter((application) => application.id !== existingApplication.id),
        );
        setSyncNotice('Opportunity removed from your board');
        return;
      }

      if (existingApplication) {
        const updatedApplication = await updateApplicationStage(playerId, existingApplication.id, nextStage);
        setApplications((previousApplications) =>
          previousApplications.map((application) =>
            application.id === updatedApplication.id ? updatedApplication : application,
          ),
        );
      } else {
        const createdApplication = await saveApplication(playerId, id, nextStage);
        setApplications((previousApplications) => [...previousApplications, createdApplication]);
      }

      setSyncNotice(`${nextStage} saved to API`);
    } catch {
      setStages((previousStages) => ({ ...previousStages, [id]: previousStage }));
      setSyncNotice('Could not sync this action. Try again when the API is running.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Opportunity board</Text>
        <Text style={styles.title}>Trials and contracts</Text>
        <Text style={styles.subtitle}>
          Track every club lead from first save to offer conversation.
        </Text>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by club, league, country..."
          placeholderTextColor="#899188"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filters.map((filter) => {
          const selected = filter === activeFilter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextActive]}>{filter}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Object.values(stages).filter((stage) => stage === 'Applied').length}
          </Text>
          <Text style={styles.summaryLabel}>Applied</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>
            {Object.values(stages).filter((stage) => stage === 'Trial booked').length}
          </Text>
          <Text style={styles.summaryLabel}>Trials</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{boardOpportunities.length}</Text>
          <Text style={styles.summaryLabel}>Total leads</Text>
        </View>
      </View>

      {syncNotice ? (
        <View style={styles.syncNotice}>
          <Ionicons name="cloud-done-outline" size={16} color={colors.primary} />
          <Text style={styles.syncNoticeText}>{syncNotice}</Text>
        </View>
      ) : null}

      {filteredOpportunities.map((opportunity) => {
        const stage = stages[opportunity.id] ?? 'New';
        const applied = stage === 'Applied' || stage === 'Trial booked' || stage === 'Offer talks';
        const saved = stage === 'Saved';

        return (
          <TouchableOpacity
            key={opportunity.id}
            style={styles.opportunityCard}
            onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
          >
            <View style={styles.cardTop}>
              <View style={styles.clubMark}>
                <Text style={styles.clubMarkText}>{opportunity.club.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.cardTitleArea}>
                <Text style={styles.club}>{opportunity.club}</Text>
                <Text style={styles.role}>{opportunity.position}</Text>
              </View>
              <View style={styles.fitPill}>
                <Text style={styles.fitValue}>{opportunity.fit}%</Text>
                <Text style={styles.fitLabel}>fit</Text>
              </View>
            </View>

            <Text style={styles.description}>{opportunity.description}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>
                  {opportunity.city}, {opportunity.country}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.trialDate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="card-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.contract}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={16} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.scout}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.stageBadge}>
                <Text style={styles.stageText}>{stage}</Text>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.iconAction, saved && styles.iconActionActive]}
                  onPress={() => updateStage(opportunity.id, saved ? 'New' : 'Saved')}
                >
                  <Ionicons
                    name={saved ? 'bookmark' : 'bookmark-outline'}
                    size={18}
                    color={saved ? '#FFFFFF' : colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.applyButton, applied && styles.appliedButton]}
                  onPress={() => updateStage(opportunity.id, applied ? stage : 'Applied')}
                >
                  <Text style={[styles.applyButtonText, applied && styles.appliedButtonText]}>
                    {applied ? 'Applied' : 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {filteredOpportunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="file-tray-outline" size={30} color={colors.muted} />
          <Text style={styles.emptyTitle}>No opportunities here</Text>
          <Text style={styles.emptyText}>Change the filter or search for another market.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 58,
    paddingBottom: 102,
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  title: {
    color: colors.ink,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  searchShell: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15,
    paddingVertical: 10,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 14,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.muted,
    fontWeight: '900',
    fontSize: 13,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  summaryItem: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    justifyContent: 'center',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  syncNotice: {
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  syncNoticeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  opportunityCard: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubMark: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubMarkText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '900',
  },
  cardTitleArea: {
    flex: 1,
  },
  club: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  role: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  fitPill: {
    minWidth: 58,
    borderRadius: 8,
    backgroundColor: '#F7F2E6',
    borderWidth: 1,
    borderColor: '#E4D4AD',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  fitValue: {
    color: colors.accent,
    fontWeight: '900',
    fontSize: 16,
  },
  fitLabel: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
  },
  detailGrid: {
    gap: 9,
    marginTop: 14,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  stageBadge: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageText: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconAction: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconActionActive: {
    backgroundColor: colors.primary,
  },
  applyButton: {
    minHeight: 42,
    minWidth: 92,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  appliedButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  appliedButtonText: {
    color: colors.primary,
  },
  emptyState: {
    marginTop: 16,
    padding: 24,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '900',
    fontSize: 17,
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
});
