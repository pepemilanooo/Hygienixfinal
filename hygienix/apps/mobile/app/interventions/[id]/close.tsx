import { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import SignatureScreen from 'react-native-signature-canvas';
import {
  useIntervention,
  useSaveSignature,
  useCloseIntervention,
} from '../../../hooks/useInterventions';
import { Colors, Spacing, Radius, FontSize } from '../../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type SignatureStep = 'technician' | 'client' | 'review';

export default function CloseInterventionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [step, setStep] = useState<SignatureStep>('technician');
  const [showSignature, setShowSignature] = useState(false);
  const [signingFor, setSigningFor] = useState<'technician' | 'client'>('technician');
  const sigRef = useRef<any>(null);

  const { data: intervention, isLoading } = useIntervention(id);
  const saveSignature = useSaveSignature();
  const closeIntervention = useCloseIntervention();

  if (isLoading || !intervention) {
    return <View style={styles.loader}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const canClose =
    intervention.status === 'IN_PROGRESS' &&
    intervention.checkOutAt &&
    intervention.outcome &&
    intervention.technicianSignatureUrl;

  const handleSignature = (base64: string) => {
    const cleanBase64 = base64.replace('data:image/png;base64,', '');
    saveSignature.mutate(
      { interventionId: id, type: signingFor, signatureBase64: cleanBase64 },
      {
        onSuccess: () => {
          setShowSignature(false);
          Alert.alert('✅', `Firma ${signingFor === 'technician' ? 'tecnico' : 'cliente'} salvata`);
        },
        onError: () => Alert.alert('Errore', 'Impossibile salvare la firma'),
      }
    );
  };

  const handleClose = () => {
    Alert.alert(
      'Chiudi intervento',
      'Confermi la chiusura definitiva? Verrà generato il rapporto PDF.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Conferma chiusura',
          onPress: () =>
            closeIntervention.mutate(id, {
              onSuccess: () => {
                Alert.alert('✅ Intervento chiuso', 'Il rapporto PDF è stato generato', [
                  { text: 'OK', onPress: () => router.back() },
                ]);
              },
              onError: (e: any) => Alert.alert('Errore', e?.response?.data?.error?.message || 'Impossibile chiudere l\'intervento'),
            }),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {showSignature ? (
        <View style={styles.signatureContainer}>
          <View style={styles.signatureHeader}>
            <Text style={styles.signatureTitle}>
              Firma {signingFor === 'technician' ? 'tecnico' : 'cliente'}
            </Text>
            <TouchableOpacity onPress={() => setShowSignature(false)}>
              <Text style={styles.signatureCancel}>Annulla</Text>
            </TouchableOpacity>
          </View>
          <SignatureScreen
            ref={sigRef}
            onOK={handleSignature}
            onEmpty={() => Alert.alert('', 'Firma vuota, riprova')}
            descriptionText="Firma qui"
            clearText="Cancella"
            confirmText="Salva firma"
            style={styles.signature}
            webStyle={`
              .m-signature-pad { box-shadow: none; border: 1px solid #e2e8f0; border-radius: 12px; }
              .m-signature-pad--footer { background: #f8fafc; }
              .m-signature-pad--footer .button { background: #16a34a; color: white; border-radius: 8px; padding: 8px 16px; }
            `}
          />
          {saveSignature.isPending && (
            <View style={styles.savingOverlay}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.savingText}>Salvataggio firma...</Text>
            </View>
          )}
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Checklist */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist di chiusura</Text>
            <View style={styles.checkCard}>
              <CheckItem
                done={!!intervention.checkInAt}
                label="Check-in registrato"
              />
              <CheckItem
                done={!!intervention.checkOutAt}
                label="Check-out registrato"
              />
              <CheckItem
                done={!!intervention.outcome}
                label="Esito compilato"
              />
              <CheckItem
                done={intervention.products.length > 0}
                label="Prodotti registrati"
              />
              <CheckItem
                done={intervention.photos.length > 0}
                label="Foto caricate (facoltativo)"
              />
              <CheckItem
                done={!!intervention.technicianSignatureUrl}
                label="Firma tecnico"
              />
              <CheckItem
                done={!!intervention.clientSignatureUrl}
                label="Firma cliente (raccomandata)"
              />
            </View>
          </View>

          {/* Signatures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Firme</Text>

            <View style={styles.signatureRow}>
              <View style={styles.signatureCard}>
                <Text style={styles.signatureCardTitle}>Firma Tecnico *</Text>
                {intervention.technicianSignatureUrl ? (
                  <View style={styles.signatureDone}>
                    <Text style={styles.signatureDoneEmoji}>✅</Text>
                    <Text style={styles.signatureDoneText}>Firmato</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.signatureBtn}
                    onPress={() => { setSigningFor('technician'); setShowSignature(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signatureBtnText}>✍️ Firma</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.signatureCard}>
                <Text style={styles.signatureCardTitle}>Firma Cliente</Text>
                {intervention.clientSignatureUrl ? (
                  <View style={styles.signatureDone}>
                    <Text style={styles.signatureDoneEmoji}>✅</Text>
                    <Text style={styles.signatureDoneText}>Firmato</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.signatureBtn, styles.signatureBtnSecondary]}
                    onPress={() => { setSigningFor('client'); setShowSignature(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.signatureBtnText, { color: Colors.primary }]}>✍️ Firma</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Already closed */}
          {intervention.status === 'CLOSED' && (
            <View style={styles.closedBanner}>
              <Text style={styles.closedEmoji}>✅</Text>
              <View>
                <Text style={styles.closedTitle}>Intervento chiuso</Text>
                {intervention.reportPdfUrl && (
                  <Text style={styles.closedSubtitle}>Rapporto PDF generato</Text>
                )}
              </View>
            </View>
          )}

          {/* Close button */}
          {intervention.status !== 'CLOSED' && intervention.status !== 'ARCHIVED' && (
            <TouchableOpacity
              style={[styles.closeBtn, !canClose && styles.closeBtnDisabled]}
              onPress={canClose ? handleClose : () => Alert.alert('Completa tutti i passaggi', 'Assicurati di aver completato check-out, esito e firma tecnico')}
              disabled={closeIntervention.isPending}
              activeOpacity={0.8}
            >
              {closeIntervention.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.closeBtnText}>
                  {canClose ? '🔒 Chiudi intervento e genera PDF' : '⚠️ Passaggi mancanti'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {!canClose && intervention.status !== 'CLOSED' && (
            <Text style={styles.helpText}>
              Per chiudere l'intervento: registra il check-out, compila l'esito e firma come tecnico.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={checkStyles.row}>
      <Text style={[checkStyles.icon, done && checkStyles.iconDone]}>{done ? '✅' : '⬜️'}</Text>
      <Text style={[checkStyles.label, done && checkStyles.labelDone]}>{label}</Text>
    </View>
  );
}

const checkStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  icon: { fontSize: 18, marginRight: Spacing.sm },
  iconDone: {},
  label: { fontSize: FontSize.base, color: Colors.textSecondary },
  labelDone: { color: Colors.text, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 100 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },
  checkCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  signatureRow: { flexDirection: 'row', gap: Spacing.sm },
  signatureCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: Spacing.sm },
  signatureCardTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  signatureDone: { alignItems: 'center' },
  signatureDoneEmoji: { fontSize: 32 },
  signatureDoneText: { fontSize: FontSize.sm, color: Colors.outcomeOk, fontWeight: '700' },
  signatureBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  signatureBtnSecondary: { backgroundColor: Colors.primaryMuted, borderWidth: 1.5, borderColor: Colors.primary },
  signatureBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
  closedBanner: { backgroundColor: Colors.primaryMuted, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.primaryLight, marginBottom: Spacing.md },
  closedEmoji: { fontSize: 32 },
  closedTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primaryDark },
  closedSubtitle: { fontSize: FontSize.sm, color: Colors.primary },
  closeBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, height: 56, justifyContent: 'center', alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  closeBtnDisabled: { backgroundColor: Colors.textMuted },
  closeBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  helpText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 20 },
  signatureContainer: { flex: 1 },
  signatureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingTop: Spacing.lg },
  signatureTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  signatureCancel: { fontSize: FontSize.base, color: Colors.danger },
  signature: { flex: 1 },
  savingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  savingText: { fontSize: FontSize.base, color: Colors.primary, fontWeight: '600' },
});
