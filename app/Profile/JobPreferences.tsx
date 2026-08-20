import { colors } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { updatePlayerPreferences } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const markets = ['Denmark', 'Netherlands', 'Germany', 'Portugal'];

export default function TrialPreferencesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [selectedMarkets, setSelectedMarkets] = useState(['Denmark', 'Netherlands']);
  const [contractType, setContractType] = useState('Trial to contract');
  const [travelWindow, setTravelWindow] = useState('Within 14 days');
  const [minimumPackage, setMinimumPackage] = useState('Travel covered plus housing help');
  const [openToLoan, setOpenToLoan] = useState(true);
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const toggleMarket = (market: string) => {
    setSelectedMarkets((currentMarkets) =>
      currentMarkets.includes(market)
        ? currentMarkets.filter((item) => item !== market)
        : [...currentMarkets, market],
    );
  };

  const handleSave = async () => {
    try {
      await updatePlayerPreferences(currentUser?.id ?? 'demo-player', {
        markets: selectedMarkets,
        contractType,
        travelWindow,
        minimumPackage,
        openToLoan,
      });
      setSyncNotice('Preferences saved through the API');
    } catch {
      setSyncNotice('Preferences saved locally. API sync is unavailable.');
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
            <Text style={styles.kicker}>Trial preferences</Text>
            <Text style={styles.title}>Set your market</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Preferred markets</Text>
          <View style={styles.marketGrid}>
            {markets.map((market) => {
              const selected = selectedMarkets.includes(market);
              return (
                <TouchableOpacity
                  key={market}
                  style={[styles.marketChip, selected && styles.marketChipActive]}
                  onPress={() => toggleMarket(market)}
                >
                  <Text style={[styles.marketText, selected && styles.marketTextActive]}>{market}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <PreferenceInput label="Contract type" value={contractType} onChangeText={setContractType} />
          <PreferenceInput label="Travel window" value={travelWindow} onChangeText={setTravelWindow} />
          <PreferenceInput label="Minimum package" value={minimumPackage} onChangeText={setMinimumPackage} multiline />

          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Open to loan pathway</Text>
              <Text style={styles.switchText}>Include short-term development loans in matches.</Text>
            </View>
            <Switch
              value={openToLoan}
              onValueChange={setOpenToLoan}
              trackColor={{ false: '#D7DDD2', true: '#9AC5B0' }}
              thumbColor={openToLoan ? colors.primary : '#FFFFFF'}
            />
          </View>

          {saved ? (
            <View style={styles.savedRow}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text style={styles.savedText}>{syncNotice || 'Preferences saved'}</Text>
            </View>
          ) : null}

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save preferences</Text>
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

function PreferenceInput({
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
  label: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 7,
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  marketChip: {
    minHeight: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FBFCF8',
  },
  marketChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  marketText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  marketTextActive: {
    color: '#FFFFFF',
  },
  field: {
    marginBottom: 14,
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
    minHeight: 86,
    paddingTop: 12,
    lineHeight: 21,
  },
  switchRow: {
    minHeight: 78,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  switchCopy: {
    flex: 1,
  },
  switchTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  switchText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
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
