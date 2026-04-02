import { useState } from 'react';
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
import { useMyCalendar, CalendarEntry } from '../../hooks/useCalendar';
import { Colors, Spacing, Radius, FontSize } from '../../constants/colors';

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: Colors.statusScheduled,
  IN_PROGRESS: Colors.statusInProgress,
  CLOSED: Colors.statusClosed,
  ARCHIVED: Colors.statusArchived,
};

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function getWeekDays(referenceDate: Date) {
  const day = referenceDate.getDay();
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);

  const referenceDate = new Date();
  referenceDate.setDate(referenceDate.getDate() + weekOffset * 7);
  const weekDays = getWeekDays(referenceDate);

  const dateFrom = weekDays[0].toISOString().split('T')[0];
  const dateTo = weekDays[6].toISOString().split('T')[0];

  const { data: entries, isLoading, refetch, isRefetching } = useMyCalendar(dateFrom, dateTo);

  const selectedDayEntries = entries?.filter((e) =>
    isSameDay(new Date(e.scheduledAt), selectedDate)
  ) ?? [];

  const entryCountByDay = weekDays.map((d) =>
    entries?.filter((e) => isSameDay(new Date(e.scheduledAt), d)).length ?? 0
  );

  const monthYear = `${MONTHS[referenceDate.getMonth()]} ${referenceDate.getFullYear()}`;

  return (
    <View style={styles.container}>
      {/* Week Header */}
      <View style={styles.calendarHeader}>
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={() => setWeekOffset((w) => w - 1)} style={styles.navBtn}>
            <Text style={styles.navText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthText}>{monthYear}</Text>
          <TouchableOpacity onPress={() => setWeekOffset((w) => w + 1)} style={styles.navBtn}>
            <Text style={styles.navText}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysRow}>
          {weekDays.map((d, i) => {
            const isToday = isSameDay(d, new Date());
            const isSelected = isSameDay(d, selectedDate);
            const count = entryCountByDay[i];
            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                  {DAYS[d.getDay()]}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday, isSelected && styles.dayNumberSelected]}>
                  {d.getDate()}
                </Text>
                {count > 0 && (
                  <View style={[styles.countDot, isSelected && styles.countDotSelected]}>
                    <Text style={[styles.countText, isSelected && styles.countTextSelected]}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Events list */}
      <ScrollView
        style={styles.eventsContainer}
        contentContainerStyle={styles.eventsContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.selectedDateLabel}>
          {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        ) : selectedDayEntries.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Nessun intervento</Text>
            <Text style={styles.emptyText}>Nessun intervento pianificato per questo giorno</Text>
          </View>
        ) : (
          selectedDayEntries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.eventCard}
              onPress={() => router.push(`/interventions/${entry.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.eventTimeline, { backgroundColor: STATUS_COLORS[entry.status] }]} />
              <View style={styles.eventBody}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTime}>{formatTime(entry.scheduledAt)}</Text>
                  <View style={[styles.statusPill, { backgroundColor: STATUS_COLORS[entry.status] + '20' }]}>
                    <Text style={[styles.statusPillText, { color: STATUS_COLORS[entry.status] }]}>
                      {entry.status === 'SCHEDULED' ? 'Pianificato' :
                       entry.status === 'IN_PROGRESS' ? 'In corso' :
                       entry.status === 'CLOSED' ? 'Chiuso' : 'Archiviato'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.eventSite}>{entry.site.name}</Text>
                <Text style={styles.eventClient}>{entry.site.client.name}</Text>
                <Text style={styles.eventService}>{entry.serviceType.replace('_', ' ')}</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  calendarHeader: {
    backgroundColor: Colors.surface,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  navBtn: { padding: Spacing.sm },
  navText: { fontSize: 24, color: Colors.primary, fontWeight: '700' },
  monthText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  daysRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    gap: 4,
  },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayName: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  dayNameSelected: { color: '#fff' },
  dayNumber: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  dayNumberToday: { color: Colors.primary },
  dayNumberSelected: { color: '#fff' },
  countDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countDotSelected: { backgroundColor: 'rgba(255,255,255,0.3)' },
  countText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  countTextSelected: { color: '#fff' },
  eventsContainer: { flex: 1 },
  eventsContent: { padding: Spacing.md, paddingBottom: 100 },
  selectedDateLabel: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  emptyDay: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  eventCard: {
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
  eventTimeline: { width: 4, alignSelf: 'stretch' },
  eventBody: { flex: 1, padding: Spacing.md },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  eventTime: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  statusPillText: { fontSize: FontSize.xs, fontWeight: '700' },
  eventSite: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text },
  eventClient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  eventService: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textMuted, paddingHorizontal: Spacing.sm },
});
