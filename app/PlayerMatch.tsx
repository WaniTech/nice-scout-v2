import { colors, defaultPlayerProfile, opportunities } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { matchPlayerToOpportunities } from '@/services/matchingEngine';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function PlayerMatchRoom() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [minCompatibility, setMinCompatibility] = useState(60);
  const [selectedWeight, setSelectedWeight] = useState<'balanced' | 'tactical' | 'location'>('balanced');

  const playerProfile = useMemo(() => ({
    name: currentUser?.name || defaultPlayerProfile.name,
    position: currentUser?.position || defaultPlayerProfile.position,
    location: currentUser?.location || defaultPlayerProfile.location,
    strengths: defaultPlayerProfile.strengths,
    secondaryPositions: ['Left Winger', 'Attacking Midfielder'],
    preferences: {
      markets: ['Denmark', 'Sweden', 'Germany', 'Portugal'],
      contractType: 'Full-time Pro',
      minimumPackage: '€3,500/mo',
    },
  }), [currentUser]);

  const weightPresets = {
    balanced: { positionWeight: 0.35, tacticalWeight: 0.30, locationWeight: 0.20, financialWeight: 0.15 },
    tactical: { positionWeight: 0.25, tacticalWeight: 0.50, locationWeight: 0.15, financialWeight: 0.10 },
    location: { positionWeight: 0.30, tacticalWeight: 0.20, locationWeight: 0.40, financialWeight: 0.10 },
  };

  const matches = useMemo(() => {
    if (!hasRun) return [];
    return matchPlayerToOpportunities(playerProfile, opportunities, {
      minCompatibility,
      limit: 6,
      weights: weightPresets[selectedWeight],
    });
  }, [hasRun, minCompatibility, selectedWeight, playerProfile]);

  const handleMatch = () => {
    setLoading(true);
    setTimeout(() => {
      setHasRun(true);
      setLoading(false);
    }, 450);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Matching Engine v2</Text>
            <Text style={styles.title}>Multi-Criteria Club Fit</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileIcon}>
              <Ionicons name="sparkles" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{playerProfile.name}</Text>
              <Text style={styles.profileTitle}>{playerProfile.position}</Text>
            </View>
            <View style={styles.locationBadge}>
              <Ionicons name="location-outline" size={12} color="#4B5563" />
              <Text style={styles.locationText}>{playerProfile.location}</Text>
            </View>
          </View>

          <Text style={styles.profileText}>{defaultPlayerProfile.headline}</Text>

          <View style={styles.strengthRow}>
            {playerProfile.strengths.slice(0, 4).map((strength) => (
              <Text key={strength} style={styles.strengthChip}>{strength}</Text>
            ))}
          </View>
        </View>

        {/* Criteria Weight Filter Selectors */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Optimization Priority</Text>
          <View style={styles.presetRow}>
            {(['balanced', 'tactical', 'location'] as const).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, selectedWeight === preset && styles.presetButtonActive]}
                onPress={() => setSelectedWeight(preset)}
              >
                <Text style={[styles.presetText, selectedWeight === preset && styles.presetTextActive]}>
                  {preset.charAt(0).toUpperCase() + preset.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Minimum Fit Threshold</Text>
            <View style={styles.thresholdPills}>
              {[50, 60, 75].map((threshold) => (
                <TouchableOpacity
                  key={threshold}
                  style={[styles.thresholdPill, minCompatibility === threshold && styles.thresholdPillActive]}
                  onPress={() => setMinCompatibility(threshold)}
                >
                  <Text style={[styles.thresholdPillText, minCompatibility === threshold && styles.thresholdPillTextActive]}>
                    {threshold}%+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.matchButton} onPress={handleMatch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.matchButtonText}>
                {hasRun ? 'Recalculate Compatibility' : 'Run Algorithmic Match'}
              </Text>
              <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {hasRun && matches.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={32} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No clubs meet the {minCompatibility}% threshold</Text>
            <Text style={styles.emptySubtitle}>Try lowering the minimum threshold or adjusting optimization priority.</Text>
          </View>
        )}

        {matches.map((opportunity) => (
          <TouchableOpacity
            key={opportunity.id}
            style={styles.matchCard}
            onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
          >
            <View style={styles.matchTop}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.club}>{opportunity.club}</Text>
                <Text style={styles.role}>{opportunity.position} • {opportunity.country}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.fitScore}>{opportunity.compatibilityScore}%</Text>
                <Text style={styles.fitLabel}>Match</Text>
              </View>
            </View>

            {/* Granular Breakdown Bars */}
            <View style={styles.breakdownGrid}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Tactical</Text>
                <Text style={styles.breakdownValue}>{opportunity.fitBreakdown.tacticalFit}%</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Position</Text>
                <Text style={styles.breakdownValue}>{opportunity.fitBreakdown.positionalFit}%</Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Location</Text>
                <Text style={styles.breakdownValue}>{opportunity.fitBreakdown.locationFit}%</Text>
              </View>
            </View>

            {opportunity.reasons && opportunity.reasons.length > 0 && (
              <View style={styles.reasonList}>
                {opportunity.reasons.slice(0, 2).map((reason, idx) => (
                  <View key={idx} style={styles.reasonRow}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
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
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  profileIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  profileTitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  locationText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  profileText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 10,
  },
  strengthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthChip: {
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: '#F3F4F6',
    color: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: colors.ink,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  presetTextActive: {
    color: '#FFFFFF',
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thresholdLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  thresholdPills: {
    flexDirection: 'row',
    gap: 6,
  },
  thresholdPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  thresholdPillActive: {
    backgroundColor: '#0284C7',
  },
  thresholdPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  thresholdPillTextActive: {
    color: '#FFFFFF',
  },
  matchButton: {
    backgroundColor: colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  matchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    marginTop: 8,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  club: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  role: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  fitScore: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  fitLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
  },
  breakdownGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    justifyContent: 'space-around',
  },
  breakdownItem: {
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  reasonList: {
    gap: 4,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonText: {
    fontSize: 12,
    color: '#374151',
  },
});
