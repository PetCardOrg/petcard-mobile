import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppointmentResponseDto, PetResponseDto } from '@petcardorg/shared';
import { useTranslation } from 'react-i18next';

import { DurationOptions } from '../../components/ui/DurationOptions';
import { PlaceAutocompleteInput } from '../../components/ui/PlaceAutocompleteInput';
import { usePets } from '../../hooks/usePets';
import { appointmentService } from '../../services';
import { apiErrorMessage } from '../../utils/apiErrorMessage';
import { formatDateInput, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';
import { formatScheduledAt, formatTime, parseTime } from './horarioDoAgendamento';
import { horarioNoPassado } from './horarioNoPassado';

type FormErrors = {
  title?: string;
  scheduledDate?: string;
  scheduledTime?: string;
};

type Props = {
  visible: boolean;
  /** Agendamento em edição; `null` cria um novo. */
  record: AppointmentResponseDto | null;
  /** Local já preenchido ao criar (vindo da tela de clínicas). */
  initialLocation: string;
  /**
   * Muda a cada abertura: o formulário recomeça do zero (ou do registro) em
   * vez de mostrar o que ficou da vez anterior.
   */
  session: number;
  onClose: () => void;
  /** Chamado depois de salvar, com o modal já fechado. */
  onSaved: () => void;
};

export function AppointmentFormModal({
  visible,
  record,
  initialLocation,
  session,
  onClose,
  onSaved,
}: Props) {
  const { t } = useTranslation();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboard}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {record ? t('appointments.editTitle') : t('appointments.createTitle')}
              </Text>
              <Pressable onPress={onClose}>
                <Ionicons color={colors.muted} name="close" size={24} />
              </Pressable>
            </View>

            <AppointmentForm
              key={session}
              initialLocation={initialLocation}
              onClose={onClose}
              onSaved={onSaved}
              record={record}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type FormProps = Pick<Props, 'record' | 'initialLocation' | 'onClose' | 'onSaved'>;

function AppointmentForm({ record, initialLocation, onClose, onSaved }: FormProps) {
  const { t } = useTranslation();
  const { pets } = usePets();
  const inicial = record ? formatScheduledAt(record.scheduled_at) : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(record?.title ?? '');
  const [description, setDescription] = useState(record?.description ?? '');
  const [scheduledDate, setScheduledDate] = useState(inicial?.date ?? '');
  const [scheduledTime, setScheduledTime] = useState(inicial?.time ?? '');
  const [durationMinutes, setDurationMinutes] = useState(record?.duration_minutes ?? 60);
  const [location, setLocation] = useState(record ? (record.location ?? '') : initialLocation);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>(record?.pet_id);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  function validateForm(): boolean {
    const errors: FormErrors = {};
    if (!title.trim()) errors.title = t('appointments.validation.titleRequired');
    if (!scheduledDate.trim()) {
      errors.scheduledDate = t('appointments.validation.dateRequired');
    } else if (!parseDate(scheduledDate)) {
      errors.scheduledDate = t('validation.dateInvalid');
    }
    if (!scheduledTime.trim()) {
      errors.scheduledTime = t('appointments.validation.timeRequired');
    } else if (!parseTime(scheduledTime)) {
      errors.scheduledTime = t('appointments.validation.timeInvalid');
    }
    if (
      !errors.scheduledDate &&
      !errors.scheduledTime &&
      horarioNoPassado(montarScheduledAt(), new Date(), record?.scheduled_at)
    ) {
      errors.scheduledTime = t('appointments.validation.pastDateTime');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /** Data e hora do formulário, no fuso do aparelho. Só chamar com os dois campos válidos. */
  function montarScheduledAt(): Date {
    const dateStr = parseDate(scheduledDate)!;
    const time = parseTime(scheduledTime)!;
    return new Date(
      `${dateStr}T${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}:00`,
    );
  }

  async function handleSubmit() {
    if (!validateForm()) return;

    const scheduledAt = montarScheduledAt();

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: durationMinutes,
        location: location.trim() || undefined,
        pet_id: selectedPetId,
      };

      if (record) {
        await appointmentService.update(record.id, payload);
        onClose();
        Alert.alert(t('common.success'), t('appointments.successEdit'));
      } else {
        await appointmentService.create(payload);
        onClose();
        Alert.alert(t('common.success'), t('appointments.successCreate'));
      }
      onSaved();
    } catch (err) {
      const message = apiErrorMessage(
        err,
        record ? t('appointments.errorEdit') : t('appointments.errorCreate'),
        t,
      );
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Title */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('appointments.form.titleLabel')}</Text>
        <TextInput
          autoCapitalize="sentences"
          onChangeText={(text) => {
            setTitle(text);
            if (formErrors.title) setFormErrors((e) => ({ ...e, title: undefined }));
          }}
          placeholder={t('appointments.form.titlePlaceholder')}
          placeholderTextColor={colors.muted}
          style={[styles.input, formErrors.title ? styles.inputError : null]}
          value={title}
        />
        {formErrors.title ? <Text style={styles.errorText}>{formErrors.title}</Text> : null}
      </View>

      {/* Date & Time row */}
      <View style={styles.row}>
        <View style={[styles.field, styles.flex1]}>
          <Text style={styles.label}>{t('appointments.form.dateLabel')}</Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={10}
            onChangeText={(text) => {
              setScheduledDate(formatDateInput(text));
              if (formErrors.scheduledDate)
                setFormErrors((e) => ({ ...e, scheduledDate: undefined }));
            }}
            placeholder={t('common.datePlaceholder')}
            placeholderTextColor={colors.muted}
            style={[styles.input, formErrors.scheduledDate ? styles.inputError : null]}
            value={scheduledDate}
          />
          {formErrors.scheduledDate ? (
            <Text style={styles.errorText}>{formErrors.scheduledDate}</Text>
          ) : null}
        </View>

        <View style={[styles.field, { flex: 0.6 }]}>
          <Text style={styles.label}>{t('appointments.form.timeLabel')}</Text>
          <TextInput
            keyboardType="number-pad"
            maxLength={5}
            onChangeText={(text) => {
              setScheduledTime(formatTime(text));
              if (formErrors.scheduledTime)
                setFormErrors((e) => ({ ...e, scheduledTime: undefined }));
            }}
            placeholder="HH:MM"
            placeholderTextColor={colors.muted}
            style={[styles.input, formErrors.scheduledTime ? styles.inputError : null]}
            value={scheduledTime}
          />
          {formErrors.scheduledTime ? (
            <Text style={styles.errorText}>{formErrors.scheduledTime}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('appointments.form.durationLabel')}</Text>
        <DurationOptions
          accessibilityLabel={t('appointments.form.durationLabel')}
          onChange={setDurationMinutes}
          value={durationMinutes}
        />
      </View>

      {/* Location */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('appointments.form.locationLabel')}</Text>
        <PlaceAutocompleteInput
          onChangeText={setLocation}
          placeholder={t('appointments.form.locationPlaceholder')}
          value={location}
        />
      </View>

      {/* Pet selector */}
      {pets.length > 0 ? (
        <View style={styles.field}>
          <Text style={styles.label}>{t('appointments.form.petLabel')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.petChipRow}>
              <Pressable
                onPress={() => setSelectedPetId(undefined)}
                style={[styles.petChip, !selectedPetId && styles.petChipActive]}
              >
                <Text style={[styles.petChipText, !selectedPetId && styles.petChipTextActive]}>
                  {t('appointments.form.noPet')}
                </Text>
              </Pressable>
              {pets.map((pet: PetResponseDto) => (
                <Pressable
                  key={pet.id}
                  onPress={() => setSelectedPetId(pet.id)}
                  style={[styles.petChip, selectedPetId === pet.id && styles.petChipActive]}
                >
                  <Ionicons
                    name="paw"
                    size={14}
                    color={selectedPetId === pet.id ? colors.white : colors.primaryDark}
                  />
                  <Text
                    style={[
                      styles.petChipText,
                      selectedPetId === pet.id && styles.petChipTextActive,
                    ]}
                  >
                    {pet.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>{t('appointments.form.descriptionLabel')}</Text>
        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setDescription}
          placeholder={t('appointments.form.descriptionPlaceholder')}
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.textArea]}
          textAlignVertical="top"
          value={description}
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
          <Text style={styles.submitButtonText}>
            {record ? t('appointments.submitEdit') : t('appointments.submitCreate')}
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  petChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  petChip: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  petChipActive: {
    backgroundColor: colors.primaryDark,
    borderColor: colors.primaryDark,
  },
  petChipText: {
    ...typography.caption,
    color: colors.primaryDark,
  },
  petChipTextActive: {
    color: colors.white,
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
