import { colors, defaultPlayerProfile, opportunities } from '@/constants/playerPlatform';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);

  const handleMatch = () => {
    setLoading(true);
    setMatchedIds([]);

    setTimeout(() => {
      const matches = opportunities
        .filter((opportunity) =>
          [opportunity.position, opportunity.description, opportunity.tags.join(' ')]
            .join(' ')
            .toLowerCase()
            .includes('wing'),
        )
        .sort((first, second) => second.fit - first.fit)
        .slice(0, 3)
        .map((opportunity) => opportunity.id);

      setMatchedIds(matches);
      setLoading(false);
    }, 650);
  };

  const matches = opportunities.filter((opportunity) => matchedIds.includes(opportunity.id));

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Match room</Text>
            <Text style={styles.title}>Find best club fits</Text>
          </View>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileIcon}>
            <Ionicons name="flash-outline" size={26} color={colors.accent} />
          </View>
          <Text style={styles.profileTitle}>{defaultPlayerProfile.position}</Text>
          <Text style={styles.profileText}>{defaultPlayerProfile.headline}</Text>
          <View style={styles.strengthRow}>
            {defaultPlayerProfile.strengths.slice(0, 4).map((strength) => (
              <Text key={strength} style={styles.strengthChip}>{strength}</Text>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.matchButton} onPress={handleMatch} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.matchButtonText}>Run player match</Text>
              <Ionicons name="sparkles-outline" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        {matches.map((opportunity) => (
          <TouchableOpacity
            key={opportunity.id}
            style={styles.matchCard}
            onPress={() => router.push({ pathname: '/JobDetail', params: { id: opportunity.id } })}
          >
            <View style={styles.matchTop}>
              <View>
                <Text style={styles.club}>{opportunity.club}</Text>
                <Text style={styles.role}>{opportunity.position}</Text>
              </View>
              <Text style={styles.fit}>{opportunity.fit}%</Text>
            </View>
            <Text style={styles.description}>{opportunity.description}</Text>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  profileCard: {
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 18,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  profileTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  profileText: {
    color: '#DDE8D8',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  strengthRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  strengthChip: {
    color: '#E8C77C',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '900',
  },
  matchButton: {
    minHeight: 54,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  matchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  matchCard: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginTop: 12,
  },
  matchTop: {
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
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  fit: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '900',
  },
  description: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
});
