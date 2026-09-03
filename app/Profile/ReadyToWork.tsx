import { colors, defaultGpsReport, GpsReport } from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import { getPlayerGpsReport, updatePlayerAvailability } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ReadyForTrialsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isReady, setIsReady] = useState(true);
  const [travelDate, setTravelDate] = useState('June 20, 2026');
  const [trainingLoad, setTrainingLoad] = useState('Full training, no restrictions');
  const [contactWindow, setContactWindow] = useState('Weekdays after 15:00 CET');
  const [gpsReport, setGpsReport] = useState<GpsReport>(defaultGpsReport);
  const [saved, setSaved] = useState(false);
  const [syncNotice, setSyncNotice] = useState('');

  const playerId = currentUser?.id ?? 'demo-player';

  useEffect(() => {
    let ignore = false;

    async function loadGps() {
      try {
        const data = await getPlayerGpsReport(playerId);
        if (!ignore && data) {
          setGpsReport(data);
        }
      } catch {
        // Fallback to default
      }
    }

    loadGps();

    return () => {
      ignore = true;
    };
  }, [playerId]);

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

        {/* Athletic GPS Workload Diagnostics Card */}
        <View style={styles.gpsCard}>
          <View style={styles.gpsHeader}>
            <View style={styles.gpsBadge}>
              <Ionicons name="pulse" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>GPS Load & Diagnostics</Text>
              <Text style={styles.gpsTitle}>Trial Physiological Readiness</Text>
            </View>
            <View style={styles.readinessPill}>
              <Text style={styles.readinessVal}>{gpsReport.diagnostics.readinessScore}%</Text>
              <Text style={styles.readinessLbl}>Readiness</Text>
            </View>
          </View>

          <Text style={styles.recommendationText}>
            {gpsReport.diagnostics.recommendation}
          </Text>

          {/* Diagnostic Metrics Matrix */}
          <View style={styles.metricsGrid}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValueText}>{gpsReport.diagnostics.acwr}</Text>
              <Text style={styles.metricLabelText}>ACWR Ratio</Text>
              <Text style={styles.metricSubText}>{gpsReport.diagnostics.injuryRiskZone}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValueText}>{gpsReport.diagnostics.topSpeedPeak} km/h</Text>
              <Text style={styles.metricLabelText}>Peak Speed</Text>
              <Text style={styles.metricSubText}>Max Sprint Effort</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValueText}>{gpsReport.diagnostics.totalDistanceKm} km</Text>
              <Text style={styles.metricLabelText}>Weekly Volume</Text>
              <Text style={styles.metricSubText}>3 Sessions Logged</Text>
            </View>
          </View>

          {/* Recent Athletic GPS Logs */}
          <View style={styles.sessionLogsSection}>
            <Text style={styles.sessionLogsTitle}>Recent GPS Performance Logs</Text>
            {gpsReport.sessions.slice(0, 2).map((s) => (
              <View key={s.id} style={styles.sessionRow}>
                <View style={styles.sessionDot} />
                <View style={{ flex: 1 }}>
                  <View style={styles.sessionTopLine}>
                    <Text style={styles.sessionType}>{s.sessionType}</Text>
                    <Text style={styles.sessionDate}>{s.date}</Text>
                  </View>
                  <Text style={styles.sessionStats}>
                    {s.totalDistanceKm} km • {s.highSpeedRunningMeters}m HSR • {s.topSpeedKmh} km/h top speed
                  </Text>
                </View>
              </View>
            ))}
          </View>
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
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  statusIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
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
  gpsCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  gpsBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  readinessPill: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 9,
    alignItems: 'center',
  },
  readinessVal: {
    color: '#0D5C3A',
    fontSize: 16,
    fontWeight: '900',
  },
  readinessLbl: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recommendationText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricBlock: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValueText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  metricLabelText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  metricSubText: {
    color: '#15803D',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 2,
    textAlign: 'center',
  },
  sessionLogsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    paddingTop: 12,
    gap: 8,
  },
  sessionLogsTitle: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sessionRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  sessionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
  sessionTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionType: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  sessionDate: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  sessionStats: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
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
