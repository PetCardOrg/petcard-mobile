import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DeleteTutorDto } from '@petcardorg/shared';

import { GoogleLogo } from '../../components/GoogleLogo';
import { PasswordInput } from '../../components/PasswordInput';
import { isGoogleAuthConfigured, useGoogleIdToken } from '../../hooks/useGoogleAuth';
import { isFalhaDeReautenticacao } from '../../services/api';
import { colors, radii, spacing, typography } from '../../utils/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Exclui a conta com a prova; rejeita se a API recusar. */
  onExcluir: (prova: DeleteTutorDto) => Promise<void>;
};

/**
 * Último passo da exclusão da conta: provar que é o dono (AUD MOB-14). O app
 * não sabe se a conta tem senha ou só Google, então oferece os dois; a API
 * confere o que vier (D2).
 */
export function ConfirmarExclusaoModal({ visible, onClose, onExcluir }: Props) {
  const { t } = useTranslation();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function excluir(prova: DeleteTutorDto, erroDeIdentidade: string) {
    setErro(null);
    setEnviando(true);
    try {
      await onExcluir(prova);
    } catch (err) {
      setErro(isFalhaDeReautenticacao(err) ? erroDeIdentidade : t('profile.deleteError'));
      setEnviando(false);
    }
  }

  function handleConfirmarSenha() {
    if (senha === '') return;
    void excluir({ senha_atual: senha }, t('profile.deleteReauthWrongPassword'));
  }

  function handleFechar() {
    setSenha('');
    setErro(null);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={handleFechar} transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('profile.deleteReauthTitle')}</Text>
          <Text style={styles.subtitle}>{t('profile.deleteReauthMessage')}</Text>

          <Text style={styles.label}>{t('profile.deleteReauthPasswordLabel')}</Text>
          <PasswordInput
            accessibilityLabel={t('profile.deleteReauthPasswordLabel')}
            autoComplete="current-password"
            editable={!enviando}
            onChangeText={setSenha}
            onSubmitEditing={handleConfirmarSenha}
            value={senha}
          />

          {erro ? <Text style={styles.error}>{erro}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={enviando}
            onPress={handleConfirmarSenha}
            style={({ pressed }) => [
              styles.dangerButton,
              pressed && styles.pressed,
              enviando && styles.disabled,
            ]}
          >
            {enviando ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.dangerButtonText}>{t('profile.deleteConfirmButton')}</Text>
            )}
          </Pressable>

          {isGoogleAuthConfigured() ? (
            <ConfirmarComGoogle
              disabled={enviando}
              onErro={setErro}
              onToken={(token) =>
                void excluir({ google_id_token: token }, t('profile.deleteReauthGoogleFailed'))
              }
            />
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={enviando}
            onPress={handleFechar}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>{t('profile.deleteConfirmCancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Separado porque `useGoogleIdToken` lança sem client ID configurado. */
function ConfirmarComGoogle({
  disabled,
  onErro,
  onToken,
}: {
  disabled: boolean;
  onErro: (mensagem: string) => void;
  onToken: (token: string) => void;
}) {
  const { t } = useTranslation();
  const google = useGoogleIdToken();

  async function handlePress() {
    try {
      const token = await google.obterIdToken();
      if (token) onToken(token);
    } catch {
      onErro(t('login.googleError'));
    }
  }

  return (
    <>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('common.or')}</Text>
        <View style={styles.dividerLine} />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || !google.pronto}
        onPress={() => void handlePress()}
        style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
      >
        <GoogleLogo size={18} />
        <Text style={styles.googleButtonText}>{t('profile.deleteReauthGoogle')}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(20, 49, 63, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    maxWidth: 420,
    padding: spacing.lg,
    width: '100%',
  },
  title: {
    ...typography.h3,
    color: colors.text,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.muted,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  dangerButton: {
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: radii.md,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 14,
  },
  dangerButtonText: {
    ...typography.button,
    color: colors.white,
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  googleButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: 14,
  },
  googleButtonText: {
    ...typography.button,
    color: colors.text,
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 10,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.muted,
  },
  pressed: {
    opacity: 0.82,
  },
  disabled: {
    opacity: 0.6,
  },
});
