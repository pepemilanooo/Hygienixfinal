import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMyInterventions } from '../../hooks/useInterventions';
import { Colors, Spacing, Radius, FontSize } from '../../constants/colors';

const STATUS_FILTERS = [
  { key: '', label: 'Tutti' },
  { key: 'SCHEDULED', label: 'Pianificati' },
  { key: 'IN_PROGRESS', label: 'In corso' },
  { key: 'CLOSED', label: 'Chiusi' },
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

const PRIORITY_COLORS: Record<string, string> = {
  LOW: Colors.priorityLow,
  MEDIUM: Colors.priorityMedium,
  HIGH: Colors.priorityHigh,
  CRITICAL: Colors.priorityCritical,
};

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function InterventionsScreen() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data: interventions, isLoading, refetch, isRefetching } = useMyInterventions(
    statusFilter ? { status: statusFilter } : undefined
  );

  const filtered = interventions?.filter((i) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      i.code.toLowerCase().includes(q) ||
      i.site.name.toLowerCase().includes(q) ||
      i.site.client.name.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Cerca per codice, sito o cliente..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Status Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabs}
        contentContainerStyle={styles.tabsContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.tab, statusFilter === f.key && styles.tabActive]}
            onPress={() => setStatusFilter(f.key)}
          >
            <Text style={[styles.tabText, statusFilter === f.key && styles.tabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Interventions List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.xl }} />
        ) : !filtered?.length ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Nessun intervento trovato</Text>
            <Text style={styles.emptyText}>Prova a cambiare i filtri di ricerca</Text>
          </View>
        ) : (
          filtered.map((intervention) => (
            <TouchableOpacity
              key={intervention.id}
              style={styles.card}
              onPress={() => router.push(`/interventions/${intervention.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[intervention.priority] }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.code}>{intervention.code}</Text>
                  <View style={[styles.badge, { backgroundColor: STATUS_COLORS[intervention.status] + '20' }]}>
                    <Text style={[styles.badgeText, { color: STATUS_COLORS[intervention.status] }]}>
                      {STATUS_LABELS[intervention.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.siteName}>{intervention.site.name}</Text>
                <Text style={styles.clientName}>{intervention.site.client.name}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>🕐 {formatDateTime(intervention.scheduledAt)}</Text>
                  <Text style={styles.footerText}>{intervention.serviceType.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
  },
  searchIcon: { fontSize: 16, marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.text },
  tabs: { maxHeight: 44, marginBottom: Spacing.sm },
  tabsContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm, alignItems: 'center' },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { flex: 1 },
  listContent: { padding: Spacing.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityBar: { width: 4, alignSelf: 'stretch' },
  cardBody: { flex: 1, padding: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  code: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  siteName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  clientName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  footerText: { fontSize: FontSize.xs, color: Colors.textMuted },
  chevron: { fontSize: 22, color: Colors.textMuted, paddingHorizontal: Spacing.sm },
});
