import { colors } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { updatePlayerPreferences } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HiddenOpportunitiesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [locations, setLocations] = useState('No long-distance unpaid trials');
  const [formats, setFormats] = useState('Volunteer roles, no video review only');
  const [clubs, setClubs] = useState('Clubs without accommodation support');
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const handleSave = async () => {
    try {
      await updatePlayerPreferences(currentUser?.id ?? 'demo-player', {
        hiddenRules: {
          locations,
          formats,
          clubs,
        },
      });
      setSyncNotice('Hidden rules saved through the API');
    } catch {
      setSyncNotice('Hidden rules saved locally. API sync is unavailable.');
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
            <Text style={styles.kicker}>Hidden opportunities</Text>
            <Text style={styles.title}>Keep poor fits out</Text>
          </View>
        </View>

        <View style={styles.card}>
          <HiddenInput label="Hide locations or travel terms" value={locations} onChangeText={setLocations} />
          <HiddenInput label="Hide trial formats" value={formats} onChangeText={setFormats} />
          <HiddenInput label="Hide club conditions" value={clubs} onChangeText={setClubs} />

          <View style={styles.notice}>
            <Ionicons name="filter-outline" size={19} color={colors.primary} />
            <Text style={styles.noticeText}>
              Hidden rules only affect recommendations. Scouts can still message you if you apply directly.
            </Text>
          </View>

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.savedText}>{syncNotice || 'Hidden rules saved'}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save hidden rules</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function HiddenInput({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textArea}
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
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
  textArea: {
    minHeight: 86,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#FBFCF8',
    paddingHorizontal: 13,
    paddingTop: 12,
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  notice: {
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    color: colors.primary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
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
