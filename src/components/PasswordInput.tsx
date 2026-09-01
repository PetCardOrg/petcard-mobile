import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { colors, radii, spacing } from '../utils/theme';

type Props = Omit<TextInputProps, 'secureTextEntry' | 'placeholderTextColor'>;

/**
 * Campo de senha com botão de olho para alternar entre pontinhos e texto
 * (mobile#54). Usado no login, cadastro e redefinição.
 */
export function PasswordInput({ style, ...props }: Props) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        autoCapitalize="none"
        placeholderTextColor={colors.muted}
        {...props}
        secureTextEntry={!visible}
        style={[styles.input, style]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? t('common.hidePassword') : t('common.showPassword')}
        hitSlop={8}
        onPress={() => setVisible((v) => !v)}
        style={styles.toggle}
      >
        <Ionicons
          color={colors.muted}
          name={visible ? 'eye-off-outline' : 'eye-outline'}
          size={20}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingRight: 48,
    paddingVertical: 12,
  },
  toggle: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
