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
import { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const filters: ('All' | OpportunityStage)[] = ['All', 'Applied', 'Trial booked', 'Offer talks', 'Saved', 'New'];

const stageColors: Record<OpportunityStage, { bg: string; text: string; icon: string }> = {
  New: { bg: '#F1F4F0', text: '#5E6B5D', icon: 'sparkles-outline' },
  Saved: { bg: '#EFF6FF', text: '#2563EB', icon: 'bookmark-outline' },
  Applied: { bg: '#FEF3C7', text: '#D97706', icon: 'paper-plane-outline' },
  'Trial booked': { bg: '#DCFCE7', text: '#15803D', icon: 'calendar-outline' },
  'Offer talks': { bg: '#F3E8FF', text: '#7E22CE', icon: 'trophy-outline' },
};

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
        setSyncNotice('Pipeline synchronized with API');
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

  const pipelineCounts = useMemo(() => {
    const saved = Object.values(stages).filter((s) => s === 'Saved').length;
    const applied = Object.values(stages).filter((s) => s === 'Applied').length;
    const trials = Object.values(stages).filter((s) => s === 'Trial booked').length;
    const offers = Object.values(stages).filter((s) => s === 'Offer talks').length;
    return { saved, applied, trials, offers };
  }, [stages]);

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
        setSyncNotice('Opportunity removed from your pipeline');
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

      setSyncNotice(`Moved to "${nextStage}"`);
    } catch {
      setStages((previousStages) => ({ ...previousStages, [id]: previousStage }));
      setSyncNotice('Could not sync stage update. Try again when API is reachable.');
    }
  };

  const cycleNextStage = (id: string) => {
    const current = stages[id] ?? 'New';
    const sequence: OpportunityStage[] = ['New', 'Saved', 'Applied', 'Trial booked', 'Offer talks'];
    const currentIndex = sequence.indexOf(current);
    const nextIndex = (currentIndex + 1) % sequence.length;
    updateStage(id, sequence[nextIndex]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Scouting Pipeline</Text>
        <Text style={styles.title}>Trials & Pipeline</Text>
        <Text style={styles.subtitle}>
          Track every recruitment lead from scout interest to trial booking and contract talks.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={[styles.summaryItem, activeFilter === 'Applied' && styles.summaryItemActive]}
          onPress={() => setActiveFilter(activeFilter === 'Applied' ? 'All' : 'Applied')}
        >
          <Text style={styles.summaryValue}>{pipelineCounts.applied}</Text>
          <Text style={styles.summaryLabel}>Applied</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryItem, activeFilter === 'Trial booked' && styles.summaryItemActive]}
          onPress={() => setActiveFilter(activeFilter === 'Trial booked' ? 'All' : 'Trial booked')}
        >
          <Text style={styles.summaryValue}>{pipelineCounts.trials}</Text>
          <Text style={styles.summaryLabel}>Trials Booked</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryItem, activeFilter === 'Offer talks' && styles.summaryItemActive]}
          onPress={() => setActiveFilter(activeFilter === 'Offer talks' ? 'All' : 'Offer talks')}
        >
          <Text style={styles.summaryValue}>{pipelineCounts.offers}</Text>
          <Text style={styles.summaryLabel}>Offer Talks</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryItem, activeFilter === 'Saved' && styles.summaryItemActive]}
          onPress={() => setActiveFilter(activeFilter === 'Saved' ? 'All' : 'Saved')}
        >
          <Text style={styles.summaryValue}>{pipelineCounts.saved}</Text>
          <Text style={styles.summaryLabel}>Saved</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search club, role, league, or country..."
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
          const count =
            filter === 'All'
              ? boardOpportunities.length
              : Object.values(stages).filter((s) => s === filter).length;

          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selected && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterText, selected && styles.filterTextActive]}>
                {filter} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {syncNotice ? (
        <View style={styles.syncNotice}>
          <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.syncNoticeText}>{syncNotice}</Text>
        </View>
      ) : null}

      {filteredOpportunities.map((opportunity) => {
        const stage = stages[opportunity.id] ?? 'New';
        const applied = stage === 'Applied' || stage === 'Trial booked' || stage === 'Offer talks';
        const saved = stage === 'Saved';
        const stageInfo = stageColors[stage] || stageColors.New;

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
                <Text style={styles.role}>{opportunity.position} • {opportunity.league}</Text>
              </View>
              <View style={styles.fitPill}>
                <Text style={styles.fitValue}>{opportunity.fit}%</Text>
                <Text style={styles.fitLabel}>fit</Text>
              </View>
            </View>

            <Text style={styles.description}>{opportunity.description}</Text>

            <View style={styles.detailGrid}>
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>
                  {opportunity.city}, {opportunity.country}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.trialDate}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="cash-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.compensation}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={15} color={colors.primary} />
                <Text style={styles.detailText}>{opportunity.scout}</Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={[styles.stageBadge, { backgroundColor: stageInfo.bg }]}
                onPress={() => cycleNextStage(opportunity.id)}
              >
                <Ionicons name={stageInfo.icon as any} size={14} color={stageInfo.text} />
                <Text style={[styles.stageText, { color: stageInfo.text }]}>{stage}</Text>
                <Ionicons name="swap-horizontal" size={12} color={stageInfo.text} style={{ marginLeft: 2 }} />
              </TouchableOpacity>

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
                  onPress={() => updateStage(opportunity.id, applied ? (stage === 'Offer talks' ? 'Trial booked' : 'Offer talks') : 'Applied')}
                >
                  <Text style={[styles.applyButtonText, applied && styles.appliedButtonText]}>
                    {stage === 'Trial booked' ? 'Advance to Offer' : applied ? 'In Progress' : 'Apply Now'}
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
          <Text style={styles.emptyText}>Change the pipeline filter or try another search.</Text>
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  kicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  title: {
    color: colors.ink,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryItemActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  searchShell: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 10,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 14,
  },
  filterChip: {
    minHeight: 38,
    borderRadius: 20,
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
    fontWeight: '800',
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  syncNoticeText: {
    color: '#0D5C3A',
    fontSize: 12,
    fontWeight: '700',
  },
  opportunityCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubMark: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubMarkText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  cardTitleArea: {
    flex: 1,
  },
  club: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
  },
  role: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  fitPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
  },
  fitValue: {
    color: '#B45309',
    fontWeight: '900',
    fontSize: 14,
  },
  fitLabel: {
    color: '#B45309',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  description: {
    color: colors.ink,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
    fontWeight: '500',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: '45%',
  },
  detailText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  iconActionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  applyButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  appliedButtonText: {
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
  },
});
