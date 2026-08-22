import {
    colors,
    defaultPlayerProfile,
    mediaClips,
    opportunities,
    performanceStats,
    profileTasks,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
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

export default function PlayerDashboard() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [searchText, setSearchText] = useState('');

  const playerName = currentUser?.name ?? defaultPlayerProfile.name;
  const firstName = playerName.split(' ')[0];
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
            <Text style={styles.heroStatValue}>{defaultPlayerProfile.scoutViews}</Text>
            <Text style={styles.heroStatLabel}>Scout views</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>3</Text>
            <Text style={styles.heroStatLabel}>Hot leads</Text>
          </View>
        </View>
      </ImageBackground>

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
    paddingBottom: 102,
  },
  hero: {
    minHeight: 430,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 12, 9, 0.52)',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveBadge: {
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7CFF9C',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  heroIconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#E8C77C',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 35,
    lineHeight: 39,
    fontWeight: '900',
    maxWidth: 360,
  },
  heroSubtitle: {
    color: '#E8EFE5',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: 420,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
  },
  heroStat: {
    flex: 1,
    minHeight: 78,
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  heroStatLabel: {
    color: '#DDE8D8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  readinessPanel: {
    marginHorizontal: 16,
    marginTop: 18,
    padding: 18,
    borderRadius: 8,
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
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
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
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  inlineButtonText: {
    color: colors.primary,
    fontWeight: '900',
  },
  sectionHeader: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  viewAll: {
    color: colors.primary,
    fontWeight: '900',
    fontSize: 14,
  },
  statGrid: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48.5%',
    minHeight: 106,
    borderRadius: 8,
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
  },
  statLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  statTrend: {
    alignSelf: 'flex-start',
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '900',
  },
  mediaPanel: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 16,
  },
  mediaHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  mediaIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaCopy: {
    flex: 1,
  },
  mediaTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  mediaText: {
    color: '#DDE8D8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  mediaStatsRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 14,
  },
  mediaStatBlock: {
    flex: 1,
    minHeight: 66,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    justifyContent: 'center',
  },
  mediaStatValue: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
  },
  mediaStatLabel: {
    color: '#DDE8D8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  mediaButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  mediaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  searchShell: {
    marginHorizontal: 16,
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
  opportunityCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
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
    fontSize: 18,
    fontWeight: '900',
  },
  role: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 3,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },
  metaText: {
    flex: 1,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '900',
  },
  emptyState: {
    marginHorizontal: 16,
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
