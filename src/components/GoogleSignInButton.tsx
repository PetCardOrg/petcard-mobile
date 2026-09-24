import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GoogleLogo } from './GoogleLogo';
import { isGoogleAuthConfigured, useGoogleAuth } from '../hooks/useGoogleAuth';
import { colors, radii, spacing, typography } from '../utils/theme';

// Cores da marca Google (guia oficial do botão de login).
const GOOGLE_BLUE = '#4285F4';
const GOOGLE_BORDER = '#DADCE0';
const GOOGLE_TEXT = '#3C4043';
const GOOGLE_SURFACE = '#FFFFFF';
const GOOGLE_SURFACE_PRESSED = '#F1F3F4';

type Props = {
  label: string;
  onError?: (message: string) => void;
};

function GoogleSignInButtonInner({ label, onError }: Props) {
  const { t } = useTranslation();
  const google = useGoogleAuth(onError);

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('common.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={google.inProgress}
        onPress={google.promptAsync}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          google.inProgress && styles.buttonDisabled,
        ]}
      >
        <View style={styles.iconSlot}>
          {google.inProgress ? (
            <ActivityIndicator color={GOOGLE_BLUE} size="small" />
          ) : (
            <GoogleLogo size={18} />
          )}
        </View>
        <Text style={styles.label}>{label}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Botão "Entrar/Cadastrar com Google". Só renderiza (e só então monta o hook
 * `useGoogleAuth`, que lança sem client ID) quando a plataforma atual está
 * configurada — ver `isGoogleAuthConfigured`.
 */
export function GoogleSignInButton(props: Props) {
  if (!isGoogleAuthConfigured()) {
    return null;
  }
  return <GoogleSignInButtonInner {...props} />;
}

const styles = StyleSheet.create({
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...typography.caption,
    color: colors.muted,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  button: {
    alignItems: 'center',
    backgroundColor: GOOGLE_SURFACE,
    borderColor: GOOGLE_BORDER,
    borderRadius: radii.md,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  buttonPressed: {
    backgroundColor: GOOGLE_SURFACE_PRESSED,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  iconSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 20,
  },
  label: {
    ...typography.button,
    color: GOOGLE_TEXT,
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
