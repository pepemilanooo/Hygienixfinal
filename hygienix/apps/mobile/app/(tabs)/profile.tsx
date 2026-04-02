import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Spacing, Radius, FontSize } from '../../constants/colors';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Amministratore',
  MANAGER: 'Manager',
  TECHNICIAN: 'Tecnico',
};

const ROLE_EMOJI: Record<string, string> = {
  ADMIN: '👑',
  MANAGER: '📊',
  TECHNICIAN: '🔧',
};

function MenuItem({
  emoji,
  label,
  value,
  onPress,
  color,
  rightElement,
}: {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  color?: string;
  rightElement?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.menuEmoji}>{emoji}</Text>
      <Text style={[styles.menuLabel, color && { color }]}>{label}</Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      {rightElement || (onPress && <Text style={styles.menuChevron}>›</Text>)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Esci', 'Confermi il logout?', [
      { text: 'Annulla', style: 'cancel' },
      {
        text: 'Esci',
        style: 'destructive',
        onPress: () => clearAuth(),
      },
    ]);
  };

  if (!user) return null;

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.fullName}>{user.firstName} {user.lastName}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleEmoji}>{ROLE_EMOJI[user.role]}</Text>
          <Text style={styles.roleLabel}>{ROLE_LABELS[user.role]}</Text>
        </View>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          <MenuItem emoji="👤" label="Nome" value={user.firstName} />
          <MenuItem emoji="👥" label="Cognome" value={user.lastName} />
          <MenuItem emoji="✉️" label="Email" value={user.email} />
          <MenuItem emoji="🔑" label="Ruolo" value={ROLE_LABELS[user.role]} />
        </View>
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Applicazione</Text>
        <View style={styles.menuCard}>
          <MenuItem emoji="🔔" label="Notifiche" onPress={() => {}} />
          <MenuItem emoji="🌍" label="Lingua" value="Italiano" />
          <MenuItem emoji="📱" label="Versione app" value="1.0.0" />
        </View>
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supporto</Text>
        <View style={styles.menuCard}>
          <MenuItem emoji="❓" label="Guida e FAQ" onPress={() => {}} />
          <MenuItem emoji="📧" label="Contatta il supporto" onPress={() => {}} />
          <MenuItem emoji="📋" label="Termini di servizio" onPress={() => {}} />
          <MenuItem emoji="🔒" label="Privacy policy" onPress={() => {}} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutBtnText}>🚪 Esci dall'account</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Hygienix v1.0.0 — Pest Control Management</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingTop: 60, paddingBottom: 100 },
  avatarSection: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#fff' },
  fullName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text, marginBottom: Spacing.sm },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  roleEmoji: { fontSize: 14 },
  roleLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primaryDark },
  email: { fontSize: FontSize.sm, color: Colors.textSecondary },
  section: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  menuEmoji: { fontSize: 18, width: 24 },
  menuLabel: { flex: 1, fontSize: FontSize.base, color: Colors.text },
  menuValue: { fontSize: FontSize.sm, color: Colors.textSecondary },
  menuChevron: { fontSize: 20, color: Colors.textMuted },
  logoutBtn: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.danger + '15',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.danger + '40',
  },
  logoutBtnText: { color: Colors.danger, fontSize: FontSize.base, fontWeight: '700' },
  footer: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.sm },
});
