import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { isAxiosError } from 'axios';

import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { PasswordInput } from '../../components/PasswordInput';
import { PasswordRulesChecklist } from '../../components/PasswordRulesChecklist';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { useAuth } from '../../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../../utils/theme';
import { formatPhoneBR, unformatPhone } from '../../utils/phoneMask';
import { PASSWORD_MAX_LENGTH, validatePasswordStrength } from '../../utils/passwordStrength';
import type { AuthStackParamList } from '../../navigation/types';

type RegisterNav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;

export function RegisterScreen() {
  const { isLoading, register } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<RegisterNav>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('register.permissionRequired'), t('register.permissionGallery'));
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

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError(t('register.fillFields'));
      return;
    }

    if (name.trim().length < NAME_MIN_LENGTH) {
      setError(t('register.nameTooShort'));
      return;
    }

    const rule = validatePasswordStrength(password);
    if (rule) {
      setError(t(`passwordRules.${rule}`));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    try {
      setError(null);
      const rawPhone = unformatPhone(phone);
      await register(name.trim(), email.trim(), password, {
        phone: rawPhone || undefined,
        photoUri: imageUri ?? undefined,
      });
    } catch (err) {
      let message = t('register.errorMessage');
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      setError(message);
    }
  };

  return (
    <ScreenContainer
      actionLabel={isLoading ? undefined : t('register.button')}
      onActionPress={handleRegister}
      secondaryActionLabel={t('register.loginLink')}
      onSecondaryActionPress={() => navigation.goBack()}
      subtitle={t('register.subtitle')}
      title={t('register.title')}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.primary} size="large" style={styles.loader} />
      ) : (
        <View style={styles.form}>
          <Pressable
            accessibilityLabel={t('register.addPhoto')}
            accessibilityRole="button"
            onPress={handlePickImage}
            style={styles.photoContainer}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoText}>{t('register.addPhoto')}</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.label}>{t('register.nameLabel')}</Text>
          <TextInput
            autoCapitalize="words"
            autoComplete="name"
            maxLength={NAME_MAX_LENGTH}
            onChangeText={setName}
            placeholder={t('register.namePlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={name}
          />

          <Text style={styles.label}>{t('register.emailLabel')}</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            inputMode="email"
            maxLength={EMAIL_MAX_LENGTH}
            onChangeText={setEmail}
            placeholder={t('register.emailPlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={email}
          />

          <Text style={styles.label}>{t('register.phoneLabel')}</Text>
          <TextInput
            autoComplete="tel"
            keyboardType="phone-pad"
            maxLength={15}
            onChangeText={(text) => setPhone(formatPhoneBR(text))}
            placeholder={t('register.phonePlaceholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={phone}
          />

          <Text style={styles.label}>{t('register.passwordLabel')}</Text>
          <PasswordInput
            maxLength={PASSWORD_MAX_LENGTH}
            onChangeText={setPassword}
            placeholder={t('register.passwordPlaceholder')}
            value={password}
          />

          <PasswordRulesChecklist password={password} />

          <Text style={styles.label}>{t('register.confirmPasswordLabel')}</Text>
          <PasswordInput
            maxLength={PASSWORD_MAX_LENGTH}
            onChangeText={setConfirmPassword}
            placeholder={t('register.confirmPasswordPlaceholder')}
            value={confirmPassword}
          />

          <GoogleSignInButton label={t('register.googleButton')} onError={setError} />

          {error ? (
            <View style={styles.callout}>
              <Text style={styles.calloutTitle}>{t('register.errorTitle')}</Text>
              <Text style={styles.calloutText}>{error}</Text>
            </View>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: spacing.lg,
  },
  form: {
    gap: spacing.sm,
  },
  photoContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: colors.border,
    borderRadius: 50,
    borderStyle: 'dashed',
    borderWidth: 2,
    height: 100,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    overflow: 'hidden',
    width: 100,
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  photoText: {
    ...typography.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  photoImage: {
    height: 100,
    width: 100,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  callout: {
    backgroundColor: colors.dangerSoft,
    borderColor: '#FECACA',
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  calloutTitle: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  calloutText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
