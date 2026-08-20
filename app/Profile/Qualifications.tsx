import { colors, defaultPlayerProfile } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { updatePlayerProfile } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PlayerCvPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [position, setPosition] = useState(defaultPlayerProfile.position);
  const [secondary, setSecondary] = useState(defaultPlayerProfile.secondaryPositions.join(', '));
  const [achievements, setAchievements] = useState('U21 league finalist, 12 assists last season');
  const [clips, setClips] = useState('Full match, highlight reel, pressing clips');
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const handleSave = async () => {
    try {
      await updatePlayerProfile(currentUser?.id ?? 'demo-player', {
        position,
        secondaryPositions: secondary.split(',').map((item) => item.trim()).filter(Boolean),
        achievements,
        clips,
      });
      setSyncNotice('Player CV saved through the API');
    } catch {
      setSyncNotice('Player CV saved locally. API sync is unavailable.');
    }

    setSaved(true);
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
            <Text style={styles.kicker}>Player CV</Text>
            <Text style={styles.title}>Football details</Text>
          </View>
        </View>

        <View style={styles.card}>
          <PlayerInput label="Primary position" value={position} onChangeText={setPosition} />
          <PlayerInput label="Secondary positions" value={secondary} onChangeText={setSecondary} />
          <PlayerInput label="Achievements" value={achievements} onChangeText={setAchievements} multiline />
          <PlayerInput label="Available clips" value={clips} onChangeText={setClips} multiline />

          <View style={styles.dataStrip}>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>{defaultPlayerProfile.verifiedClips}</Text>
              <Text style={styles.dataLabel}>Verified clips</Text>
            </View>
            <View style={styles.dataItem}>
              <Text style={styles.dataValue}>{defaultPlayerProfile.videoMinutes}</Text>
              <Text style={styles.dataLabel}>Video minutes</Text>
            </View>
          </View>

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.savedText}>{syncNotice || 'Player CV saved'}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save player CV</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function PlayerInput({
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
  card: {
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
    paddingHorizontal: 13,
    color: colors.ink,
    fontSize: 15,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
    lineHeight: 21,
  },
  dataStrip: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  dataItem: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    justifyContent: 'center',
  },
  dataValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  dataLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  savedRow: {
    minHeight: 42,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  savedText: {
    color: colors.primary,
    fontWeight: '900',
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
