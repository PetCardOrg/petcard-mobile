import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { MIN_QUERY_LENGTH, usePlaceAutocomplete } from '../../hooks/usePlaceAutocomplete';
import type { PlaceSuggestion } from '../../services/clinic.service';
import { colors, radii, spacing, typography } from '../../utils/theme';

type PlaceAutocompleteInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

/**
 * Campo de local com sugestões do Google Places.
 *
 * O texto continua livre — o tutor pode digitar um local que o Google não
 * conhece e salvar assim mesmo. A sugestão é atalho, não obrigação.
 *
 * A lista é um `View` com `map`, e não uma `FlatList`: o campo vive dentro do
 * `ScrollView` do modal de agendamento, e lista virtualizada aninhada em
 * scroll do mesmo eixo perde o scroll e emite aviso do React Native.
 */
export function PlaceAutocompleteInput({
  value,
  onChangeText,
  placeholder,
}: PlaceAutocompleteInputProps) {
  const { t } = useTranslation();
  const { suggestions, isLoading, search, reset } = usePlaceAutocomplete();

  // Escolher uma sugestão escreve no campo, e escrever no campo normalmente
  // dispara nova busca — sem esta trava a lista reabriria logo após a escolha.
  const [aberto, setAberto] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      onChangeText(text);
      setAberto(true);
      search(text);
    },
    [onChangeText, search],
  );

  const handleSelect = useCallback(
    (suggestion: PlaceSuggestion) => {
      onChangeText(suggestion.fullText);
      setAberto(false);
      reset();
    },
    [onChangeText, reset],
  );

  const handleClear = useCallback(() => {
    onChangeText('');
    setAberto(false);
    reset();
  }, [onChangeText, reset]);

  const mostrarLista = aberto && value.trim().length >= MIN_QUERY_LENGTH;
  const vazio = mostrarLista && !isLoading && suggestions.length === 0;

  return (
    <View>
      <View style={styles.inputWrapper}>
        <Ionicons color={colors.muted} name="location-outline" size={18} style={styles.inputIcon} />
        <TextInput
          autoCapitalize="sentences"
          autoCorrect={false}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.input}
          testID="place-autocomplete-input"
          value={value}
        />
        {isLoading ? (
          <ActivityIndicator color={colors.primary} size="small" style={styles.trailing} />
        ) : value.length > 0 ? (
          <Pressable
            accessibilityLabel={t('appointments.form.locationClear')}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleClear}
            style={styles.trailing}
            testID="place-autocomplete-clear"
          >
            <Ionicons color={colors.muted} name="close-circle" size={18} />
          </Pressable>
        ) : null}
      </View>

      {mostrarLista && suggestions.length > 0 ? (
        <View style={styles.suggestionList} testID="place-autocomplete-suggestions">
          {suggestions.map((suggestion, index) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.placeId}
              onPress={() => handleSelect(suggestion)}
              style={({ pressed }) => [
                styles.suggestion,
                index > 0 && styles.suggestionDivider,
                pressed && styles.suggestionPressed,
              ]}
              testID={`place-suggestion-${suggestion.placeId}`}
            >
              <Ionicons color={colors.primaryDark} name="business-outline" size={16} />
              <View style={styles.suggestionTexts}>
                <Text numberOfLines={1} style={styles.suggestionMain}>
                  {suggestion.mainText}
                </Text>
                {suggestion.secondaryText ? (
                  <Text numberOfLines={1} style={styles.suggestionSecondary}>
                    {suggestion.secondaryText}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {vazio ? <Text style={styles.hint}>{t('appointments.form.locationNoResults')}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    paddingVertical: 14,
  },
  trailing: {
    marginLeft: spacing.sm,
  },
  suggestionList: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  suggestion: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  suggestionDivider: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  suggestionPressed: {
    backgroundColor: colors.primarySoft,
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionMain: {
    ...typography.bodySmall,
    color: colors.text,
  },
  suggestionSecondary: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 1,
  },
  hint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
});
