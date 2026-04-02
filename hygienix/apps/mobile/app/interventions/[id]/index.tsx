import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIntervention, useCheckIn, useCheckOut } from '../../../hooks/useInterventions';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/colors';

const TABS = [
  { key: 'info', label: 'Info' },
  { key: 'work', label: 'Lavori' },
  { key: 'card', label: 'Cartellino' },
  { key: 'close', label: 'Chiusura' },
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.statusScheduled,
  IN_PROGRESS: Colors.statusInProgress,
  CLOSED: Colors.statusClosed,
  ARCHIVED: Colors.statusArchived,
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Pianificato',
  IN_PROGRESS: 'In corso',
  CLOSED: 'Chiuso',
  ARCHIVED: 'Archiviato',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

const OUTCOME_COLORS: Record<string, string> = {
  OK: Colors.outcomeOk,
  ATTENTION: Colors.outcomeAttention,
  CRITICAL: Colors.outcomeCritical,
};

function formatDateTime(s: string) {
  return new Date(s).toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function InterventionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('info');

  const { data: intervention, isLoading, refetch, isRefetching } = useIntervention(id);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!intervention) {
    return (
      <View style={styles.loader}>
        <Text>Intervento non trovato</Text>
      </View>
    );
  }

  const handleCheckIn = () => {
    Alert.alert('Check-In', 'Confermi il check-in per questo intervento?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Conferma',
        onPress: () => checkIn.mutate(id, {
          onError: (e: any) => Alert.alert('Errore', e?.response?.data?.error?.message || 'Errore check-in'),
        }),
      },
    ]);
  };

  const handleCheckOut = () => {
    Alert.alert('Check-Out', 'Confermi il check-out?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Conferma',
        onPress: () => checkOut.mutate(id, {
          onError: (e: any) => Alert.alert('Errore', e?.response?.data?.error?.message || 'Errore check-out'),
        }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[intervention.status] }]}>
            <Text style={styles.statusText}>{STATUS_LABELS[intervention.status]}</Text>
          </View>
          <Text style={styles.code}>{intervention.code}</Text>
        </View>
        <Text style={styles.siteName}>{intervention.site.name}</Text>
        <Text style={styles.clientName}>{intervention.site.client.name}</Text>
      </View>

      {/* Action Buttons */}
      {intervention.status === 'SCHEDULED' && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={handleCheckIn}
          disabled={checkIn.isPending}
          activeOpacity={0.8}
        >
          {checkIn.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>📍 Check-In</Text>}
        </TouchableOpacity>
      )}
      {intervention.status === 'IN_PROGRESS' && !intervention.checkOutAt && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnWarning]}
          onPress={handleCheckOut}
          disabled={checkOut.isPending}
          activeOpacity={0.8}
        >
          {checkOut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>🏁 Check-Out</Text>}
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabsBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => {
              if (tab.key === 'work') {
                router.push(`/interventions/${id}/work`);
              } else if (tab.key === 'card') {
                router.push(`/interventions/${id}/card`);
              } else if (tab.key === 'close') {
                router.push(`/interventions/${id}/close`);
              } else {
                setActiveTab(tab.key);
              }
            }}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Tab */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettagli intervento</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Codice" value={intervention.code} />
            <InfoRow label="Tipo servizio" value={intervention.serviceType.replace('_', ' ')} />
            <InfoRow label="Priorità" value={PRIORITY_LABELS[intervention.priority]} />
            <InfoRow label="Pianificato" value={formatDateTime(intervention.scheduledAt)} />
            {intervention.checkInAt && (
              <InfoRow label="Check-In" value={formatDateTime(intervention.checkInAt)} />
            )}
            {intervention.checkOutAt && (
              <InfoRow label="Check-Out" value={formatDateTime(intervention.checkOutAt)} />
            )}
            {intervention.outcome && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Esito</Text>
                <Text style={[styles.infoValue, { color: OUTCOME_COLORS[intervention.outcome] }]}>
                  {intervention.outcome === 'OK' ? '✅ OK' :
                   intervention.outcome === 'ATTENTION' ? '⚠️ Attenzione' : '🚨 Critico'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Site Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sito</Text>
          <View style={styles.infoCard}>
            <InfoRow label="Nome" value={intervention.site.name} />
            <InfoRow label="Indirizzo" value={intervention.site.address} />
            <InfoRow label="Cliente" value={intervention.site.client.name} />
          </View>
        </View>

        {/* Notes */}
        {intervention.technicianNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Note tecnico</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{intervention.technicianNotes}</Text>
            </View>
          </View>
        )}

        {/* Photos preview */}
        {intervention.photos.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Foto ({intervention.photos.length})</Text>
            <TouchableOpacity
              style={styles.photoPreviewBtn}
              onPress={() => router.push(`/interventions/${id}/work`)}
            >
              <Text style={styles.photoPreviewText}>📷 Visualizza tutte le foto →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Report */}
        {intervention.reportPdfUrl && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rapporto</Text>
            <View style={styles.reportCard}>
              <Text style={styles.reportEmoji}>📄</Text>
              <Text style={styles.reportText}>Rapporto PDF disponibile</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusHeader: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  statusText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  code: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  siteName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  clientName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  actionBtn: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtnWarning: { backgroundColor: Colors.warning },
  actionBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginTop: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabBtnTextActive: { color: Colors.primary },
  content: { flex: 1 },
  contentPadding: { padding: Spacing.md, paddingBottom: 100 },
  section: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, maxWidth: '60%', textAlign: 'right' },
  notesCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: { fontSize: FontSize.base, color: Colors.text, lineHeight: 22 },
  photoPreviewBtn: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  photoPreviewText: { fontSize: FontSize.sm, color: Colors.primaryDark, fontWeight: '600' },
  reportCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reportEmoji: { fontSize: 28 },
  reportText: { fontSize: FontSize.base, color: Colors.text, fontWeight: '600' },
});
