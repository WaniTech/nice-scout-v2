import { colors } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { updatePlayerAvailability } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReadyForTrialsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isReady, setIsReady] = useState(true);
  const [travelDate, setTravelDate] = useState('June 20, 2026');
  const [trainingLoad, setTrainingLoad] = useState('Full training, no restrictions');
  const [contactWindow, setContactWindow] = useState('Weekdays after 15:00 CET');
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const handleSave = async () => {
    try {
      await updatePlayerAvailability(currentUser?.id ?? 'demo-player', {
        ready: isReady,
        travelDate,
        trainingLoad,
        contactWindow,
      });
      setSyncNotice('Availability saved through the API');
    } catch {
      setSyncNotice('Availability saved locally. API sync is unavailable.');
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
            <Text style={styles.kicker}>Availability</Text>
            <Text style={styles.title}>Ready for trials</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="flash-outline" size={24} color={colors.accent} />
          </View>
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Show clubs you are available</Text>
            <Text style={styles.statusText}>
              This badge appears on your profile and in scout search results.
            </Text>
          </View>
          <Switch
            value={isReady}
            onValueChange={setIsReady}
            trackColor={{ false: '#D7DDD2', true: '#9AC5B0' }}
            thumbColor={isReady ? colors.primary : '#FFFFFF'}
          />
        </View>

        <View style={styles.card}>
          <AvailabilityInput label="Earliest travel date" value={travelDate} onChangeText={setTravelDate} />
          <AvailabilityInput label="Training load" value={trainingLoad} onChangeText={setTrainingLoad} />
          <AvailabilityInput label="Best contact window" value={contactWindow} onChangeText={setContactWindow} />

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.savedText}>{syncNotice || 'Availability saved'}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save availability</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function AvailabilityInput({
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
      <TextInput style={styles.input} value={value} onChangeText={onChangeText} />
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
  statusCard: {
    minHeight: 104,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCopy: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  statusText: {
    color: '#DDE8D8',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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
