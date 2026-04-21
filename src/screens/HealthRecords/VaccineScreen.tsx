import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  CreateVaccineRecordDto,
  PetResponseDto,
  VaccineRecordResponseDto,
} from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { PetHeader } from '../../components/domain/PetHeader';
import { PetSelector } from '../../components/domain/PetSelector';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { usePets } from '../../hooks/usePets';
import { vaccineService } from '../../services';
import { formatDateDisplay, formatDateInput, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';

type FormErrors = {
  vaccineName?: string;
  appliedAt?: string;
  nextDoseAt?: string;
};

export function VaccineScreen() {
  const { pets, isLoading: isPetsLoading } = usePets();

  const [selectedPet, setSelectedPet] = useState<PetResponseDto | null>(null);
  const [vaccines, setVaccines] = useState<VaccineRecordResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vaccineName, setVaccineName] = useState('');
  const [appliedAt, setAppliedAt] = useState('');
  const [nextDoseAt, setNextDoseAt] = useState('');
  const [veterinarianName, setVeterinarianName] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadVaccines = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!selectedPet) return;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await vaccineService.getVaccinesByPet(selectedPet.id);
        setVaccines(data);
      } catch (err) {
        let message = 'Não foi possível carregar as vacinas.';
        if (isAxiosError(err) && err.response?.data?.message) {
          message = String(err.response.data.message);
        }
        setError(message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedPet],
  );

  useFocusEffect(
    useCallback(() => {
      if (selectedPet) {
        void loadVaccines();
      }
    }, [loadVaccines, selectedPet]),
  );

  function handleSelectPet(pet: PetResponseDto) {
    setSelectedPet(pet);
    setVaccines([]);
    setError(null);
  }

  function resetForm() {
    setVaccineName('');
    setAppliedAt('');
    setNextDoseAt('');
    setVeterinarianName('');
    setNotes('');
    setFormErrors({});
  }

  function openModal() {
    resetForm();
    setModalVisible(true);
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!vaccineName.trim()) errors.vaccineName = 'Nome da vacina é obrigatório';
    if (!appliedAt.trim()) {
      errors.appliedAt = 'Data de aplicação é obrigatória';
    } else if (!parseDate(appliedAt)) {
      errors.appliedAt = 'Data inválida. Use DD/MM/AAAA';
    }
    if (nextDoseAt.trim() && !parseDate(nextDoseAt)) {
      errors.nextDoseAt = 'Data inválida. Use DD/MM/AAAA';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedPet) return;

    setIsSubmitting(true);
    try {
      const payload: CreateVaccineRecordDto = {
        pet_id: selectedPet.id,
        vaccine_name: vaccineName.trim(),
        applied_at: parseDate(appliedAt)!,
      };

      const parsedNextDose = nextDoseAt.trim() ? parseDate(nextDoseAt) : undefined;
      if (parsedNextDose) payload.next_dose_at = parsedNextDose;
      if (veterinarianName.trim()) payload.veterinarian_name = veterinarianName.trim();
      if (notes.trim()) payload.notes = notes.trim();

      await vaccineService.createVaccine(payload);

      setModalVisible(false);
      Alert.alert('Sucesso', 'Vacina registrada com sucesso!');
      void loadVaccines();
    } catch (err) {
      let message = 'Não foi possível registrar a vacina. Tente novamente.';
      if (isAxiosError(err) && err.response?.data?.message) {
        message = String(err.response.data.message);
      }
      Alert.alert('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- Pet selector ---
  if (!selectedPet) {
    return (
      <PetSelector
        pets={pets}
        isLoading={isPetsLoading}
        onSelectPet={handleSelectPet}
        subtitle="Escolha o pet para visualizar e registrar vacinas."
        emptyDescription="Cadastre um pet primeiro para registrar vacinas."
      />
    );
  }

  // --- Vaccine list ---
  function renderVaccineItem({ item }: { item: VaccineRecordResponseDto }) {
    return (
      <View style={styles.vaccineCard}>
        <View style={styles.vaccineHeader}>
          <Ionicons color={colors.primary} name="medkit" size={20} />
          <Text style={styles.vaccineName}>{item.vaccine_name}</Text>
        </View>

        <View style={styles.vaccineDetails}>
          <View style={styles.vaccineDetailRow}>
            <Ionicons color={colors.muted} name="calendar-outline" size={16} />
            <Text style={styles.vaccineDetailText}>
              Aplicada em {formatDateDisplay(item.applied_at)}
            </Text>
          </View>

          {item.next_dose_at ? (
            <View style={styles.vaccineDetailRow}>
              <Ionicons color={colors.warning} name="time-outline" size={16} />
              <Text style={styles.vaccineDetailText}>
                Próxima dose: {formatDateDisplay(item.next_dose_at)}
              </Text>
            </View>
          ) : null}

          {item.veterinarian_name ? (
            <View style={styles.vaccineDetailRow}>
              <Ionicons color={colors.muted} name="person-outline" size={16} />
              <Text style={styles.vaccineDetailText}>{item.veterinarian_name}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pet header */}
      <PetHeader petName={selectedPet.name} onBack={() => setSelectedPet(null)} />

      {/* Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ErrorState message={error} onRetry={() => void loadVaccines()} />
        </View>
      ) : vaccines.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="medkit-outline"
            title="Nenhuma vacina registrada"
            description="Registre a primeira vacina do seu pet."
            actionLabel="Adicionar vacina"
            onActionPress={openModal}
          />
        </View>
      ) : (
        <FlatList
          data={vaccines}
          keyExtractor={(item) => item.id}
          renderItem={renderVaccineItem}
          contentContainerStyle={styles.vaccineListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadVaccines('refresh')}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {!isLoading && !error && vaccines.length > 0 ? (
        <FAB accessibilityLabel="Adicionar vacina" onPress={openModal} />
      ) : null}

      {/* Form Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalKeyboard}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nova vacina</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Vaccine name */}
                <View style={styles.field}>
                  <Text style={styles.label}>Nome da vacina *</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={(t) => {
                      setVaccineName(t);
                      if (formErrors.vaccineName)
                        setFormErrors((e) => ({ ...e, vaccineName: undefined }));
                    }}
                    placeholder="Ex: V10, Antirrábica, Gripe..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.vaccineName ? styles.inputError : null]}
                    value={vaccineName}
                  />
                  {formErrors.vaccineName ? (
                    <Text style={styles.errorText}>{formErrors.vaccineName}</Text>
                  ) : null}
                </View>

                {/* Applied at */}
                <View style={styles.field}>
                  <Text style={styles.label}>Data de aplicação *</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setAppliedAt(formatDateInput(t));
                      if (formErrors.appliedAt)
                        setFormErrors((e) => ({ ...e, appliedAt: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.appliedAt ? styles.inputError : null]}
                    value={appliedAt}
                  />
                  {formErrors.appliedAt ? (
                    <Text style={styles.errorText}>{formErrors.appliedAt}</Text>
                  ) : null}
                </View>

                {/* Next dose */}
                <View style={styles.field}>
                  <Text style={styles.label}>Próxima dose</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setNextDoseAt(formatDateInput(t));
                      if (formErrors.nextDoseAt)
                        setFormErrors((e) => ({ ...e, nextDoseAt: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.nextDoseAt ? styles.inputError : null]}
                    value={nextDoseAt}
                  />
                  {formErrors.nextDoseAt ? (
                    <Text style={styles.errorText}>{formErrors.nextDoseAt}</Text>
                  ) : null}
                </View>

                {/* Veterinarian */}
                <View style={styles.field}>
                  <Text style={styles.label}>Veterinário</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={setVeterinarianName}
                    placeholder="Nome do veterinário"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                    value={veterinarianName}
                  />
                </View>

                {/* Notes */}
                <View style={styles.field}>
                  <Text style={styles.label}>Observações</Text>
                  <TextInput
                    multiline
                    numberOfLines={3}
                    onChangeText={setNotes}
                    placeholder="Observações adicionais..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, styles.textArea]}
                    textAlignVertical="top"
                    value={notes}
                  />
                </View>

                {/* Submit */}
                <Pressable
                  disabled={isSubmitting}
                  onPress={handleSubmit}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSubmitting && styles.submitButtonDisabled,
                    pressed && !isSubmitting && styles.pressed,
                  ]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Registrar vacina</Text>
                  )}
                </Pressable>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Vaccine list
  vaccineListContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl + 60,
  },
  vaccineCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  vaccineHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  vaccineName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  vaccineDetails: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  vaccineDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  vaccineDetailText: {
    ...typography.bodySmall,
    color: colors.muted,
  },

  // Modal
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalKeyboard: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: '85%',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
  },

  // Form
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  inputError: {
    borderColor: colors.danger,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.white,
  },
  pressed: {
    opacity: 0.82,
  },
});
