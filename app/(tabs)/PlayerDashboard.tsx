import {
    BenchmarkReport,
    colors,
    defaultBenchmarkReport,
    defaultPillars,
    defaultPlayerProfile,
    defaultScoutActivityReport,
    defaultWatchlistReport,
    mediaClips,
    opportunities,
    performanceStats,
    PillarScores,
    profileTasks,
    ScoutActivityReport,
    WatchlistReport,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    getPlayerAnalytics,
    getPlayerBenchmarks,
    getPlayerScoutActivity,
    getPlayerWatchlistReport,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const heroImage = require('../../assets/images/player-hero.png');

const benchmarkOptions = [
  'Danish Superliga Academy',
  'Eredivisie U23',
  'German Development Squad',
  'MLS Next Pro',
];

export default function PlayerDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [selectedBaseline, setSelectedBaseline] = useState('Danish Superliga Academy');

  const [pillars, setPillars] = useState<PillarScores>(defaultPillars);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport>(defaultBenchmarkReport);
  const [scoutActivity, setScoutActivity] = useState<ScoutActivityReport>(defaultScoutActivityReport);
  const [watchlistReport, setWatchlistReport] = useState<WatchlistReport>(defaultWatchlistReport);

  const playerName = currentUser?.name ?? defaultPlayerProfile.name;
  const firstName = playerName.split(' ')[0];
  const playerId = currentUser?.id ?? 'demo-player';

  useEffect(() => {
    let ignore = false;

    async function loadIntelligenceData() {
      try {
        const [radarRes, benchmarkRes, scoutRes, watchlistRes] = await Promise.allSettled([
          getPlayerAnalytics(playerId),
          getPlayerBenchmarks(playerId, defaultPlayerProfile.position, selectedBaseline),
          getPlayerScoutActivity(playerId),
          getPlayerWatchlistReport(playerId),
        ]);

        if (ignore) return;

        if (radarRes.status === 'fulfilled' && radarRes.value?.pillars) {
          setPillars(radarRes.value.pillars);
        }
        if (benchmarkRes.status === 'fulfilled' && benchmarkRes.value?.metrics) {
          setBenchmarkReport(benchmarkRes.value);
        }
        if (scoutRes.status === 'fulfilled' && scoutRes.value?.totalViews) {
          setScoutActivity(scoutRes.value);
        }
        if (watchlistRes.status === 'fulfilled' && watchlistRes.value?.watchlists) {
          setWatchlistReport(watchlistRes.value);
        }
      } catch {
        // Fallback to defaults
      }
    }

    loadIntelligenceData();

    return () => {
      ignore = true;
    };
  }, [playerId, selectedBaseline]);

  const mediaStats = useMemo(() => {
    const ready = mediaClips.filter((clip) => clip.status === 'Scout-ready' || clip.status === 'Sent').length;
    const drafts = mediaClips.filter((clip) => clip.status === 'Draft').length;
    const totalViews = mediaClips.reduce((sum, clip) => sum + clip.views, 0);

    return { ready, drafts, totalViews };
  }, []);
  const filteredOpportunities = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return opportunities.slice(0, 4);
    }

    return opportunities.filter((opportunity) =>
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
        .includes(query),
    );
  }, [searchText]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ImageBackground source={heroImage} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.heroShade} />
        <View style={styles.heroTop}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>Profile live</Text>
          </View>
          <TouchableOpacity style={styles.heroIconButton} onPress={() => router.push('/Profile')}>
            <Ionicons name="person-outline" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View>
          <Text style={styles.heroEyebrow}>Welcome back, {firstName}</Text>
          <Text style={styles.heroTitle}>Your next trial is getting closer.</Text>
          <Text style={styles.heroSubtitle}>
            {defaultPlayerProfile.headline}
          </Text>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{defaultPlayerProfile.matchFit}%</Text>
            <Text style={styles.heroStatLabel}>Match fit</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{scoutActivity.totalViews}</Text>
            <Text style={styles.heroStatLabel}>Scout views</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{scoutActivity.activeWatchlists}</Text>
            <Text style={styles.heroStatLabel}>Watchlists</Text>
          </View>
        </View>
      </ImageBackground>

      {/* Scout Analytics Radar / 4-Pillar Performance Card */}
      <View style={styles.radarCard}>
        <View style={styles.radarHeader}>
          <View>
            <Text style={styles.sectionKicker}>Scout Analytics Radar</Text>
            <Text style={styles.sectionTitle}>4-Pillar Performance</Text>
          </View>
          <View style={styles.overallRadarBadge}>
            <Text style={styles.overallRadarScore}>{pillars.overallRadarScore}</Text>
            <Text style={styles.overallRadarLabel}>Score</Text>
          </View>
        </View>

        <View style={styles.pillarGrid}>
          <View style={styles.pillarItem}>
            <View style={styles.pillarTop}>
              <Text style={styles.pillarName}>Physical</Text>
              <Text style={styles.pillarValue}>{pillars.physical}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${pillars.physical}%`, backgroundColor: '#1E6B4E' }]} />
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarTop}>
              <Text style={styles.pillarName}>Technical</Text>
              <Text style={styles.pillarValue}>{pillars.technical}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${pillars.technical}%`, backgroundColor: '#2563EB' }]} />
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarTop}>
              <Text style={styles.pillarName}>Tactical</Text>
              <Text style={styles.pillarValue}>{pillars.tactical}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${pillars.tactical}%`, backgroundColor: '#C9922E' }]} />
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarTop}>
              <Text style={styles.pillarName}>Mental / Drive</Text>
              <Text style={styles.pillarValue}>{pillars.mental}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${pillars.mental}%`, backgroundColor: '#7E22CE' }]} />
            </View>
          </View>
        </View>
      </View>

      {/* Academy & Pro Benchmark Comparison Hub */}
      <View style={styles.benchmarkCard}>
        <View style={styles.radarHeader}>
          <View>
            <Text style={styles.sectionKicker}>Benchmark Engine</Text>
            <Text style={styles.sectionTitle}>Academy Comparison</Text>
          </View>
          <View style={styles.benchmarkTierPill}>
            <Text style={styles.benchmarkTierText}>{benchmarkReport.tier}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.baselineScroll}>
          {benchmarkOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                styles.baselineTab,
                selectedBaseline === opt && styles.baselineTabActive,
              ]}
              onPress={() => setSelectedBaseline(opt)}
            >
              <Text
                style={[
                  styles.baselineTabText,
                  selectedBaseline === opt && styles.baselineTabTextActive,
                ]}
              >
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.metricList}>
          {benchmarkReport.metrics.map((item) => (
            <View key={item.metric} style={styles.metricRow}>
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{item.label}</Text>
                <Text style={styles.metricValues}>
                  {item.playerValue} {item.unit} vs {item.benchmarkValue} {item.unit}
                </Text>
              </View>
              <View style={styles.metricBadgeWrap}>
                <View
                  style={[
                    styles.metricBadge,
                    item.diff >= 0 ? styles.badgePositive : styles.badgeNeutral,
                  ]}
                >
                  <Text
                    style={[
                      styles.metricBadgeText,
                      item.diff >= 0 ? styles.badgeTextPositive : styles.badgeTextNeutral,
                    ]}
                  >
                    {item.diff >= 0 ? `+${item.diff}` : `${item.diff}`} {item.unit}
                  </Text>
                </View>
                <Text style={styles.percentileText}>{item.percentile}th %tile</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Scout Intelligence & Engagement */}
      <View style={styles.scoutActivityCard}>
        <View style={styles.radarHeader}>
          <View>
            <Text style={styles.sectionKicker}>Recruitment Tracking</Text>
            <Text style={styles.sectionTitle}>Scout Engagement</Text>
          </View>
          <View style={styles.scoutStatPill}>
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <Text style={styles.scoutStatText}>{scoutActivity.videoReplays} Replays</Text>
          </View>
        </View>

        <View style={styles.leagueViewsRow}>
          {scoutActivity.viewsByLeague.slice(0, 2).map((l) => (
            <View key={l.league} style={styles.leagueViewBlock}>
              <Text style={styles.leagueName}>{l.league}</Text>
              <View style={styles.leagueStatLine}>
                <Text style={styles.leagueViewsCount}>{l.views} views</Text>
                <Text style={styles.leagueTrend}>{l.trend}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.recentScoutsList}>
          {scoutActivity.recentScouts.map((entry, idx) => (
            <View key={idx} style={styles.scoutActionRow}>
              <View style={styles.scoutAvatar}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
              </View>
              <View style={styles.scoutActionInfo}>
                <Text style={styles.scoutClubText}>{entry.club} • {entry.scout}</Text>
                <Text style={styles.scoutActionDetail}>{entry.action}</Text>
              </View>
              <Text style={styles.scoutTimeText}>{entry.time}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Scout Watchlist & Talent Shortlist Network */}
      <View style={styles.watchlistCard}>
        <View style={styles.radarHeader}>
          <View>
            <Text style={styles.sectionKicker}>Talent Watchlist Network</Text>
            <Text style={styles.sectionTitle}>Scout Shortlists & Inquiries</Text>
          </View>
          <View style={styles.interestIndexBadge}>
            <Text style={styles.interestIndexValue}>{watchlistReport.metrics.interestIndex}%</Text>
            <Text style={styles.interestIndexLabel}>Interest</Text>
          </View>
        </View>

        {/* Tier Distribution Bar */}
        <View style={styles.tierDistributionRow}>
          <View style={[styles.tierPill, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
            <Text style={[styles.tierPillText, { color: '#15803D' }]}>
              {watchlistReport.metrics.priorityCount} Priority Targets
            </Text>
          </View>
          <View style={[styles.tierPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <Text style={[styles.tierPillText, { color: '#2563EB' }]}>
              {watchlistReport.metrics.monitoredCount} Monitored
            </Text>
          </View>
          <View style={[styles.tierPill, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
            <Text style={[styles.tierPillText, { color: '#4B5563' }]}>
              {watchlistReport.metrics.extendedCount} Extended
            </Text>
          </View>
        </View>

        {/* Active Shortlisted Scouts */}
        <View style={styles.watchlistItemsList}>
          {watchlistReport.watchlists.slice(0, 3).map((w) => (
            <View key={w.id} style={styles.watchlistItem}>
              <View style={styles.watchlistDot} />
              <View style={{ flex: 1 }}>
                <View style={styles.watchlistTopLine}>
                  <Text style={styles.watchlistScoutName}>{w.scoutName} ({w.club})</Text>
                  <View
                    style={[
                      styles.tierTag,
                      w.tier === 'Priority Target'
                        ? styles.tierTagPriority
                        : w.tier === 'Monitored'
                        ? styles.tierTagMonitored
                        : styles.tierTagExtended,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tierTagText,
                        w.tier === 'Priority Target'
                          ? styles.tierTextPriority
                          : w.tier === 'Monitored'
                          ? styles.tierTextMonitored
                          : styles.tierTextExtended,
                      ]}
                    >
                      {w.tier}
                    </Text>
                  </View>
                </View>
                <Text style={styles.watchlistRole}>{w.role} • {w.league}</Text>
                <Text style={styles.watchlistNotes}>{w.notes}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.readinessPanel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.sectionKicker}>Player readiness</Text>
            <Text style={styles.sectionTitle}>Profile strength</Text>
          </View>
          <Text style={styles.completion}>{defaultPlayerProfile.completion}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${defaultPlayerProfile.completion}%` }]} />
        </View>
        <View style={styles.taskList}>
          {profileTasks.map((task) => (
            <View key={task} style={styles.taskRow}>
              <Ionicons name="ellipse-outline" size={15} color={colors.accent} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.inlineButton} onPress={() => router.push('/Profile')}>
          <Text style={styles.inlineButtonText}>Improve profile</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>Performance pulse</Text>
          <Text style={styles.sectionTitle}>Scout-ready data</Text>
        </View>
      </View>
      <View style={styles.statGrid}>
        {performanceStats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statTrend}>{stat.trend}</Text>
          </View>
        ))}
      </View>

      <View style={styles.mediaPanel}>
        <View style={styles.mediaHeader}>
          <View style={styles.mediaIcon}>
            <Ionicons name="videocam-outline" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.mediaCopy}>
            <Text style={styles.mediaTitle}>Video package</Text>
            <Text style={styles.mediaText}>
              Scout-ready clips, full-match links, and data overlays are grouped for fast follow-up.
            </Text>
          </View>
        </View>
        <View style={styles.mediaStatsRow}>
          <View style={styles.mediaStatBlock}>
            <Text style={styles.mediaStatValue}>{mediaStats.ready}</Text>
            <Text style={styles.mediaStatLabel}>Ready</Text>
          </View>
          <View style={styles.mediaStatBlock}>
            <Text style={styles.mediaStatValue}>{mediaStats.drafts}</Text>
            <Text style={styles.mediaStatLabel}>Drafts</Text>
          </View>
          <View style={styles.mediaStatBlock}>
            <Text style={styles.mediaStatValue}>{mediaStats.totalViews}</Text>
            <Text style={styles.mediaStatLabel}>Views</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.mediaButton} onPress={() => router.push('/MediaRoom')}>
          <Text style={styles.mediaButtonText}>Open media room</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionKicker}>Club matching</Text>
          <Text style={styles.sectionTitle}>Top trial matches</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/Myjobs')}>
          <Text style={styles.viewAll}>View all</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={19} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search club, country, position..."
          placeholderTextColor="#899188"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {filteredOpportunities.map((opportunity) => (
        <TouchableOpacity
          key={opportunity.id}
          style={styles.opportunityCard}
          onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
        >
          <View style={styles.cardTop}>
            <View>
              <Text style={styles.club}>{opportunity.club}</Text>
              <Text style={styles.role}>{opportunity.position}</Text>
            </View>
            <View style={styles.fitPill}>
              <Text style={styles.fitValue}>{opportunity.fit}%</Text>
              <Text style={styles.fitLabel}>fit</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText}>
              {opportunity.city}, {opportunity.country}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.muted} />
            <Text style={styles.metaText}>Trial date: {opportunity.trialDate}</Text>
          </View>
          <View style={styles.tagRow}>
            {opportunity.tags.slice(0, 3).map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
        </TouchableOpacity>
      ))}

      {filteredOpportunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={28} color={colors.muted} />
          <Text style={styles.emptyTitle}>No matches found</Text>
          <Text style={styles.emptyText}>Try a league, country, club, or position.</Text>
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
    paddingBottom: 110,
  },
  hero: {
    minHeight: 440,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 22,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 24, 18, 0.62)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    minHeight: 34,
    borderRadius: 20,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
  },
  heroIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#FBBF24',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    maxWidth: 360,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    maxWidth: 420,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    minHeight: 82,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroStatLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  radarCard: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  radarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  overallRadarBadge: {
    minWidth: 58,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  overallRadarScore: {
    color: '#0D5C3A',
    fontSize: 22,
    fontWeight: '900',
  },
  overallRadarLabel: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillarGrid: {
    gap: 14,
  },
  pillarItem: {
    gap: 6,
  },
  pillarTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pillarName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  pillarValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  meterTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  meterFill: {
    height: 8,
    borderRadius: 6,
  },
  benchmarkCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  benchmarkTierPill: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  benchmarkTierText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
  },
  baselineScroll: {
    marginBottom: 16,
  },
  baselineTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  baselineTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  baselineTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  baselineTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  metricList: {
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  metricInfo: {
    flex: 1,
    paddingRight: 10,
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  metricValues: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  metricBadgeWrap: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metricBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgePositive: {
    backgroundColor: '#DCFCE7',
  },
  badgeNeutral: {
    backgroundColor: '#FEF3C7',
  },
  metricBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextPositive: {
    color: '#15803D',
  },
  badgeTextNeutral: {
    color: '#D97706',
  },
  percentileText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  scoutActivityCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  scoutStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  scoutStatText: {
    color: '#15803D',
    fontSize: 12,
    fontWeight: '800',
  },
  leagueViewsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  leagueViewBlock: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
  },
  leagueName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  leagueStatLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  leagueViewsCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  leagueTrend: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
  },
  recentScoutsList: {
    gap: 12,
  },
  scoutActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoutAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoutActionInfo: {
    flex: 1,
  },
  scoutClubText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  scoutActionDetail: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  scoutTimeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
  watchlistCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  interestIndexBadge: {
    minWidth: 58,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  interestIndexValue: {
    color: '#B45309',
    fontSize: 20,
    fontWeight: '900',
  },
  interestIndexLabel: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tierDistributionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tierPill: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  watchlistItemsList: {
    gap: 12,
  },
  watchlistItem: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  watchlistDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  watchlistTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watchlistScoutName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  tierTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tierTagPriority: {
    backgroundColor: '#DCFCE7',
  },
  tierTagMonitored: {
    backgroundColor: '#EFF6FF',
  },
  tierTagExtended: {
    backgroundColor: '#F3F4F6',
  },
  tierTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tierTextPriority: {
    color: '#15803D',
  },
  tierTextMonitored: {
    color: '#2563EB',
  },
  tierTextExtended: {
    color: '#4B5563',
  },
  watchlistRole: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  watchlistNotes: {
    color: colors.ink,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  readinessPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  completion: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  taskList: {
    marginTop: 14,
    gap: 10,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  taskText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  inlineButton: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineButtonText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  viewAll: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  statGrid: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 108,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    justifyContent: 'space-between',
  },
  statValue: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  statTrend: {
    alignSelf: 'flex-start',
    color: '#0D5C3A',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
  },
  mediaPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    padding: 18,
  },
  mediaHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mediaIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCopy: {
    flex: 1,
  },
  mediaTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  mediaText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  mediaStatsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  mediaStatBlock: {
    flex: 1,
    minHeight: 68,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    padding: 10,
    justifyContent: 'center',
  },
  mediaStatValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  mediaStatLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  mediaButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  searchShell: {
    marginHorizontal: 16,
    minHeight: 50,
    borderRadius: 14,
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
    fontSize: 14,
    paddingVertical: 10,
  },
  opportunityCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
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
    minWidth: 54,
    borderRadius: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  fitValue: {
    color: '#B45309',
    fontWeight: '900',
    fontSize: 15,
  },
  fitLabel: {
    color: '#B45309',
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 28,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 10,
  },
  emptyText: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 13,
    textAlign: 'center',
  },
});
