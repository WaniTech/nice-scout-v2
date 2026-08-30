import {
  CareerMilestone,
  colors,
  defaultPassport,
  defaultPlayerProfile,
  mediaClips,
  performanceStats,
  PlayerPassport,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { addCareerMilestone, getPlayerPassport } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();
  const [profileImage, setProfileImage] = useState('');
  const [passport, setPassport] = useState<PlayerPassport>(defaultPassport);
  const [shareNotice, setShareNotice] = useState('');
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  const [newClub, setNewClub] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newApps, setNewApps] = useState('');
  const [newGoals, setNewGoals] = useState('');
  const newCategory = 'Club';

  const playerId = currentUser?.id ?? 'demo-player';

  useEffect(() => {
    let ignore = false;

    async function loadPassport() {
      try {
        const data = await getPlayerPassport(playerId);
        if (!ignore && data) {
          setPassport(data);
        }
      } catch {
        // Fallback to defaultPassport
      }
    }

    loadPassport();

    return () => {
      ignore = true;
    };
  }, [playerId]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSharePassport = () => {
    setShareNotice(`Passport link copied: ${passport.shareableUrl}`);
    setTimeout(() => setShareNotice(''), 4000);
  };

  const handleAddMilestone = async () => {
    if (!newClub || !newRole || !newPeriod) return;

    try {
      const updated = await addCareerMilestone(playerId, {
        club: newClub,
        role: newRole,
        period: newPeriod,
        appearances: Number(newApps) || 0,
        goals: Number(newGoals) || 0,
        category: newCategory,
      });
      setPassport(updated);
      setNewClub('');
      setNewRole('');
      setNewPeriod('');
      setNewApps('');
      setNewGoals('');
      setShowAddMilestone(false);
      setShareNotice('Milestone added to your verified career timeline');
    } catch {
      const localMilestone: CareerMilestone = {
        id: `milestone-${Date.now()}`,
        club: newClub,
        role: newRole,
        period: newPeriod,
        appearances: Number(newApps) || 0,
        goals: Number(newGoals) || 0,
        assists: 0,
        verified: true,
        category: newCategory,
      };
      setPassport((prev) => ({
        ...prev,
        milestones: [localMilestone, ...prev.milestones],
      }));
      setShowAddMilestone(false);
    }
  };

  const handleSignOut = () => {
    signOut();
  };

  const name = currentUser?.name ?? defaultPlayerProfile.name;
  const position = currentUser?.position ?? defaultPlayerProfile.position;
  const location = currentUser?.location ?? defaultPlayerProfile.location;
  const clubStatus = currentUser?.clubStatus ?? defaultPlayerProfile.clubStatus;
  const readyClips = mediaClips.filter((clip) => clip.status === 'Scout-ready' || clip.status === 'Sent').length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Player profile</Text>
          <Text style={styles.title}>Your market card</Text>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/Editprofile')}>
          <Ionicons name="create-outline" size={19} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.profilePanel}>
        <TouchableOpacity style={styles.avatarShell} onPress={pickImage}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Text style={styles.avatarInitials}>
              {name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          )}
          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={14} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.profileName}>{name}</Text>
        <Text style={styles.profilePosition}>{position}</Text>

        <View style={styles.profileMetaRow}>
          <View style={styles.profileMetaItem}>
            <Ionicons name="location-outline" size={16} color={colors.primary} />
            <Text style={styles.profileMetaText}>{location}</Text>
          </View>
          <View style={styles.profileMetaItem}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={styles.profileMetaText}>{clubStatus}</Text>
          </View>
        </View>

        <Text style={styles.headline}>{defaultPlayerProfile.headline}</Text>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{defaultPlayerProfile.age}</Text>
          <Text style={styles.infoLabel}>Age</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{defaultPlayerProfile.height}</Text>
          <Text style={styles.infoLabel}>Height</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoValue}>{defaultPlayerProfile.foot}</Text>
          <Text style={styles.infoLabel}>Strong foot</Text>
        </View>
      </View>

      {/* Digital Scouting Passport & Verified Badge Card */}
      <View style={styles.passportCard}>
        <View style={styles.passportHeader}>
          <View style={styles.passportBadge}>
            <Ionicons name="ribbon" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionKicker}>Digital Scouting Passport</Text>
            <Text style={styles.passportTitle}>{passport.metrics.passportStatus}</Text>
          </View>
          <View style={styles.verificationScorePill}>
            <Text style={styles.verificationScoreVal}>{passport.verificationScore}%</Text>
            <Text style={styles.verificationScoreLbl}>Verified</Text>
          </View>
        </View>

        <View style={styles.passportDetailList}>
          <View style={styles.passportDetailRow}>
            <Text style={styles.passportFieldLabel}>Talent ID / FIFA Code</Text>
            <Text style={styles.passportFieldValue}>{passport.metrics.fifaId}</Text>
          </View>
          <View style={styles.passportDetailRow}>
            <Text style={styles.passportFieldLabel}>Verification Tier</Text>
            <Text style={styles.passportFieldValue}>{passport.metrics.verificationTier}</Text>
          </View>
          <View style={styles.passportDetailRow}>
            <Text style={styles.passportFieldLabel}>Work Permit / Visa</Text>
            <Text style={styles.passportFieldValue}>{passport.metrics.workPermitStatus}</Text>
          </View>
          <View style={styles.passportDetailRow}>
            <Text style={styles.passportFieldLabel}>Representation</Text>
            <Text style={styles.passportFieldValue}>{passport.metrics.agencyRepresentation}</Text>
          </View>
          <View style={styles.passportDetailRow}>
            <Text style={styles.passportFieldLabel}>Medical Status</Text>
            <Text style={styles.passportFieldValue}>{passport.metrics.medicalClearance}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.sharePassportButton} onPress={handleSharePassport}>
          <Ionicons name="share-social-outline" size={17} color="#FFFFFF" />
          <Text style={styles.sharePassportText}>Share Verified Scout Passport</Text>
        </TouchableOpacity>

        {shareNotice ? (
          <View style={styles.shareNoticeBox}>
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
            <Text style={styles.shareNoticeText}>{shareNotice}</Text>
          </View>
        ) : null}
      </View>

      {/* Career Timeline & Club Appearances */}
      <View style={styles.careerTimelineCard}>
        <View style={styles.careerHeader}>
          <View>
            <Text style={styles.sectionKicker}>Career Pathway</Text>
            <Text style={styles.sectionTitle}>Club History & Milestones</Text>
          </View>
          <TouchableOpacity
            style={styles.addMilestoneToggle}
            onPress={() => setShowAddMilestone(!showAddMilestone)}
          >
            <Ionicons name={showAddMilestone ? 'close' : 'add'} size={18} color={colors.primary} />
            <Text style={styles.addMilestoneToggleText}>{showAddMilestone ? 'Cancel' : 'Add'}</Text>
          </TouchableOpacity>
        </View>

        {showAddMilestone ? (
          <View style={styles.addMilestoneForm}>
            <TextInput
              style={styles.milestoneInput}
              placeholder="Club / Academy Name (e.g. FC Midtjylland)"
              placeholderTextColor="#94A3B8"
              value={newClub}
              onChangeText={setNewClub}
            />
            <TextInput
              style={styles.milestoneInput}
              placeholder="Role / Squad (e.g. U19 Starter / First Team Bridge)"
              placeholderTextColor="#94A3B8"
              value={newRole}
              onChangeText={setNewRole}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                style={[styles.milestoneInput, { flex: 1 }]}
                placeholder="Period (e.g. 2024-2025)"
                placeholderTextColor="#94A3B8"
                value={newPeriod}
                onChangeText={setNewPeriod}
              />
              <TextInput
                style={[styles.milestoneInput, { width: 80 }]}
                placeholder="Apps"
                placeholderTextColor="#94A3B8"
                value={newApps}
                onChangeText={setNewApps}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.milestoneInput, { width: 80 }]}
                placeholder="Goals"
                placeholderTextColor="#94A3B8"
                value={newGoals}
                onChangeText={setNewGoals}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity style={styles.submitMilestoneBtn} onPress={handleAddMilestone}>
              <Text style={styles.submitMilestoneText}>Add to Passport</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.milestonesList}>
          {passport.milestones.map((m) => (
            <View key={m.id} style={styles.milestoneItem}>
              <View style={styles.milestoneDot} />
              <View style={{ flex: 1 }}>
                <View style={styles.milestoneTopLine}>
                  <Text style={styles.milestoneClub}>{m.club}</Text>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
                    <Text style={styles.verifiedTagText}>Verified</Text>
                  </View>
                </View>
                <Text style={styles.milestoneRole}>{m.role} • {m.period}</Text>
                <Text style={styles.milestoneStats}>
                  {m.appearances} appearances • {m.goals} goals • {m.assists} assists ({m.category})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Player strengths</Text>
      </View>
      <View style={styles.strengthsRow}>
        {defaultPlayerProfile.strengths.map((strength) => (
          <Text key={strength} style={styles.strengthChip}>{strength}</Text>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Verified metrics</Text>
      </View>
      <View style={styles.metricList}>
        {performanceStats.map((stat) => (
          <View key={stat.label} style={styles.metricRow}>
            <View>
              <Text style={styles.metricLabel}>{stat.label}</Text>
              <Text style={styles.metricTrend}>{stat.trend} recent form</Text>
            </View>
            <Text style={styles.metricValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Profile tools</Text>
      </View>
      <View style={styles.toolList}>
        <ProfileTool
          icon="ribbon-outline"
          title="Player CV"
          description="Position, physical details, clips, and achievements."
          onPress={() => router.push('/Profile/Qualifications')}
        />
        <ProfileTool
          icon="options-outline"
          title="Trial preferences"
          description="Preferred markets, contract type, travel window, and salary."
          onPress={() => router.push('/Profile/JobPreferences')}
        />
        <ProfileTool
          icon="eye-off-outline"
          title="Hidden opportunities"
          description="Exclude leagues, locations, or trial formats you do not want."
          onPress={() => router.push('/Profile/HiddenCriteria')}
        />
        <ProfileTool
          icon="flash-outline"
          title="Available for trials"
          description="Tell clubs when you can travel and train."
          onPress={() => router.push('/Profile/ReadyToWork')}
        />
        <ProfileTool
          icon="videocam-outline"
          title="Media room"
          description={`${readyClips} clips ready for club conversations and scout follow-ups.`}
          onPress={() => router.push('/MediaRoom')}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={19} color={colors.red} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProfileTool({
  icon,
  title,
  description,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.toolRow} onPress={onPress}>
      <View style={styles.toolIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.toolCopy}>
        <Text style={styles.toolTitle}>{title}</Text>
        <Text style={styles.toolDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  editButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePanel: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    alignItems: 'center',
  },
  avatarShell: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  profileImage: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  avatarInitials: {
    color: colors.accent,
    fontSize: 30,
    fontWeight: '900',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 3,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '900',
  },
  profilePosition: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 4,
  },
  profileMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  profileMetaItem: {
    minHeight: 34,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  profileMetaText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  headline: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 14,
    textAlign: 'center',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  infoCard: {
    flex: 1,
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    justifyContent: 'center',
  },
  infoValue: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 3,
  },
  passportCard: {
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
  passportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  passportBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionKicker: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  verificationScorePill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignItems: 'center',
  },
  verificationScoreVal: {
    color: '#0D5C3A',
    fontSize: 16,
    fontWeight: '900',
  },
  verificationScoreLbl: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  passportDetailList: {
    gap: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceAlt,
    marginBottom: 14,
  },
  passportDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passportFieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  passportFieldValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  sharePassportButton: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sharePassportText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  shareNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  shareNoticeText: {
    color: '#0D5C3A',
    fontSize: 12,
    fontWeight: '700',
  },
  careerTimelineCard: {
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
  careerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addMilestoneToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMilestoneToggleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  addMilestoneForm: {
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    gap: 8,
  },
  milestoneInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.ink,
  },
  submitMilestoneBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitMilestoneText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  milestonesList: {
    gap: 12,
  },
  milestoneItem: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceAlt,
  },
  milestoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  milestoneTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneClub: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedTagText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  milestoneRole: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  milestoneStats: {
    color: colors.ink,
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  strengthChip: {
    color: colors.primary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontWeight: '900',
  },
  metricList: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  metricRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  metricLabel: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  metricTrend: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  metricValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  toolList: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  toolRow: {
    minHeight: 78,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toolIcon: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolCopy: {
    flex: 1,
  },
  toolTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  toolDescription: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  signOutButton: {
    minHeight: 50,
    marginTop: 18,
    borderRadius: 8,
    backgroundColor: '#FBE9E5',
    borderWidth: 1,
    borderColor: '#F0C6BE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: colors.red,
    fontSize: 15,
    fontWeight: '900',
  },
});
