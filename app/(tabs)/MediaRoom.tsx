import { colors, mediaClips, PlayerClip, PlayerClipStatus } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    createPlayerClip,
    deletePlayerClip,
    getPlayerClips,
    PlayerClipPayload,
    updatePlayerClip,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const statusOptions: PlayerClipStatus[] = ['Draft', 'Scout-ready', 'Sent'];
const filterOptions: ('All' | PlayerClipStatus)[] = ['All', 'Scout-ready', 'Sent', 'Draft'];

const clipStatusBadgeColors: Record<PlayerClipStatus, { bg: string; text: string }> = {
  Draft: { bg: '#F1F4F0', text: '#5E6B5D' },
  'Scout-ready': { bg: '#DCFCE7', text: '#15803D' },
  Sent: { bg: '#EFF6FF', text: '#2563EB' },
};

const emptyForm: PlayerClipPayload = {
  title: '',
  type: 'Highlight reel',
  focus: '',
  opponent: '',
  date: '2026-06-13',
  duration: '00:45',
  status: 'Draft',
  visibility: 'Private link',
  tags: [],
  notes: '',
};

export default function MediaRoomPage() {
  const { currentUser } = useAuth();
  const [clips, setClips] = useState<PlayerClip[]>(mediaClips);
  const [form, setForm] = useState<PlayerClipPayload>(emptyForm);
  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('1v1, pressing');
  const [syncNotice, setSyncNotice] = useState('');
  const [activeFilter, setActiveFilter] = useState<('All' | PlayerClipStatus)>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const playerId = currentUser?.id ?? 'demo-player';
  const stats = useMemo(() => {
    const totalViews = clips.reduce((sum, clip) => sum + clip.views, 0);
    const scoutReady = clips.filter((clip) => clip.status === 'Scout-ready').length;
    const sent = clips.filter((clip) => clip.status === 'Sent').length;
    const draft = clips.filter((clip) => clip.status === 'Draft').length;
    return { totalViews, scoutReady, sent, draft };
  }, [clips]);

  const filteredClips = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clips.filter((clip) => {
      const matchesFilter = activeFilter === 'All' || clip.status === activeFilter;
      const matchesQuery =
        !q ||
        [clip.title, clip.focus, clip.opponent, clip.type, clip.tags.join(' ')]
          .join(' ')
          .toLowerCase()
          .includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [clips, activeFilter, searchQuery]);

  useEffect(() => {
    let ignore = false;

    async function loadClips() {
      try {
        const remoteClips = await getPlayerClips(playerId);

        if (!ignore) {
          setClips(remoteClips);
          setSyncNotice('Media room synced with API');
        }
      } catch {
        if (!ignore) {
          setSyncNotice('Using local demo clips while API is unavailable');
        }
      }
    }

    loadClips();

    return () => {
      ignore = true;
    };
  }, [playerId]);

  const resetForm = () => {
    setForm(emptyForm);
    setTagInput('1v1, pressing');
    setEditingClipId(null);
  };

  const handleEdit = (clip: PlayerClip) => {
    setEditingClipId(clip.id);
    setForm({
      title: clip.title,
      type: clip.type,
      focus: clip.focus,
      opponent: clip.opponent,
      date: clip.date,
      duration: clip.duration,
      status: clip.status,
      visibility: clip.visibility,
      tags: clip.tags,
      notes: clip.notes,
      attachedToOpportunityId: clip.attachedToOpportunityId,
    });
    setTagInput(clip.tags.join(', '));
  };

  const handleSave = async () => {
    const payload = {
      ...form,
      title: form.title.trim() || 'Untitled player clip',
      tags: tagInput
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      if (editingClipId) {
        const updatedClip = await updatePlayerClip(playerId, editingClipId, payload);
        setClips((currentClips) =>
          currentClips.map((clip) => (clip.id === updatedClip.id ? updatedClip : clip)),
        );
        setSyncNotice('Clip updated through the API');
      } else {
        const createdClip = await createPlayerClip(playerId, payload);
        setClips((currentClips) => [createdClip, ...currentClips]);
        setSyncNotice('Clip created through the API');
      }

      resetForm();
    } catch {
      const now = new Date().toISOString();

      if (editingClipId) {
        setClips((currentClips) =>
          currentClips.map((clip) =>
            clip.id === editingClipId ? { ...clip, ...payload, updatedAt: now } : clip,
          ),
        );
        setSyncNotice('Clip updated locally. API sync is unavailable.');
      } else {
        setClips((currentClips) => [
          {
            ...payload,
            id: `local-${Date.now()}`,
            playerId,
            views: 0,
            createdAt: now,
            updatedAt: now,
          },
          ...currentClips,
        ]);
        setSyncNotice('Clip created locally. API sync is unavailable.');
      }

      resetForm();
    }
  };

  const handleStatusChange = async (clip: PlayerClip, status: PlayerClipStatus) => {
    const previousClips = clips;
    setClips((currentClips) =>
      currentClips.map((currentClip) =>
        currentClip.id === clip.id ? { ...currentClip, status } : currentClip,
      ),
    );

    try {
      const updatedClip = await updatePlayerClip(playerId, clip.id, { status });
      setClips((currentClips) =>
        currentClips.map((currentClip) =>
          currentClip.id === updatedClip.id ? updatedClip : currentClip,
        ),
      );
      setSyncNotice(`Clip marked ${status}`);
    } catch {
      setClips(previousClips);
      setSyncNotice('Could not sync clip status. Try again when the API is running.');
    }
  };

  const handleDelete = async (clipId: string) => {
    const previousClips = clips;
    setClips((currentClips) => currentClips.filter((clip) => clip.id !== clipId));

    try {
      await deletePlayerClip(playerId, clipId);
      setSyncNotice('Clip deleted through the API');
    } catch {
      setClips(previousClips);
      setSyncNotice('Could not delete clip through the API.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Media room</Text>
        <Text style={styles.title}>Scout-ready video vault</Text>
        <Text style={styles.subtitle}>
          Package clips, full matches, and data videos for each recruitment conversation.
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={[styles.summaryCard, activeFilter === 'All' && styles.summaryCardActive]}
          onPress={() => setActiveFilter('All')}
        >
          <Text style={styles.summaryValue}>{clips.length}</Text>
          <Text style={styles.summaryLabel}>Total Clips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryCard, activeFilter === 'Scout-ready' && styles.summaryCardActive]}
          onPress={() => setActiveFilter(activeFilter === 'Scout-ready' ? 'All' : 'Scout-ready')}
        >
          <Text style={styles.summaryValue}>{stats.scoutReady}</Text>
          <Text style={styles.summaryLabel}>Scout-Ready</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryCard, activeFilter === 'Sent' && styles.summaryCardActive]}
          onPress={() => setActiveFilter(activeFilter === 'Sent' ? 'All' : 'Sent')}
        >
          <Text style={styles.summaryValue}>{stats.sent}</Text>
          <Text style={styles.summaryLabel}>Sent</Text>
        </TouchableOpacity>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{stats.totalViews}</Text>
          <Text style={styles.summaryLabel}>Scout Views</Text>
        </View>
      </View>

      <View style={styles.searchShell}>
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Filter clips by skill, opponent, or tags..."
          placeholderTextColor="#899188"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterOptions.map((filter) => {
          const selected = filter === activeFilter;
          const count =
            filter === 'All'
              ? clips.length
              : clips.filter((c) => c.status === filter).length;
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

      <View style={styles.pipelineCard}>
        <View style={styles.pipelineHeader}>
          <Text style={styles.pipelineTitle}>Clip pipeline</Text>
          <Text style={styles.pipelineMeta}>{clips.length} active assets</Text>
        </View>
        <View style={styles.pipelineRow}>
          {statusOptions.map((status) => {
            const count = clips.filter((clip) => clip.status === status).length;
            return (
              <View key={status} style={styles.pipelineItem}>
                <Text style={styles.pipelineValue}>{count}</Text>
                <Text style={styles.pipelineLabel}>{status}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formHeader}>
          <Text style={styles.sectionTitle}>{editingClipId ? 'Edit clip' : 'Add clip'}</Text>
          {editingClipId ? (
            <TouchableOpacity style={styles.clearButton} onPress={resetForm}>
              <Ionicons name="close" size={17} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <MediaInput label="Title" value={form.title} onChangeText={(title) => setForm({ ...form, title })} />
        <View style={styles.formSplit}>
          <MediaInput label="Type" value={form.type} onChangeText={(type) => setForm({ ...form, type })} />
          <MediaInput
            label="Duration"
            value={form.duration}
            onChangeText={(duration) => setForm({ ...form, duration })}
          />
        </View>
        <MediaInput label="Focus" value={form.focus} onChangeText={(focus) => setForm({ ...form, focus })} />
        <View style={styles.formSplit}>
          <MediaInput
            label="Opponent"
            value={form.opponent}
            onChangeText={(opponent) => setForm({ ...form, opponent })}
          />
          <MediaInput label="Date" value={form.date} onChangeText={(date) => setForm({ ...form, date })} />
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          {statusOptions.map((status) => {
            const selected = form.status === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusChip, selected && styles.statusChipActive]}
                onPress={() => setForm({ ...form, status })}
              >
                <Text style={[styles.statusChipText, selected && styles.statusChipTextActive]}>{status}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <MediaInput label="Tags" value={tagInput} onChangeText={setTagInput} />
        <MediaInput
          label="Notes"
          value={form.notes}
          onChangeText={(notes) => setForm({ ...form, notes })}
          multiline
        />

        {syncNotice ? (
          <View style={styles.notice}>
            <Ionicons name="cloud-done-outline" size={17} color={colors.primary} />
            <Text style={styles.noticeText}>{syncNotice}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{editingClipId ? 'Save clip changes' : 'Create clip'}</Text>
          <Ionicons name={editingClipId ? 'checkmark' : 'add'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Clip library ({filteredClips.length})</Text>
      </View>

      {filteredClips.map((clip) => {
        const badgeColor = clipStatusBadgeColors[clip.status] || clipStatusBadgeColors.Draft;
        return (
          <View key={clip.id} style={styles.clipCard}>
            <View style={styles.clipTop}>
              <View style={styles.thumbnail}>
                <Ionicons name="play" size={22} color="#FFFFFF" />
              </View>
              <View style={styles.clipCopy}>
                <Text style={styles.clipTitle}>{clip.title}</Text>
                <Text style={styles.clipMeta}>
                  {clip.type} • {clip.duration} • {clip.views} views
                </Text>
              </View>
              <View style={[styles.clipStatus, { backgroundColor: badgeColor.bg }]}>
                <Text style={[styles.clipStatusText, { color: badgeColor.text }]}>{clip.status}</Text>
              </View>
            </View>

            <Text style={styles.clipFocus}>{clip.focus}</Text>
            {clip.opponent ? (
              <Text style={styles.clipOpponent}>Opponent: {clip.opponent} ({clip.date})</Text>
            ) : null}
            {clip.notes ? <Text style={styles.clipNotes}>{clip.notes}</Text> : null}

            <View style={styles.tagRow}>
              {clip.tags.map((tag) => (
                <Text key={`${clip.id}-${tag}`} style={styles.tag}>
                  {tag}
                </Text>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.smallAction} onPress={() => handleEdit(clip)}>
                <Ionicons name="create-outline" size={16} color={colors.primary} />
                <Text style={styles.smallActionText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() => handleStatusChange(clip, clip.status === 'Sent' ? 'Scout-ready' : 'Sent')}
              >
                <Ionicons name="send-outline" size={16} color={colors.primary} />
                <Text style={styles.smallActionText}>{clip.status === 'Sent' ? 'Ready' : 'Send to Scout'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallAction}
                onPress={() => setSyncNotice(`Share link copied: nicescout.app/clips/${clip.id}`)}
              >
                <Ionicons name="share-outline" size={16} color={colors.primary} />
                <Text style={styles.smallActionText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(clip.id)}>
                <Ionicons name="trash-outline" size={16} color={colors.red} />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {filteredClips.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="videocam-off-outline" size={32} color={colors.muted} />
          <Text style={styles.emptyTitle}>No clips found</Text>
          <Text style={styles.emptyText}>Try selecting another status filter or change your search query.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function SummaryCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function MediaInput({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
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
    paddingTop: 58,
    paddingBottom: 104,
  },
  header: {
    marginBottom: 16,
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    justifyContent: 'center',
  },
  summaryCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 21,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  searchShell: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    paddingVertical: 10,
  },
  filterRow: {
    gap: 8,
    paddingVertical: 12,
  },
  filterChip: {
    minHeight: 36,
    borderRadius: 8,
    paddingHorizontal: 12,
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
    fontSize: 12,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  pipelineCard: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 16,
  },
  pipelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  pipelineTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  pipelineMeta: {
    color: '#DDE8D8',
    fontSize: 12,
    fontWeight: '800',
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  pipelineItem: {
    flex: 1,
    minHeight: 68,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 10,
    justifyContent: 'center',
  },
  pipelineValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  pipelineLabel: {
    color: '#DDE8D8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  formCard: {
    marginTop: 14,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSplit: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
    color: colors.ink,
    fontSize: 14,
    paddingHorizontal: 12,
  },
  textArea: {
    minHeight: 82,
    paddingTop: 10,
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFCF8',
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  notice: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  clipCard: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    marginBottom: 12,
  },
  clipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clipCopy: {
    flex: 1,
  },
  clipTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  clipMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  clipStatus: {
    borderRadius: 8,
    backgroundColor: '#F7F2E6',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clipStatusText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
  },
  clipFocus: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
  },
  clipOpponent: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  clipNotes: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 12,
  },
  tag: {
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  smallAction: {
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  smallActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  deleteAction: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FBE9E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
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
