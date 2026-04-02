import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SiteCard {
  id: string;
  version: number;
  baseImageUrl?: string;
  points: SiteCardPoint[];
}

interface SiteCardPoint {
  id: string;
  code: string;
  label: string;
  type: 'TRAP' | 'BAIT_STATION' | 'SENSOR' | 'SPRAY_ZONE' | 'ENTRY_POINT' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'ATTENTION' | 'CRITICAL';
  posX: number;
  posY: number;
  description?: string;
}

const POINT_TYPE_EMOJI: Record<string, string> = {
  TRAP: '🪤',
  BAIT_STATION: '🫙',
  SENSOR: '📡',
  SPRAY_ZONE: '🌿',
  ENTRY_POINT: '🚪',
  OTHER: '📍',
};

const POINT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: Colors.outcomeOk,
  INACTIVE: Colors.textMuted,
  ATTENTION: Colors.outcomeAttention,
  CRITICAL: Colors.outcomeCritical,
};

const POINT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Attivo',
  INACTIVE: 'Inattivo',
  ATTENTION: 'Attenzione',
  CRITICAL: 'Critico',
};

export default function SiteCardScreen() {
  const { id: interventionId } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [selectedPoint, setSelectedPoint] = useState<SiteCardPoint | null>(null);
  const [mapLayout, setMapLayout] = useState({ width: SCREEN_WIDTH - 32, height: 300 });

  // Get the intervention to find the site
  const { data: intervention } = useQuery({
    queryKey: ['intervention', interventionId],
    queryFn: async () => {
      const res = await api.get(`/interventions/${interventionId}`);
      return res.data.data;
    },
  });

  const siteId = intervention?.site?.id;

  const { data: siteCard, isLoading } = useQuery({
    queryKey: ['site-card', siteId],
    queryFn: async () => {
      const res = await api.get(`/sites/${siteId}/card`);
      return res.data.data as SiteCard;
    },
    enabled: !!siteId,
  });

  const updatePointMutation = useMutation({
    mutationFn: async ({ pointId, status, notes }: { pointId: string; status: string; notes?: string }) => {
      const res = await api.put(`/interventions/${interventionId}/points/${pointId}`, { status, notes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-card', siteId] });
      setSelectedPoint(null);
    },
    onError: () => Alert.alert('Errore', 'Impossibile aggiornare il punto'),
  });

  if (isLoading) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!siteCard) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🗺️</Text>
        <Text style={styles.emptyTitle}>Cartellino non disponibile</Text>
        <Text style={styles.emptyText}>Il cartellino sito non è ancora stato configurato</Text>
      </View>
    );
  }

  const imageWidth = mapLayout.width;
  const imageHeight = imageWidth * 0.6;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Map */}
        <View
          style={[styles.mapContainer, { height: imageHeight }]}
          onLayout={(e) => setMapLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        >
          {siteCard.baseImageUrl ? (
            <Image
              source={{ uri: siteCard.baseImageUrl }}
              style={styles.mapImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <Text style={styles.mapPlaceholderText}>🏭</Text>
              <Text style={styles.mapPlaceholderLabel}>Planimetria non disponibile</Text>
            </View>
          )}

          {/* Point markers */}
          {siteCard.points.map((point) => {
            const x = (point.posX / 100) * imageWidth - 16;
            const y = (point.posY / 100) * imageHeight - 16;
            return (
              <TouchableOpacity
                key={point.id}
                style={[
                  styles.marker,
                  { left: x, top: y, borderColor: POINT_STATUS_COLORS[point.status] },
                ]}
                onPress={() => setSelectedPoint(point)}
                activeOpacity={0.8}
              >
                <Text style={styles.markerEmoji}>{POINT_TYPE_EMOJI[point.type]}</Text>
                <View style={[styles.markerDot, { backgroundColor: POINT_STATUS_COLORS[point.status] }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {Object.entries(POINT_STATUS_COLORS).map(([status, color]) => (
            <View key={status} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{POINT_STATUS_LABELS[status]}</Text>
            </View>
          ))}
        </View>

        {/* Points List */}
        <Text style={styles.pointsTitle}>Punti di controllo ({siteCard.points.length})</Text>
        {siteCard.points.map((point) => (
          <TouchableOpacity
            key={point.id}
            style={styles.pointRow}
            onPress={() => setSelectedPoint(point)}
            activeOpacity={0.7}
          >
            <Text style={styles.pointEmoji}>{POINT_TYPE_EMOJI[point.type]}</Text>
            <View style={styles.pointInfo}>
              <Text style={styles.pointCode}>{point.code}</Text>
              <Text style={styles.pointLabel}>{point.label}</Text>
            </View>
            <View style={[styles.pointStatus, { backgroundColor: POINT_STATUS_COLORS[point.status] + '20' }]}>
              <Text style={[styles.pointStatusText, { color: POINT_STATUS_COLORS[point.status] }]}>
                {POINT_STATUS_LABELS[point.status]}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Point Detail Modal */}
      <Modal
        visible={!!selectedPoint}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setSelectedPoint(null)}
      >
        {selectedPoint && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {POINT_TYPE_EMOJI[selectedPoint.type]} {selectedPoint.code}
              </Text>
              <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.modalLabel}>{selectedPoint.label}</Text>
              {selectedPoint.description && (
                <Text style={styles.modalDescription}>{selectedPoint.description}</Text>
              )}

              <Text style={styles.modalSectionTitle}>Aggiorna stato</Text>
              {Object.entries(POINT_STATUS_COLORS).map(([status, color]) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedPoint.status === status && { backgroundColor: color + '20', borderColor: color },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      'Conferma',
                      `Impostare lo stato "${POINT_STATUS_LABELS[status]}"?`,
                      [
                        { text: 'Annulla', style: 'cancel' },
                        {
                          text: 'Conferma',
                          onPress: () => updatePointMutation.mutate({ pointId: selectedPoint.id, status }),
                        },
                      ]
                    );
                  }}
                >
                  <View style={[styles.statusDot, { backgroundColor: color }]} />
                  <Text style={styles.statusOptionText}>{POINT_STATUS_LABELS[status]}</Text>
                  {selectedPoint.status === status && <Text>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },
  mapContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapImage: { width: '100%', height: '100%' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapPlaceholderText: { fontSize: 48 },
  mapPlaceholderLabel: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
  marker: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerEmoji: { fontSize: 16 },
  markerDot: { position: 'absolute', top: -4, right: -4, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  pointsTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  pointRow: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  pointEmoji: { fontSize: 22, marginRight: Spacing.sm },
  pointInfo: { flex: 1 },
  pointCode: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  pointLabel: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  pointStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginRight: Spacing.sm },
  pointStatusText: { fontSize: FontSize.xs, fontWeight: '700' },
  chevron: { fontSize: 18, color: Colors.textMuted },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textSecondary },
  modalContent: { padding: Spacing.md },
  modalLabel: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  modalDescription: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalSectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginVertical: Spacing.md },
  statusOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm, gap: Spacing.sm },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusOptionText: { flex: 1, fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
});
