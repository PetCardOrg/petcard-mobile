import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { tutorService, uploadService } from '../../services';
import { supportedLanguages } from '../../i18n';
import { colors, radii, spacing, typography } from '../../utils/theme';

export function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const { t, i18n } = useTranslation();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const avatarUri = imageUri ?? user?.profile_image_url ?? null;

  function handleStartEditing() {
    setName(user?.name ?? '');
    setPhone(user?.phone ?? '');
    setImageUri(null);
    setIsEditing(true);
  }

  function handleCancelEditing() {
    setIsEditing(false);
    setImageUri(null);
  }

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('profile.permissionRequired'), t('profile.permissionGallery'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      let profileImageUrl: string | undefined;
      if (imageUri) {
        profileImageUrl = await uploadService.uploadImage(imageUri, 'tutors');
      }

      const updated = await tutorService.updateCurrentTutor({
        name: name.trim(),
        phone: phone.trim(),
        ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
      });

      await updateUser(updated);
      setIsEditing(false);
      setImageUri(null);
    } catch (err) {
      let message = t('profile.saveError');
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSaving(false);
    }
  }

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

  const handleDeleteAccount = () => {
    Alert.alert(t('profile.deleteTitle'), t('profile.deleteMessage'), [
      { text: t('profile.deleteCancel'), style: 'cancel' },
      {
        text: t('profile.deleteContinue'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('profile.deleteConfirmTitle'), t('profile.deleteConfirmMessage'), [
            { text: t('profile.deleteConfirmCancel'), style: 'cancel' },
            {
              text: t('profile.deleteConfirmButton'),
              style: 'destructive',
              onPress: async () => {
                try {
                  await tutorService.deleteCurrentTutor();
                  await logout();
                } catch {
                  Alert.alert(t('common.error'), t('profile.deleteError'));
                }
              },
            },
          ]);
        },
      },
    ]);
  };

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Ionicons color={colors.white} name="paw" size={20} />
            </View>
            <Text style={styles.title}>{t('profile.title')}</Text>
          </View>

          <View style={styles.card}>
            {!isEditing ? (
              <Pressable
                accessibilityLabel={t('profile.editAccessibility')}
                accessibilityRole="button"
                onPress={handleStartEditing}
                style={styles.editButton}
              >
                <Ionicons color={colors.primary} name="pencil" size={18} />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityLabel={t('profile.editPhoto')}
              accessibilityRole="button"
              disabled={!isEditing}
              onPress={handlePickImage}
              style={styles.avatarWrap}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons color={colors.white} name="person" size={32} />
                </View>
              )}
              {isEditing ? (
                <View style={styles.avatarEditBadge}>
                  <Ionicons color={colors.white} name="camera" size={14} />
                </View>
              ) : null}
            </Pressable>
            {isEditing ? <Text style={styles.editPhotoHint}>{t('profile.editPhoto')}</Text> : null}

            {isEditing ? (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>{t('profile.nameLabel')}</Text>
                  <TextInput
                    accessibilityLabel={t('profile.nameLabel')}
                    autoCapitalize="words"
                    onChangeText={setName}
                    placeholder={t('profile.namePlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={name}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>{t('profile.phoneLabel')}</Text>
                  <TextInput
                    accessibilityLabel={t('profile.phoneLabel')}
                    keyboardType="phone-pad"
                    onChangeText={setPhone}
                    placeholder={t('profile.phonePlaceholder')}
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={phone}
                  />
                </View>

                <View style={styles.editActionsRow}>
                  <Pressable
                    disabled={isSaving}
                    onPress={handleCancelEditing}
                    style={[styles.secondaryButton, isSaving && styles.buttonDisabled]}
                  >
                    <Text style={styles.secondaryButtonText}>{t('profile.cancel')}</Text>
                  </Pressable>
                  <Pressable
                    disabled={isSaving}
                    onPress={handleSave}
                    style={[styles.primaryButton, isSaving && styles.buttonDisabled]}
                  >
                    {isSaving ? (
                      <ActivityIndicator color={colors.white} size="small" />
                    ) : (
                      <Text style={styles.primaryButtonText}>{t('profile.save')}</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <>
                <Text style={styles.name}>{user?.name ?? t('profile.defaultName')}</Text>
                {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
                {user?.phone ? <Text style={styles.email}>{user.phone}</Text> : null}
              </>
            )}
          </View>

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

          <Pressable
            accessibilityLabel={t('profile.deleteAccountAccessibility')}
            accessibilityRole="button"
            onPress={handleDeleteAccount}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          >
            <Text style={styles.deleteText}>{t('profile.deleteAccount')}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl + 40,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
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
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    position: 'relative',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    width: 32,
  },
  avatarWrap: {
    marginBottom: spacing.md,
    position: 'relative',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  avatarImage: {
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  avatarEditBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    borderRadius: 12,
    bottom: 0,
    height: 24,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 24,
  },
  editPhotoHint: {
    ...typography.bodySmall,
    color: colors.primary,
    marginBottom: spacing.md,
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
  form: {
    alignSelf: 'stretch',
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.text,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 10,
  },
  deleteText: {
    ...typography.bodySmall,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.82,
  },
});
