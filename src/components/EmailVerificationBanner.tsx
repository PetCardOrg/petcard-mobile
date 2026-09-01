import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { colors, radii, spacing, typography } from '../utils/theme';

type State = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Aviso persistente enquanto o e-mail do tutor não foi confirmado (mobile#54).
 *
 * A verificação é "soft": não bloqueia o uso do app. O tutor confirma o e-mail
 * pela página web aberta pelo link — ao voltar para o app, `refreshUser`
 * relê `/tutors/me` e o aviso some sozinho quando `email_verified` fica true.
 */
export function EmailVerificationBanner() {
  const { user, resendVerification, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [state, setState] = useState<State>('idle');

  const pending = user?.email_verified === false;

  useEffect(() => {
    if (!pending) return;
    void refreshUser();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refreshUser();
    });
    return () => sub.remove();
  }, [pending, refreshUser]);

  if (!user || user.email_verified !== false) {
    return null;
  }

  const handleResend = async () => {
    setState('sending');
    try {
      await resendVerification();
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons color={colors.warning} name="mail-unread-outline" size={20} />
      <View style={styles.body}>
        <Text style={styles.title}>{t('emailVerification.bannerTitle')}</Text>
        <Text style={styles.text}>
          {state === 'sent'
            ? t('emailVerification.bannerSent')
            : state === 'error'
              ? t('emailVerification.bannerError')
              : t('emailVerification.bannerText')}
        </Text>
        {state !== 'sent' ? (
          <Pressable
            accessibilityRole="button"
            disabled={state === 'sending'}
            hitSlop={8}
            onPress={handleResend}
          >
            <Text style={styles.action}>
              {state === 'sending'
                ? t('emailVerification.bannerSending')
                : t('emailVerification.bannerResend')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...typography.label,
    color: colors.text,
  },
  text: {
    ...typography.bodySmall,
    color: colors.muted,
  },
  action: {
    ...typography.label,
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
});
