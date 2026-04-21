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
  CreateMedicationRecordDto,
  MedicationRecordResponseDto,
  PetResponseDto,
} from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { PetHeader } from '../../components/domain/PetHeader';
import { PetSelector } from '../../components/domain/PetSelector';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { FAB } from '../../components/ui/FAB';
import { usePets } from '../../hooks/usePets';
import { medicationService } from '../../services';
import { formatDateDisplay, formatDateInput, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';

function isMedicationActive(item: MedicationRecordResponseDto): boolean {
  if (!item.end_date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${item.end_date}T00:00:00`);
  return endDate >= today;
}

type FormErrors = {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
};

export function MedicationScreen() {
  const { pets, isLoading: isPetsLoading } = usePets();

  const [selectedPet, setSelectedPet] = useState<PetResponseDto | null>(null);
  const [medications, setMedications] = useState<MedicationRecordResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const loadMedications = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!selectedPet) return;

      if (mode === 'refresh') {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const data = await medicationService.getMedicationsByPet(selectedPet.id);
        setMedications(data);
      } catch (err) {
        let message = 'Não foi possível carregar as medicações.';
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
        void loadMedications();
      }
    }, [loadMedications, selectedPet]),
  );

  function handleSelectPet(pet: PetResponseDto) {
    setSelectedPet(pet);
    setMedications([]);
    setError(null);
  }

  function resetForm() {
    setMedicationName('');
    setDosage('');
    setFrequency('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setFormErrors({});
  }

  function openModal() {
    resetForm();
    setModalVisible(true);
  }

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!medicationName.trim()) errors.medicationName = 'Nome do medicamento é obrigatório';
    if (!dosage.trim()) errors.dosage = 'Dosagem é obrigatória';
    if (!frequency.trim()) errors.frequency = 'Frequência é obrigatória';
    if (!startDate.trim()) {
      errors.startDate = 'Data de início é obrigatória';
    } else if (!parseDate(startDate)) {
      errors.startDate = 'Data inválida. Use DD/MM/AAAA';
    }
    if (endDate.trim() && !parseDate(endDate)) {
      errors.endDate = 'Data inválida. Use DD/MM/AAAA';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    if (!validateForm() || !selectedPet) return;

    setIsSubmitting(true);
    try {
      const payload: CreateMedicationRecordDto = {
        pet_id: selectedPet.id,
        medication_name: medicationName.trim(),
        dosage: dosage.trim(),
        frequency: frequency.trim(),
        start_date: parseDate(startDate)!,
      };

      const parsedEndDate = endDate.trim() ? parseDate(endDate) : undefined;
      if (parsedEndDate) payload.end_date = parsedEndDate;
      if (notes.trim()) payload.notes = notes.trim();

      await medicationService.createMedication(payload);

      setModalVisible(false);
      Alert.alert('Sucesso', 'Medicação registrada com sucesso!');
      void loadMedications();
    } catch (err) {
      let message = 'Não foi possível registrar a medicação. Tente novamente.';
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
        subtitle="Escolha o pet para visualizar e registrar medicações."
        emptyDescription="Cadastre um pet primeiro para registrar medicações."
      />
    );
  }

  // --- Medication list ---
  function renderMedicationItem({ item }: { item: MedicationRecordResponseDto }) {
    const active = isMedicationActive(item);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons color={active ? colors.primary : colors.muted} name="medical" size={20} />
          <Text style={styles.cardName}>{item.medication_name}</Text>
          <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusDone]}>
            <Text
              style={[styles.statusText, active ? styles.statusTextActive : styles.statusTextDone]}
            >
              {active ? 'Ativa' : 'Concluída'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.cardDetailRow}>
            <Ionicons color={colors.muted} name="flask-outline" size={16} />
            <Text style={styles.cardDetailText}>
              {item.dosage} — {item.frequency}
            </Text>
          </View>

          <View style={styles.cardDetailRow}>
            <Ionicons color={colors.muted} name="calendar-outline" size={16} />
            <Text style={styles.cardDetailText}>
              Início: {formatDateDisplay(item.start_date)}
              {item.end_date ? `  •  Fim: ${formatDateDisplay(item.end_date)}` : ''}
            </Text>
          </View>

          {item.notes ? (
            <View style={styles.cardDetailRow}>
              <Ionicons color={colors.muted} name="document-text-outline" size={16} />
              <Text style={styles.cardDetailText} numberOfLines={2}>
                {item.notes}
              </Text>
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
          <ErrorState message={error} onRetry={() => void loadMedications()} />
        </View>
      ) : medications.length === 0 ? (
        <View style={styles.centered}>
          <EmptyState
            icon="medical-outline"
            title="Nenhuma medicação registrada"
            description="Registre a primeira medicação do seu pet."
            actionLabel="Adicionar medicação"
            onActionPress={openModal}
          />
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id}
          renderItem={renderMedicationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadMedications('refresh')}
              tintColor={colors.primary}
            />
          }
        />
      )}

      {/* FAB */}
      {!isLoading && !error && medications.length > 0 ? (
        <FAB accessibilityLabel="Adicionar medicação" onPress={openModal} />
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
                <Text style={styles.modalTitle}>Nova medicação</Text>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Ionicons color={colors.muted} name="close" size={24} />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Medication name */}
                <View style={styles.field}>
                  <Text style={styles.label}>Nome do medicamento *</Text>
                  <TextInput
                    autoCapitalize="words"
                    onChangeText={(t) => {
                      setMedicationName(t);
                      if (formErrors.medicationName)
                        setFormErrors((e) => ({ ...e, medicationName: undefined }));
                    }}
                    placeholder="Ex: Prednisolona, Amoxicilina..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.medicationName ? styles.inputError : null]}
                    value={medicationName}
                  />
                  {formErrors.medicationName ? (
                    <Text style={styles.errorText}>{formErrors.medicationName}</Text>
                  ) : null}
                </View>

                {/* Dosage */}
                <View style={styles.field}>
                  <Text style={styles.label}>Dosagem *</Text>
                  <TextInput
                    onChangeText={(t) => {
                      setDosage(t);
                      if (formErrors.dosage) setFormErrors((e) => ({ ...e, dosage: undefined }));
                    }}
                    placeholder="Ex: 500mg, 5ml, 1 comprimido..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.dosage ? styles.inputError : null]}
                    value={dosage}
                  />
                  {formErrors.dosage ? (
                    <Text style={styles.errorText}>{formErrors.dosage}</Text>
                  ) : null}
                </View>

                {/* Frequency */}
                <View style={styles.field}>
                  <Text style={styles.label}>Frequência *</Text>
                  <TextInput
                    onChangeText={(t) => {
                      setFrequency(t);
                      if (formErrors.frequency)
                        setFormErrors((e) => ({ ...e, frequency: undefined }));
                    }}
                    placeholder="Ex: 2x ao dia, 1x por semana..."
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.frequency ? styles.inputError : null]}
                    value={frequency}
                  />
                  {formErrors.frequency ? (
                    <Text style={styles.errorText}>{formErrors.frequency}</Text>
                  ) : null}
                </View>

                {/* Start date */}
                <View style={styles.field}>
                  <Text style={styles.label}>Data de início *</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setStartDate(formatDateInput(t));
                      if (formErrors.startDate)
                        setFormErrors((e) => ({ ...e, startDate: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.startDate ? styles.inputError : null]}
                    value={startDate}
                  />
                  {formErrors.startDate ? (
                    <Text style={styles.errorText}>{formErrors.startDate}</Text>
                  ) : null}
                </View>

                {/* End date */}
                <View style={styles.field}>
                  <Text style={styles.label}>Data de fim</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={10}
                    onChangeText={(t) => {
                      setEndDate(formatDateInput(t));
                      if (formErrors.endDate) setFormErrors((e) => ({ ...e, endDate: undefined }));
                    }}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={colors.muted}
                    style={[styles.input, formErrors.endDate ? styles.inputError : null]}
                    value={endDate}
                  />
                  {formErrors.endDate ? (
                    <Text style={styles.errorText}>{formErrors.endDate}</Text>
                  ) : null}
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
                    <Text style={styles.submitButtonText}>Registrar medicação</Text>
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

  // List
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xl + 60,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardName: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    borderRadius: radii.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  statusActive: {
    backgroundColor: colors.successSoft,
  },
  statusDone: {
    backgroundColor: colors.primarySoft,
  },
  statusText: {
    ...typography.caption,
  },
  statusTextActive: {
    color: colors.success,
  },
  statusTextDone: {
    color: colors.muted,
  },
  cardDetails: {
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cardDetailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cardDetailText: {
    ...typography.bodySmall,
    color: colors.muted,
    flex: 1,
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
    maxHeight: '90%',
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
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
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
