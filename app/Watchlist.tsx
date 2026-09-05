import {
    colors,
    defaultWatchlistReport,
    WatchlistEntry,
    WatchlistTier,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    getPlayerWatchlistReport,
    submitScoutInquiry,
    updateWatchlistEntry,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const filters: ('All' | WatchlistTier)[] = ['All', 'Priority Target', 'Monitored', 'Extended List'];
const tierColors: Record<WatchlistTier, string> = {
  'Priority Target': colors.red,
  Monitored: colors.accent,
  'Extended List': colors.blue,
};

export default function WatchlistScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';
  const [report, setReport] = useState(defaultWatchlistReport);
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getPlayerWatchlistReport(playerId)
      .then((nextReport) => {
        if (active) setReport(nextReport);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [playerId]);

  const visibleEntries = report.watchlists.filter(
    (entry) => selectedFilter === 'All' || entry.tier === selectedFilter,
  );

  const saveEntry = async (entry: WatchlistEntry, tier: WatchlistTier) => {
    setBusy(true);
    try {
      const updated = await updateWatchlistEntry(playerId, entry.id, { tier, notes });
      setReport((current) => ({
        ...current,
        watchlists: current.watchlists.map((item) => (item.id === updated.id ? updated : item)),
      }));
      setEditingId(null);
      setNotes('');
    } catch {
      Alert.alert('Could not update scout', 'Your change could not be saved right now.');
    } finally {
      setBusy(false);
    }
  };

  const requestFollowUp = async (entry: WatchlistEntry) => {
    setBusy(true);
    try {
      const inquiry = await submitScoutInquiry(playerId, {
        scoutName: entry.scoutName,
        club: entry.club,
        type: 'Player follow-up request',
        message: `I would like to share an updated profile and discuss the ${entry.role} pathway.`,
      });
      setReport((current) => ({ ...current, inquiries: [inquiry, ...current.inquiries] }));
      Alert.alert('Request sent', `${entry.scoutName} at ${entry.club} has been notified.`);
    } catch {
      Alert.alert('Could not send request', 'Please try again when the connection is available.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Scout network</Text>
          <Text style={styles.title}>Your watchlist</Text>
          <Text style={styles.subtitle}>Track attention, keep context, and start the right conversation.</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <Metric value={String(report.metrics.totalScouts)} label="Scouts" />
        <Metric value={`${report.metrics.interestIndex}`} label="Interest index" />
        <Metric value={String(report.inquiries.length)} label="Open inquiries" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filter, selectedFilter === filter && styles.activeFilter]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {visibleEntries.map((entry) => (
        <View key={entry.id} style={styles.entryCard}>
          <View style={styles.entryTop}>
            <View style={styles.scoutMark}>
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.entryIdentity}>
              <Text style={styles.scoutName}>{entry.scoutName}</Text>
              <Text style={styles.club}>{entry.club} · {entry.league}</Text>
            </View>
            <View style={[styles.tierPill, { backgroundColor: `${tierColors[entry.tier]}18` }]}>
              <Text style={[styles.tierText, { color: tierColors[entry.tier] }]}>{entry.tier}</Text>
            </View>
          </View>
          <Text style={styles.role}>{entry.role}</Text>
          <Text style={styles.notes}>{entry.notes || 'No notes added yet.'}</Text>
          <View style={styles.entryFooter}>
            <Text style={styles.status}>{entry.inquiryStatus}</Text>
            <TouchableOpacity
              disabled={busy}
              onPress={() => {
                setEditingId(entry.id);
                setNotes(entry.notes);
              }}
            >
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={busy} onPress={() => void requestFollowUp(entry)}>
              <Text style={styles.actionText}>Follow up</Text>
            </TouchableOpacity>
          </View>
          {editingId === entry.id ? (
            <View style={styles.editPanel}>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add a private note"
                placeholderTextColor={colors.muted}
                multiline
              />
              <View style={styles.tierActions}>
                {(['Priority Target', 'Monitored', 'Extended List'] as WatchlistTier[]).map((tier) => (
                  <TouchableOpacity key={tier} disabled={busy} onPress={() => void saveEntry(entry, tier)}>
                    <Text style={[styles.tierAction, { color: tierColors[tier] }]}>{tier}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ))}

      {visibleEntries.length === 0 ? <Text style={styles.empty}>No scouts match this filter.</Text> : null}
    </ScrollView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 100 },
  header: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', marginBottom: 24 },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  kicker: { color: colors.accent, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 6 },
  metricsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 14, padding: 14 },
  metricValue: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  filters: { gap: 8, paddingBottom: 18 },
  filter: { borderRadius: 18, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: colors.surface },
  activeFilter: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  activeFilterText: { color: '#FFFFFF' },
  entryCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12 },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoutMark: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E5F3EC', alignItems: 'center', justifyContent: 'center' },
  entryIdentity: { flex: 1 },
  scoutName: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  club: { color: colors.muted, fontSize: 12, marginTop: 3 },
  tierPill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, maxWidth: 105 },
  tierText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  role: { color: colors.primary, fontSize: 13, fontWeight: '700', marginTop: 14 },
  notes: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 },
  entryFooter: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: colors.line, marginTop: 14, paddingTop: 12 },
  status: { flex: 1, color: colors.muted, fontSize: 11 },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  editPanel: { backgroundColor: colors.surfaceAlt, borderRadius: 12, padding: 10, marginTop: 12 },
  notesInput: { minHeight: 55, color: colors.ink, fontSize: 13, padding: 8, backgroundColor: colors.surface, borderRadius: 8 },
  tierActions: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10 },
  tierAction: { fontSize: 11, fontWeight: '800' },
  empty: { color: colors.muted, textAlign: 'center', padding: 30 },
});
