import {
    colors,
    defaultTelestrationReport,
    mediaClips,
    PlayerClip,
    PlayerClipStatus,
    VideoAnnotationReport,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
    addVideoTelestration,
    createPlayerClip,
    deletePlayerClip,
    deleteVideoAnnotation,
    getPlayerClips,
    getVideoAnnotations,
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
  const [annotationReport, setAnnotationReport] = useState<VideoAnnotationReport>(defaultTelestrationReport);
  const [selectedClipForTelestration, setSelectedClipForTelestration] = useState<string>('clip-1');
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [newAnnotationTitle, setNewAnnotationTitle] = useState('');
  const [newAnnotationTimestamp, setNewAnnotationTimestamp] = useState('15.0');
  const [newAnnotationCategory, setNewAnnotationCategory] = useState('Attacking Transition');
  const [newAnnotationNote, setNewAnnotationNote] = useState('');
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

    async function loadData() {
      try {
        const [remoteClips, remoteAnnotations] = await Promise.all([
          getPlayerClips(playerId),
          getVideoAnnotations(playerId),
        ]);

        if (!ignore) {
          setClips(remoteClips);
          if (remoteAnnotations) setAnnotationReport(remoteAnnotations);
          setSyncNotice('Media room & telestrations synced with API');
        }
      } catch {
        if (!ignore) {
          setSyncNotice('Using local demo clips while API is unavailable');
        }
      }
    }

    loadData();

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

  const handleAddAnnotation = async () => {
    if (!newAnnotationTitle) return;

    try {
      const added = await addVideoTelestration(playerId, {
        clipId: selectedClipForTelestration,
        title: newAnnotationTitle,
        timestampSeconds: parseFloat(newAnnotationTimestamp) || 15.0,
        tacticalCategory: newAnnotationCategory,
        coachingNote: newAnnotationNote,
        verifiedByScout: 'Mikkel Soren (FC Midtjylland)',
      });

      setAnnotationReport((prev) => ({
        ...prev,
        annotations: [added, ...prev.annotations],
        summary: {
          ...prev.summary,
          totalAnnotations: prev.summary.totalAnnotations + 1,
          verifiedCount: prev.summary.verifiedCount + 1,
        },
      }));

      setNewAnnotationTitle('');
      setNewAnnotationNote('');
      setShowAnnotationModal(false);
      setSyncNotice('Tactical telestration saved to clip!');
    } catch {
      setShowAnnotationModal(false);
    }
  };

  const handleDeleteAnnotation = async (annotationId: string) => {
    try {
      await deleteVideoAnnotation(playerId, annotationId);
      setAnnotationReport((prev) => ({
        ...prev,
        annotations: prev.annotations.filter((a) => a.id !== annotationId),
        summary: {
          ...prev.summary,
          totalAnnotations: Math.max(0, prev.summary.totalAnnotations - 1),
        },
      }));
      setSyncNotice('Telestration annotation removed.');
    } catch {
      setSyncNotice('Could not remove annotation.');
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

      {/* Video Telestration & Tactical Markup Suite Card */}
      <View style={styles.telestrationCard}>
        <View style={styles.telestrationHeader}>
          <View style={styles.telestrationIcon}>
            <Ionicons name="color-wand" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionKicker}>Video Markup & Telestration</Text>
            <Text style={styles.telestrationTitle}>Tactical Annotations</Text>
          </View>
          <TouchableOpacity
            style={styles.addTelestrationBtn}
            onPress={() => setShowAnnotationModal(!showAnnotationModal)}
          >
            <Ionicons name={showAnnotationModal ? 'close' : 'add'} size={18} color={colors.primary} />
            <Text style={styles.addTelestrationBtnText}>{showAnnotationModal ? 'Cancel' : 'Annotate'}</Text>
          </TouchableOpacity>
        </View>

        {showAnnotationModal ? (
          <View style={styles.annotationForm}>
            <Text style={styles.formSectionTitle}>Add Tactical Telestration Markup</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Markup Title (e.g. 1v1 Burst & Delivery)"
              placeholderTextColor="#94A3B8"
              value={newAnnotationTitle}
              onChangeText={setNewAnnotationTitle}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="Timestamp (seconds, e.g. 18.5)"
                placeholderTextColor="#94A3B8"
                value={newAnnotationTimestamp}
                onChangeText={setNewAnnotationTimestamp}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="Tactical Category"
                placeholderTextColor="#94A3B8"
                value={newAnnotationCategory}
                onChangeText={setNewAnnotationCategory}
              />
            </View>
            <TextInput
              style={[styles.formInput, { height: 60 }]}
              placeholder="Coaching note / tactical breakdown..."
              placeholderTextColor="#94A3B8"
              value={newAnnotationNote}
              onChangeText={setNewAnnotationNote}
              multiline
            />
            <TouchableOpacity style={styles.submitAnnotationBtn} onPress={handleAddAnnotation}>
              <Text style={styles.submitAnnotationText}>Save Telestration</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.annotationList}>
          {annotationReport.annotations.map((a) => (
            <View key={a.id} style={styles.annotationItem}>
              <View style={styles.annotationTop}>
                <View style={styles.timeTag}>
                  <Ionicons name="time" size={12} color={colors.primary} />
                  <Text style={styles.timeTagText}>{a.timestampFormatted}</Text>
                </View>
                <Text style={styles.annotationName}>{a.title}</Text>
                <TouchableOpacity
                  style={styles.deleteAnnotationBtn}
                  onPress={() => handleDeleteAnnotation(a.id)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.red} />
                </TouchableOpacity>
              </View>
              <Text style={styles.annotationNote}>{a.coachingNote}</Text>
              {a.verifiedByScout ? (
                <View style={styles.verifiedScoutRow}>
                  <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                  <Text style={styles.verifiedScoutText}>Verified: {a.verifiedByScout}</Text>
                </View>
              ) : null}
            </View>
          ))}
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
  },
  summaryCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  summaryCardActive: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  telestrationCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  telestrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  telestrationIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  telestrationTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  addTelestrationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTelestrationBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  annotationForm: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  formSectionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  formInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  submitAnnotationBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitAnnotationText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  annotationList: {
    gap: 10,
  },
  annotationItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  annotationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  timeTagText: {
    color: '#0D5C3A',
    fontSize: 11,
    fontWeight: '800',
  },
  annotationName: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  deleteAnnotationBtn: {
    padding: 4,
  },
  annotationNote: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  verifiedScoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedScoutText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '700',
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
    marginTop: 14,
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
  pipelineCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    padding: 18,
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
    letterSpacing: -0.3,
  },
  pipelineTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  pipelineMeta: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  pipelineRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  pipelineItem: {
    flex: 1,
    minHeight: 68,
    borderRadius: 12,
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
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  formCard: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  clearButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surfaceAlt,
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
    marginBottom: 14,
  },
  statusChip: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  statusChipTextActive: {
    color: '#FFFFFF',
  },
  notice: {
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    color: '#0D5C3A',
    fontSize: 12,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
  },
  clipCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  clipTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: 12,
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
    fontWeight: '800',
  },
  clipMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  clipStatus: {
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  clipStatusText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  clipFocus: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  smallAction: {
    minHeight: 38,
    borderRadius: 10,
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
    fontWeight: '800',
  },
  deleteAction: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
