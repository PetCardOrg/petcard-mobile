import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { supportedLanguages } from '../../i18n';
import { colors, radii, spacing, typography } from '../../utils/theme';

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const handleLogout = () => {
    Alert.alert(t('profile.logoutTitle'), t('profile.logoutMessage'), [
      { text: t('profile.logoutCancel'), style: 'cancel' },
      {
        text: t('profile.logoutConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert(t('common.error'), t('profile.logoutError'));
          }
        },
      },
    ]);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoMark}>
          <Ionicons color={colors.white} name="paw" size={20} />
        </View>

        <Text style={styles.title}>{t('profile.title')}</Text>

        <View style={styles.card}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons color={colors.white} name="person" size={32} />
          </View>

          <Text style={styles.name}>{user?.name ?? t('profile.defaultName')}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
        </View>

        {/* Language selector */}
        <View style={styles.languageSection}>
          <Text style={styles.languageLabel}>{t('profile.language')}</Text>
          <View style={styles.languageRow}>
            {supportedLanguages.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleLanguageChange(lang.code)}
                  style={[styles.languageChip, isActive && styles.languageChipActive]}
                >
                  <Text
                    style={[styles.languageChipText, isActive && styles.languageChipTextActive]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityLabel={t('profile.logoutAccessibility')}
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.danger} name="log-out-outline" size={20} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
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
  languageSection: {
    marginTop: spacing.lg,
  },
  languageLabel: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  languageRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  languageChip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  languageChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  languageChipText: {
    ...typography.button,
    color: colors.muted,
  },
  languageChipTextActive: {
    color: colors.primaryDark,
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
