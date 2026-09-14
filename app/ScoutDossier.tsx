import {
  colors,
  defaultDossierReport,
  DossierExportFormat,
  DossierExportRecord,
  DossierReport,
  DossierTemplate,
} from '@/constants/playerPlatform';
import { useAuth } from '@/contexts/AuthContext';
import {
  generatePlayerDossierExport,
  getPlayerDossier,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ScoutDossierScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const playerId = currentUser?.id ?? 'demo-player';

  const [dossier, setDossier] = useState<DossierReport>(defaultDossierReport);
  const [selectedFormat, setSelectedFormat] = useState<DossierExportFormat>('PDF');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('template-executive');
  const [targetClub, setTargetClub] = useState<string>('');
  const [scoutRecipient, setScoutRecipient] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;
    getPlayerDossier(playerId)
      .then((data) => {
        if (active && data?.dossierId) {
          setDossier(data);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [playerId]);

  const handleExport = async () => {
    if (!targetClub.trim()) {
      Alert.alert('Required', 'Please enter a target club or scout desk name.');
      return;
    }

    setIsExporting(true);
    try {
      const expRecord = await generatePlayerDossierExport(playerId, {
        format: selectedFormat,
        templateId: selectedTemplate,
        targetClub: targetClub.trim(),
        scoutRecipient: scoutRecipient.trim() || 'Accredited Scout',
      });

      setDossier((prev) => ({
        ...prev,
        exportsHistory: [expRecord, ...prev.exportsHistory],
      }));

      Alert.alert(
        'Export Generated',
        `Dossier successfully generated in ${selectedFormat} format for ${expRecord.targetClub}. Ready for secure transmission.`
      );
      setTargetClub('');
      setScoutRecipient('');
    } catch {
      Alert.alert('Export Error', 'Unable to generate dossier export at this time.');
    } finally {
      setIsExporting(false);
    }
  };

  const { scoutSummary, sections, exportTemplates, exportsHistory } = dossier;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Intelligence Dossier</Text>
          <Text style={styles.headerSubtitle}>Verified Scout Export Suite • {dossier.dossierId}</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={14} color="#059669" />
          <Text style={styles.verifiedBadgeText}>Accredited</Text>
        </View>
      </View>

      {/* Executive Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardKicker}>CONFIDENTIAL SCOUT BRIEF</Text>
            <Text style={styles.summaryTitle}>{dossier.title}</Text>
          </View>
          <View style={styles.readinessBox}>
            <Text style={styles.readinessVal}>{scoutSummary.readinessRating}%</Text>
            <Text style={styles.readinessLbl}>Readiness</Text>
          </View>
        </View>

        <Text style={styles.headlineText}>"{scoutSummary.executiveHeadline}"</Text>

        <View style={styles.summaryMetaGrid}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLbl}>Projected Ceiling</Text>
            <Text style={styles.metaVal}>{scoutSummary.projectedCeiling}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLbl}>Recommended Pathway</Text>
            <Text style={styles.metaVal}>{scoutSummary.recommendedPathway}</Text>
          </View>
        </View>
      </View>

      {/* Aggregated Intelligence Pillars */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="stats-chart" size={18} color="#2563EB" />
          <Text style={styles.sectionTitle}>Aggregated Performance Pillars</Text>
        </View>

        <View style={styles.pillarsGrid}>
          <View style={styles.pillarBox}>
            <Text style={styles.pillarScore}>{sections.tacticalPillars.physical}%</Text>
            <Text style={styles.pillarLabel}>Physical</Text>
          </View>
          <View style={styles.pillarBox}>
            <Text style={styles.pillarScore}>{sections.tacticalPillars.technical}%</Text>
            <Text style={styles.pillarLabel}>Technical</Text>
          </View>
          <View style={styles.pillarBox}>
            <Text style={styles.pillarScore}>{sections.tacticalPillars.tactical}%</Text>
            <Text style={styles.pillarLabel}>Tactical</Text>
          </View>
          <View style={styles.pillarBox}>
            <Text style={styles.pillarScore}>{sections.tacticalPillars.mental}%</Text>
            <Text style={styles.pillarLabel}>Mental</Text>
          </View>
        </View>

        {/* Strengths Chips */}
        <Text style={styles.subHeader}>Audited Key Strengths</Text>
        <View style={styles.chipsRow}>
          {sections.tacticalPillars.strengths.map((s, idx) => (
            <View key={idx} style={styles.strengthChip}>
              <Ionicons name="checkmark-circle" size={12} color="#059669" />
              <Text style={styles.strengthChipText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Verified Medical & Biometrics */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="heart-circle" size={18} color="#DC2626" />
          <Text style={styles.sectionTitle}>Medical & GPS Biometrics Clearance</Text>
        </View>

        <View style={styles.metricsList}>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>Medical Status</Text>
            <Text style={styles.metricItemVal}>{sections.medicalClearance.status}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>Cardiac ECG Certification</Text>
            <Text style={styles.metricItemVal}>{sections.medicalClearance.cardiacEcg}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>Peak Sprint Velocity</Text>
            <Text style={[styles.metricItemVal, { color: '#059669', fontWeight: '700' }]}>
              {sections.athleticGps.peakSprintSpeed}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>High Speed Running (&gt;25km/h)</Text>
            <Text style={styles.metricItemVal}>{sections.athleticGps.highSpeedRunningPerMatch}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>Injury Risk Index (ACWR)</Text>
            <Text style={styles.metricItemVal}>{sections.athleticGps.acwrRatio} • {sections.medicalClearance.riskIndex}</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricItemLbl}>Market Valuation</Text>
            <Text style={[styles.metricItemVal, { color: '#2563EB', fontWeight: '700' }]}>
              {sections.transferAndValuation.valueRange}
            </Text>
          </View>
        </View>
      </View>

      {/* Export Generation Hub */}
      <View style={styles.exportCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="cloud-download" size={18} color="#D97706" />
          <Text style={styles.sectionTitle}>Export Package Generation</Text>
        </View>

        {/* Format Selector */}
        <Text style={styles.subHeader}>Choose Export Delivery Format</Text>
        <View style={styles.formatRow}>
          {(['PDF', 'JSON'] as DossierExportFormat[]).map((fmt) => (
            <TouchableOpacity
              key={fmt}
              style={[styles.formatBtn, selectedFormat === fmt && styles.formatBtnActive]}
              onPress={() => setSelectedFormat(fmt)}
            >
              <Ionicons
                name={fmt === 'PDF' ? 'document-text-outline' : 'code-slash-outline'}
                size={16}
                color={selectedFormat === fmt ? '#FFFFFF' : '#475569'}
              />
              <Text style={[styles.formatBtnText, selectedFormat === fmt && styles.formatBtnTextActive]}>
                {fmt === 'PDF' ? 'Verified PDF Document' : 'Raw JSON Schema'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Template Selector */}
        <Text style={styles.subHeader}>Select Export Template Profile</Text>
        {exportTemplates.map((tmpl) => (
          <TouchableOpacity
            key={tmpl.id}
            style={[styles.templateCard, selectedTemplate === tmpl.id && styles.templateCardActive]}
            onPress={() => setSelectedTemplate(tmpl.id)}
          >
            <View style={styles.templateTop}>
              <Text style={[styles.templateName, selectedTemplate === tmpl.id && styles.templateNameActive]}>
                {tmpl.name}
              </Text>
              <View style={styles.pageCountBadge}>
                <Text style={styles.pageCountText}>{tmpl.pageCount} Pages</Text>
              </View>
            </View>
            <Text style={styles.templateDesc}>{tmpl.description}</Text>
            <Text style={styles.templateRec}>Target: {tmpl.recommendedFor}</Text>
          </TouchableOpacity>
        ))}

        {/* Target Details Inputs */}
        <Text style={styles.subHeader}>Recipient Information</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Target Club or Agency (e.g. AZ Alkmaar, SC Freiburg)"
          placeholderTextColor="#94A3B8"
          value={targetClub}
          onChangeText={setTargetClub}
        />
        <TextInput
          style={styles.textInput}
          placeholder="Scout / Director Recipient (Optional)"
          placeholderTextColor="#94A3B8"
          value={scoutRecipient}
          onChangeText={setScoutRecipient}
        />

        <TouchableOpacity
          style={[styles.generateBtn, isExporting && styles.btnDisabled]}
          onPress={handleExport}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={16} color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Compile &amp; Dispatch Export</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Export History Audit Trail */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="time" size={18} color="#64748B" />
          <Text style={styles.sectionTitle}>Dispatched Exports Log</Text>
        </View>

        {exportsHistory.length === 0 ? (
          <Text style={styles.emptyText}>No exports dispatched yet.</Text>
        ) : (
          exportsHistory.map((item) => (
            <View key={item.id} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <Ionicons
                  name={item.format === 'PDF' ? 'document-text' : 'code-download'}
                  size={16}
                  color="#2563EB"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.historyClub}>{item.targetClub} ({item.format})</Text>
                <Text style={styles.historyMeta}>
                  Recipient: {item.scoutRecipient} • {new Date(item.exportedAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyStatusPill}>
                <Text style={styles.historyStatusText}>{item.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 3,
  },
  readinessBox: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  readinessVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10B981',
  },
  readinessLbl: {
    fontSize: 9,
    color: '#94A3B8',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  headlineText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  summaryMetaGrid: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 12,
  },
  metaCol: {
    flex: 1,
  },
  metaLbl: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  pillarsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  pillarBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillarScore: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  pillarLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  subHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  strengthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  strengthChipText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  metricsList: {
    gap: 10,
  },
  metricItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metricItemLbl: {
    fontSize: 12,
    color: '#64748B',
  },
  metricItemVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  exportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  formatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
  },
  formatBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  formatBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  formatBtnTextActive: {
    color: '#FFFFFF',
  },
  templateCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  templateCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  templateTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  templateNameActive: {
    color: '#1D4ED8',
  },
  pageCountBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pageCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  templateDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  templateRec: {
    fontSize: 10,
    color: '#2563EB',
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 10,
  },
  generateBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 12,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyClub: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyMeta: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  historyStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
});
