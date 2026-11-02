import { StyleSheet, Text, View } from 'react-native';
import type { CreateMedicationRecordDto, MedicationRecordResponseDto } from '@petcardorg/shared';

import { medicationService } from '../../services';
import { formatDateDisplay, parseDate } from '../../utils/dateUtils';
import { colors, radii, spacing, typography } from '../../utils/theme';
import {
  isoToDisplay,
  LinhaDeDetalhe,
  TelaDeRegistroDeSaude,
  type ConfigDaTelaDeSaude,
} from './TelaDeRegistroDeSaude';

function isMedicationActive(item: MedicationRecordResponseDto): boolean {
  if (!item.end_date) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(`${item.end_date}T00:00:00`);
  return endDate >= today;
}

// Fora do componente: a tela usa `carregar` como dependência do efeito de foco.
const config: ConfigDaTelaDeSaude<MedicationRecordResponseDto> = {
  escopo: 'medicacoes',
  prefixo: 'healthRecords.medication',
  seletor: {
    subtitulo: 'healthRecords.petSelector.medicationSubtitle',
    vazio: 'healthRecords.petSelector.medicationEmpty',
  },
  iconeDoVazio: 'medical-outline',
  confirmarExclusao: 'healthRecords.medication.deleteTitle',
  entidade: 'MEDICACAO',
  alturaMaximaDoModal: '90%',
  campos: [
    {
      chave: 'medicationName',
      rotulo: 'healthRecords.medication.nameLabel',
      placeholder: 'healthRecords.medication.namePlaceholder',
      tipo: 'texto',
      autoCapitalize: 'words',
      obrigatorio: 'validation.medicationNameRequired',
    },
    {
      chave: 'dosage',
      rotulo: 'healthRecords.medication.dosageLabel',
      placeholder: 'healthRecords.medication.dosagePlaceholder',
      tipo: 'texto',
      obrigatorio: 'validation.dosageRequired',
    },
    {
      chave: 'frequency',
      rotulo: 'healthRecords.medication.frequencyLabel',
      placeholder: 'healthRecords.medication.frequencyPlaceholder',
      tipo: 'texto',
      obrigatorio: 'validation.frequencyRequired',
    },
    {
      chave: 'startDate',
      rotulo: 'healthRecords.medication.startDateLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
      obrigatorio: 'validation.startDateRequired',
    },
    {
      chave: 'endDate',
      rotulo: 'healthRecords.medication.endDateLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
    },
    {
      chave: 'notes',
      rotulo: 'healthRecords.medication.notesLabel',
      placeholder: 'healthRecords.medication.notesPlaceholder',
      tipo: 'notas',
    },
  ],
  nome: (item) => item.medication_name,
  icone: (item) => ({
    name: 'medical',
    color: isMedicationActive(item) ? colors.primary : colors.muted,
  }),
  selo: (item, t) => {
    const active = isMedicationActive(item);
    return (
      <View style={[styles.statusBadge, active ? styles.statusActive : styles.statusDone]}>
        <Text style={[styles.statusText, active ? styles.statusTextActive : styles.statusTextDone]}>
          {active ? t('healthRecords.medication.ongoing') : 'Concluída'}
        </Text>
      </View>
    );
  },
  detalhes: (item, t) => (
    <>
      <LinhaDeDetalhe icone="flask-outline" expandir>
        {item.dosage} — {item.frequency}
      </LinhaDeDetalhe>

      <LinhaDeDetalhe icone="calendar-outline" expandir>
        {t('healthRecords.medication.startDate', { date: formatDateDisplay(item.start_date) })}
        {item.end_date
          ? `  •  ${t('healthRecords.medication.endDate', { date: formatDateDisplay(item.end_date) })}`
          : ''}
      </LinhaDeDetalhe>

      {item.notes ? (
        <LinhaDeDetalhe icone="document-text-outline" numberOfLines={2} expandir>
          {item.notes}
        </LinhaDeDetalhe>
      ) : null}
    </>
  ),
  paraFormulario: (record) => ({
    medicationName: record.medication_name,
    dosage: record.dosage,
    frequency: record.frequency,
    startDate: isoToDisplay(record.start_date),
    endDate: record.end_date ? isoToDisplay(record.end_date) : '',
    notes: record.notes ?? '',
  }),
  carregar: (petId) => medicationService.getMedicationsByPet(petId),
  criar: (v, petId) => {
    const payload: CreateMedicationRecordDto = {
      pet_id: petId,
      medication_name: v.medicationName.trim(),
      dosage: v.dosage.trim(),
      frequency: v.frequency.trim(),
      start_date: parseDate(v.startDate)!,
    };

    const parsedEndDate = v.endDate.trim() ? parseDate(v.endDate) : undefined;
    if (parsedEndDate) payload.end_date = parsedEndDate;
    if (v.notes.trim()) payload.notes = v.notes.trim();

    return medicationService.createMedication(payload);
  },
  atualizar: (id, v) =>
    medicationService.updateMedication(id, {
      medication_name: v.medicationName.trim(),
      dosage: v.dosage.trim(),
      frequency: v.frequency.trim(),
      start_date: parseDate(v.startDate)!,
      end_date: v.endDate.trim() ? parseDate(v.endDate) : undefined,
      notes: v.notes.trim() || undefined,
    }),
  apagar: (id) => medicationService.deleteMedication(id),
};

export function MedicationScreen() {
  return <TelaDeRegistroDeSaude config={config} />;
}

const styles = StyleSheet.create({
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
});
