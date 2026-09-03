import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../utils/theme';

type DurationOptionsProps = {
  value: number;
  onChange: (minutes: number) => void;
  /** Rótulo lido por leitor de tela em cada botão. */
  accessibilityLabel?: string;
};

export const DURATION_OPTIONS_MINUTES = [15, 30, 60, 90, 120];

/**
 * Duração por botões fixos.
 *
 * Substitui o controle de arrasto (`DurationSlider`): a barra reagia mal ao
 * toque em telas menores e deixava escolher valores fora do que a agenda
 * realmente usa. Botões removem o gesto e limitam às opções do web#51.
 */
export function DurationOptions({
  value,
  onChange,
  accessibilityLabel = 'Duração',
}: DurationOptionsProps) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.row} testID="duration-options">
      {DURATION_OPTIONS_MINUTES.map((minutos) => {
        const selecionado = minutos === value;
        return (
          <Pressable
            accessibilityLabel={`${minutos} minutos`}
            accessibilityRole="button"
            accessibilityState={{ selected: selecionado }}
            key={minutos}
            onPress={() => onChange(minutos)}
            style={[styles.option, selecionado ? styles.optionSelected : null]}
            testID={`duration-option-${minutos}`}
          >
            <Text style={[styles.optionText, selecionado ? styles.optionTextSelected : null]}>
              {minutos}min
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    backgroundColor: colors.primarySoft,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionSelected: {
    backgroundColor: colors.primary,
  },
  optionText: {
    ...typography.button,
    color: colors.primaryDark,
  },
  optionTextSelected: {
    color: colors.white,
  },
});
