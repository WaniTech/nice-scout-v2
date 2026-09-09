import {
  colors,
  defaultShowcaseReport,
  ShowcaseEvent,
  ShowcaseReport,
  ShowcaseRsvpStatus,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
  getPlayerShowcaseReport,
  updateShowcaseRsvp,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const filterTabs: ('All' | ShowcaseRsvpStatus)[] = ['All', 'Attending', 'Invited', 'Declined'];

export default function ShowcasesScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [report, setReport] = useState<ShowcaseReport>(defaultShowcaseReport);
  const [selectedFilter, setSelectedFilter] = useState<('All' | ShowcaseRsvpStatus)>('All');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPlayerShowcaseReport(playerId)
      .then((data) => {
        if (active && data?.showcases) setReport(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [playerId]);

  const handleRsvp = async (event: ShowcaseEvent, status: ShowcaseRsvpStatus) => {
    setBusy(true);
    try {
      const assigned = status === 'Attending'
        ? (event.assignedSquad !== 'Pending Confirmation' ? event.assignedSquad : 'Team Green • Right Wing (#7)')
        : 'Declined';

      const updated = await updateShowcaseRsvp(playerId, event.id, {
        rsvpStatus: status,
        assignedSquad: assigned,
      });

      setReport((prev) => ({
        ...prev,
        showcases: prev.showcases.map((s) => (s.id === updated.id ? updated : s)),
        metrics: {
          ...prev.metrics,
          attendingCount: prev.showcases.filter((s) => (s.id === updated.id ? status : s.rsvpStatus) === 'Attending').length,
          invitedCount: prev.showcases.filter((s) => (s.id === updated.id ? status : s.rsvpStatus) === 'Invited').length,
        },
      }));

      Alert.alert('RSVP Updated', `Your status for ${event.title} is now: ${status}`);
    } catch {
      Alert.alert('Error', 'Could not update showcase RSVP right now.');
    } finally {
      setBusy(false);
    }
  };

  const { metrics, showcases } = report;

  const filteredShowcases = showcases.filter(
    (s) => selectedFilter === 'All' || s.rsvpStatus === selectedFilter
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Scouting Combines & Events</Text>
          <Text style={styles.title}>Showcase Combines</Text>
          <Text style={styles.subtitle}>
            Multi-club scouting tournaments, 11v11 match showcases, and physical testing combines.
          </Text>
        </View>
      </View>

      {/* KPI Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalShowcases}</Text>
          <Text style={styles.metricLabel}>Combines</Text>
          <Text style={styles.metricSub}>Scheduled</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.attendingCount}</Text>
          <Text style={styles.metricLabel}>Attending</Text>
          <Text style={styles.metricSub}>Confirmed</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalScoutsAttending}</Text>
          <Text style={styles.metricLabel}>Scouts Live</Text>
          <Text style={styles.metricSub}>{metrics.uniqueClubsRepresented} Clubs</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterChip, selectedFilter === tab && styles.filterChipActive]}
            onPress={() => setSelectedFilter(tab)}
          >
            <Text style={[styles.filterChipText, selectedFilter === tab && styles.filterChipTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Showcase Cards */}
      {filteredShowcases.map((event) => (
        <View key={event.id} style={styles.showcaseCard}>
          {/* Card Header */}
          <View style={styles.showcaseTop}>
            <View style={styles.showcaseIconWrap}>
              <Ionicons name="trophy-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.showcaseTitle}>{event.title}</Text>
              <Text style={styles.showcaseOrganizer}>{event.organizer}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                event.rsvpStatus === 'Attending'
                  ? styles.statusAttending
                  : event.rsvpStatus === 'Invited'
                  ? styles.statusInvited
                  : styles.statusDeclined,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  event.rsvpStatus === 'Attending'
                    ? styles.statusTextAttending
                    : event.rsvpStatus === 'Invited'
                    ? styles.statusTextInvited
                    : styles.statusTextDeclined,
                ]}
              >
                {event.rsvpStatus}
              </Text>
            </View>
          </View>

          {/* Date & Location Pill Row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.muted} />
              <Text style={styles.metaItemText}>
                {event.startDate} – {event.endDate}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={14} color={colors.muted} />
              <Text style={styles.metaItemText}>
                {event.city}, {event.country}
              </Text>
            </View>
          </View>

          {/* Scouts Attending Banner */}
          <View style={styles.scoutsBanner}>
            <View style={styles.scoutsBannerLeft}>
              <Ionicons name="people" size={16} color="#B45309" />
              <Text style={styles.scoutsBannerText}>
                {event.confirmedScoutsCount} Verified Scouts Attending
              </Text>
            </View>
            <View style={styles.clubsTagWrap}>
              {event.confirmedClubs.slice(0, 4).map((club) => (
                <View key={club} style={styles.clubPill}>
                  <Text style={styles.clubPillText}>{club}</Text>
                </View>
              ))}
              {event.confirmedClubs.length > 4 ? (
                <View style={styles.clubPill}>
                  <Text style={styles.clubPillText}>+{event.confirmedClubs.length - 4} more</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Format & Assigned Squad */}
          <View style={styles.detailsBox}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Format:</Text>
              <Text style={styles.detailValue}>{event.format}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Age / Pitch:</Text>
              <Text style={styles.detailValue}>{event.ageCategory} • {event.pitchType}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Assigned Squad:</Text>
              <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                {event.assignedSquad}
              </Text>
            </View>
          </View>

          {/* Match Day Schedule */}
          {event.matchSchedule && event.matchSchedule.length > 0 ? (
            <View style={styles.scheduleSection}>
              <Text style={styles.scheduleHeader}>Match Day Schedule</Text>
              {event.matchSchedule.map((m) => (
                <View key={m.matchId} style={styles.matchItem}>
                  <View style={styles.matchDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchOpponent}>{m.opponent}</Text>
                    <Text style={styles.matchMeta}>{m.time} • {m.pitch}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.cardActions}>
            {event.rsvpStatus !== 'Attending' ? (
              <TouchableOpacity
                style={styles.confirmBtn}
                disabled={busy}
                onPress={() => handleRsvp(event, 'Attending')}
              >
                <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.confirmBtnText}>Confirm Attendance</Text>
              </TouchableOpacity>
            ) : null}

            {event.rsvpStatus !== 'Declined' ? (
              <TouchableOpacity
                style={styles.declineBtn}
                disabled={busy}
                onPress={() => handleRsvp(event, 'Declined')}
              >
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.reopenBtn}
                disabled={busy}
                onPress={() => handleRsvp(event, 'Invited')}
              >
                <Text style={styles.reopenBtnText}>Reopen Invitation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {filteredShowcases.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={32} color={colors.muted} />
          <Text style={styles.emptyTitle}>No showcases under this filter</Text>
          <Text style={styles.emptySubtitle}>Check other tabs to view all invitations and combines.</Text>
        </View>
      ) : null}
    </ScrollView>
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

  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
  },
  metricValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  metricLabel: { color: colors.ink, fontSize: 12, fontWeight: '800', marginTop: 2 },
  metricSub: { color: colors.muted, fontSize: 10, marginTop: 1 },

  filterRow: { gap: 8, paddingBottom: 16 },
  filterChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: '#FFFFFF' },

  showcaseCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  showcaseTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  showcaseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  showcaseTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  showcaseOrganizer: { color: colors.muted, fontSize: 12, marginTop: 2 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusAttending: { backgroundColor: '#DCFCE7' },
  statusInvited: { backgroundColor: '#FEF3C7' },
  statusDeclined: { backgroundColor: '#FEE2E2' },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  statusTextAttending: { color: '#15803D' },
  statusTextInvited: { color: '#B45309' },
  statusTextDeclined: { color: '#B91C1C' },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItemText: { color: colors.muted, fontSize: 12, fontWeight: '600' },

  scoutsBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  scoutsBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scoutsBannerText: { color: '#92400E', fontSize: 12, fontWeight: '800' },
  clubsTagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  clubPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  clubPillText: { color: '#78350F', fontSize: 10, fontWeight: '700' },

  detailsBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 6,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  detailValue: { color: colors.ink, fontSize: 12, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },

  scheduleSection: { marginTop: 14, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  scheduleHeader: { color: colors.ink, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  matchItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  matchDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
  matchOpponent: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  matchMeta: { color: colors.muted, fontSize: 11, marginTop: 1 },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  declineBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  declineBtnText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  reopenBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reopenBtnText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 10 },
  emptySubtitle: { color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
});
