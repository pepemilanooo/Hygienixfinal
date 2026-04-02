import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import {
  useIntervention,
  useAddProduct,
  useUpdateOutcome,
} from '../../../hooks/useInterventions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/colors';

interface Product { id: string; name: string; unit: string; }

const OUTCOME_OPTIONS = [
  { key: 'OK', label: '✅ OK', color: Colors.outcomeOk },
  { key: 'ATTENTION', label: '⚠️ Attenzione', color: Colors.outcomeAttention },
  { key: 'CRITICAL', label: '🚨 Critico', color: Colors.outcomeCritical },
];

export default function WorkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [productNotes, setProductNotes] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { data: intervention, isLoading, refetch } = useIntervention(id);
  const addProduct = useAddProduct();
  const updateOutcome = useUpdateOutcome();

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await api.get('/products?limit=100');
      return res.data.data as Product[];
    },
  });

  const saveNotesMutation = useMutation({
    mutationFn: async (technicianNotes: string) => {
      const res = await api.put(`/interventions/${id}`, { technicianNotes });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['intervention', id] });
      Alert.alert('✅', 'Note salvate');
    },
    onError: () => Alert.alert('Errore', 'Impossibile salvare le note'),
  });

  const removeProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await api.delete(`/interventions/${id}/products/${productId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervention', id] }),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      await api.delete(`/interventions/${id}/photos/${photoId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervention', id] }),
  });

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita l\'accesso alle foto nelle impostazioni');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsMultipleSelection: true,
    });
    if (!result.canceled && result.assets.length > 0) {
      setUploadingPhoto(true);
      try {
        for (const asset of result.assets) {
          await api.uploadPhoto(`/interventions/${id}/photos`, asset.uri);
        }
        qc.invalidateQueries({ queryKey: ['intervention', id] });
        Alert.alert('✅', `${result.assets.length} foto caricate`);
      } catch {
        Alert.alert('Errore', 'Upload foto fallito');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleCameraPhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso negato', 'Abilita l\'accesso alla fotocamera');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true);
      try {
        await api.uploadPhoto(`/interventions/${id}/photos`, result.assets[0].uri);
        qc.invalidateQueries({ queryKey: ['intervention', id] });
      } catch {
        Alert.alert('Errore', 'Upload foto fallito');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleAddProduct = () => {
    if (!selectedProductId) {
      Alert.alert('Seleziona un prodotto');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Quantità non valida');
      return;
    }
    addProduct.mutate(
      { interventionId: id, productId: selectedProductId, quantityUsed: qty, notes: productNotes || undefined },
      {
        onSuccess: () => {
          setShowProductModal(false);
          setSelectedProductId('');
          setQuantity('1');
          setProductNotes('');
        },
        onError: (e: any) => Alert.alert('Errore', e?.response?.data?.error?.message || 'Errore aggiunta prodotto'),
      }
    );
  };

  const handleSaveOutcome = () => {
    if (!selectedOutcome) return;
    updateOutcome.mutate(
      { id, outcome: selectedOutcome, notes: notes || undefined },
      {
        onSuccess: () => Alert.alert('✅', 'Esito aggiornato'),
        onError: () => Alert.alert('Errore', 'Impossibile aggiornare l\'esito'),
      }
    );
  };

  if (isLoading || !intervention) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Prodotti utilizzati</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowProductModal(true)}
            >
              <Text style={styles.addBtnText}>+ Aggiungi</Text>
            </TouchableOpacity>
          </View>
          {intervention.products.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Nessun prodotto registrato</Text>
            </View>
          ) : (
            intervention.products.map((p) => (
              <View key={p.id} style={styles.productRow}>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{p.product.name}</Text>
                  <Text style={styles.productQty}>
                    {p.quantityUsed} {p.product.unit}
                    {p.notes && ` — ${p.notes}`}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => Alert.alert('Elimina', 'Rimuovere questo prodotto?', [
                    { text: 'Annulla', style: 'cancel' },
                    { text: 'Elimina', style: 'destructive', onPress: () => removeProductMutation.mutate(p.id) },
                  ])}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Photos Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Foto ({intervention.photos.length})</Text>
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.addBtn} onPress={handleCameraPhoto} disabled={uploadingPhoto}>
                <Text style={styles.addBtnText}>📷</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addBtn} onPress={handlePickPhoto} disabled={uploadingPhoto}>
                <Text style={styles.addBtnText}>🖼️</Text>
              </TouchableOpacity>
            </View>
          </View>
          {uploadingPhoto && <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.sm }} />}
          <View style={styles.photoGrid}>
            {intervention.photos.map((photo) => (
              <TouchableOpacity
                key={photo.id}
                style={styles.photoThumb}
                onLongPress={() => Alert.alert('Elimina', 'Eliminare questa foto?', [
                  { text: 'Annulla', style: 'cancel' },
                  { text: 'Elimina', style: 'destructive', onPress: () => deletePhotoMutation.mutate(photo.id) },
                ])}
              >
                <Image source={{ uri: photo.url }} style={styles.photoImage} />
              </TouchableOpacity>
            ))}
          </View>
          {intervention.photos.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>Nessuna foto. Premi 📷 per scattare o 🖼️ per scegliere dalla galleria.</Text>
            </View>
          )}
        </View>

        {/* Outcome Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Esito intervento</Text>
          <View style={styles.outcomeRow}>
            {OUTCOME_OPTIONS.map((o) => (
              <TouchableOpacity
                key={o.key}
                style={[
                  styles.outcomeBtn,
                  selectedOutcome === o.key && { backgroundColor: o.color, borderColor: o.color },
                  !selectedOutcome && intervention.outcome === o.key && { borderColor: o.color },
                ]}
                onPress={() => setSelectedOutcome(o.key)}
              >
                <Text style={[styles.outcomeBtnText, selectedOutcome === o.key && { color: '#fff' }]}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {intervention.outcome && !selectedOutcome && (
            <Text style={styles.currentOutcome}>
              Esito attuale: {OUTCOME_OPTIONS.find((o) => o.key === intervention.outcome)?.label}
            </Text>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note tecnico</Text>
          <TextInput
            style={styles.notesInput}
            value={notes || intervention.technicianNotes || ''}
            onChangeText={setNotes}
            placeholder="Inserisci note sull'intervento..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => {
            if (selectedOutcome) handleSaveOutcome();
            if (notes) saveNotesMutation.mutate(notes);
          }}
          disabled={saveNotesMutation.isPending || updateOutcome.isPending}
          activeOpacity={0.8}
        >
          {saveNotesMutation.isPending || updateOutcome.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>💾 Salva modifiche</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Add Product Modal */}
      <Modal visible={showProductModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Aggiungi prodotto</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Prodotto</Text>
            <ScrollView style={styles.productList} nestedScrollEnabled>
              {products?.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.productOption, selectedProductId === p.id && styles.productOptionSelected]}
                  onPress={() => setSelectedProductId(p.id)}
                >
                  <Text style={[styles.productOptionText, selectedProductId === p.id && styles.productOptionTextSelected]}>
                    {p.name} ({p.unit})
                  </Text>
                  {selectedProductId === p.id && <Text>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Quantità</Text>
            <TextInput
              style={styles.fieldInput}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="decimal-pad"
              placeholder="Es. 1.5"
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Note (opzionale)</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputMulti]}
              value={productNotes}
              onChangeText={setProductNotes}
              placeholder="Note sull'utilizzo..."
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.saveBtn, { marginTop: Spacing.lg }]}
              onPress={handleAddProduct}
              disabled={addProduct.isPending}
            >
              {addProduct.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Aggiungi prodotto</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: 100 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { marginBottom: Spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  addBtn: { backgroundColor: Colors.primary + '20', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full },
  addBtnText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: '700' },
  photoActions: { flexDirection: 'row', gap: Spacing.sm },
  emptySection: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
  productRow: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  productInfo: { flex: 1 },
  productName: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text },
  productQty: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  deleteIcon: { fontSize: 18 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumb: { width: 100, height: 100, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: Colors.border },
  photoImage: { width: '100%', height: '100%' },
  outcomeRow: { flexDirection: 'row', gap: Spacing.sm },
  outcomeBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.surface },
  outcomeBtnText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  currentOutcome: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.sm },
  notesInput: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.text, minHeight: 120 },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 52, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface, paddingTop: 60 },
  modalTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  modalClose: { fontSize: 20, color: Colors.textSecondary },
  modalContent: { padding: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  fieldInput: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, fontSize: FontSize.base, color: Colors.text, height: 48 },
  fieldInputMulti: { height: 100, textAlignVertical: 'top' },
  productList: { maxHeight: 200, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.surface },
  productOption: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productOptionSelected: { backgroundColor: Colors.primaryMuted },
  productOptionText: { fontSize: FontSize.base, color: Colors.text },
  productOptionTextSelected: { color: Colors.primary, fontWeight: '700' },
});
