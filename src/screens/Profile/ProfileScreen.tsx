import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../utils/theme';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoMark}>
          <Ionicons color={colors.white} name="paw" size={20} />
        </View>

        <Text style={styles.title}>Perfil</Text>

        <View style={styles.card}>
          {user?.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons color={colors.white} name="person" size={32} />
            </View>
          )}

          <Text style={styles.name}>{user?.name ?? 'Usuário'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        <Pressable
          accessibilityLabel="Sair da conta"
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.danger} name="log-out-outline" size={20} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    width: 40,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  avatar: {
    borderRadius: 40,
    height: 80,
    marginBottom: spacing.md,
    width: 80,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 80,
  },
  name: {
    ...typography.h2,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  logoutButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: 14,
  },
  logoutText: {
    ...typography.button,
    color: colors.danger,
  },
  pressed: {
    opacity: 0.82,
  },
});
