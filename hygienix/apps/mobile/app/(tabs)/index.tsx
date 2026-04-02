import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTodayInterventions } from '../../hooks/useInterventions';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Radius, FontSize } from '../../constants/colors';

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

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buongiorno';
  if (hour < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: todayInterventions, isLoading, refetch, isRefetching } = useTodayInterventions();

  const scheduled = todayInterventions?.filter((i) => i.status === 'SCHEDULED').length ?? 0;
  const inProgress = todayInterventions?.filter((i) => i.status === 'IN_PROGRESS').length ?? 0;
  const closed = todayInterventions?.filter((i) => i.status === 'CLOSED').length ?? 0;

  const today = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {getGreeting()}, {user?.firstName} 👋
          </Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
      </View>

      {/* KPI Strip */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderTopColor: Colors.statusScheduled }]}>
          <Text style={styles.kpiValue}>{scheduled}</Text>
          <Text style={styles.kpiLabel}>Pianificati</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: Colors.statusInProgress }]}>
          <Text style={styles.kpiValue}>{inProgress}</Text>
          <Text style={styles.kpiLabel}>In corso</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: Colors.statusClosed }]}>
          <Text style={styles.kpiValue}>{closed}</Text>
          <Text style={styles.kpiLabel}>Chiusi</Text>
        </View>
      </View>

      {/* Today's interventions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interventi di oggi</Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        ) : !todayInterventions?.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyTitle}>Nessun intervento oggi</Text>
            <Text style={styles.emptyText}>Hai la giornata libera</Text>
          </View>
        ) : (
          todayInterventions.map((intervention) => (
            <TouchableOpacity
              key={intervention.id}
              style={styles.interventionCard}
              onPress={() => router.push(`/interventions/${intervention.id}`)}
              activeOpacity={0.7}
            >
              {/* Priority dot */}
              <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[intervention.priority] }]} />

              <View style={styles.interventionBody}>
                <View style={styles.interventionHeader}>
                  <Text style={styles.interventionCode}>{intervention.code}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[intervention.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[intervention.status] }]}>
                      {STATUS_LABELS[intervention.status]}
                    </Text>
                  </View>
                </View>

                <Text style={styles.siteName}>{intervention.site.name}</Text>
                <Text style={styles.clientName}>{intervention.site.client.name}</Text>
                <Text style={styles.address} numberOfLines={1}>{intervention.site.address}</Text>

                <View style={styles.interventionFooter}>
                  <Text style={styles.time}>🕐 {formatTime(intervention.scheduledAt)}</Text>
                  <Text style={styles.serviceType}>{intervention.serviceType.replace('_', ' ')}</Text>
                </View>
              </View>

              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accesso rapido</Text>
        <View style={styles.quickRow}>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/interventions')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickEmoji}>📋</Text>
            <Text style={styles.quickLabel}>Tutti gli{'\n'}interventi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/calendar')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickEmoji}>📅</Text>
            <Text style={styles.quickLabel}>Calendario{'\n'}settimanale</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <Text style={styles.quickEmoji}>👤</Text>
            <Text style={styles.quickLabel}>Il mio{'\n'}profilo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingTop: 60, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
  date: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: FontSize.base },
  kpiRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text },
  kpiLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
  interventionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  priorityDot: { width: 4, height: '100%', borderRadius: 2, marginRight: Spacing.sm, minHeight: 60 },
  interventionBody: { flex: 1 },
  interventionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  interventionCode: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  siteName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  clientName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  address: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  interventionFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  time: { fontSize: FontSize.xs, color: Colors.textSecondary },
  serviceType: { fontSize: FontSize.xs, color: Colors.textMuted },
  chevron: { fontSize: 22, color: Colors.textMuted, marginLeft: Spacing.sm },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center', lineHeight: 16 },
});
