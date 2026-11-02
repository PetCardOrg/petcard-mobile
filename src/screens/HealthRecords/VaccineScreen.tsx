import type { CreateVaccineRecordDto, VaccineRecordResponseDto } from '@petcardorg/shared';

import { vaccineService } from '../../services';
import { formatDateDisplay, parseDate } from '../../utils/dateUtils';
import { colors } from '../../utils/theme';
import {
  isoToDisplay,
  LinhaDeDetalhe,
  TelaDeRegistroDeSaude,
  type ConfigDaTelaDeSaude,
} from './TelaDeRegistroDeSaude';

// Fora do componente: a tela usa `carregar` como dependência do efeito de foco.
const config: ConfigDaTelaDeSaude<VaccineRecordResponseDto> = {
  escopo: 'vacinas',
  prefixo: 'healthRecords.vaccine',
  seletor: {
    subtitulo: 'healthRecords.petSelector.vaccineSubtitle',
    vazio: 'healthRecords.petSelector.vaccineEmpty',
  },
  iconeDoVazio: 'medkit-outline',
  confirmarExclusao: 'petDetails.deleteDialog.confirm',
  entidade: 'VACINA',
  campos: [
    {
      chave: 'vaccineName',
      rotulo: 'healthRecords.vaccine.nameLabel',
      placeholder: 'healthRecords.vaccine.namePlaceholder',
      tipo: 'texto',
      autoCapitalize: 'words',
      obrigatorio: 'validation.vaccineNameRequired',
    },
    {
      chave: 'appliedAt',
      rotulo: 'healthRecords.vaccine.appliedAtLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
      obrigatorio: 'validation.appliedAtRequired',
    },
    {
      chave: 'nextDoseAt',
      rotulo: 'healthRecords.vaccine.nextDoseLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
    },
    {
      chave: 'veterinarianName',
      rotulo: 'healthRecords.vaccine.vetLabel',
      placeholder: 'healthRecords.vaccine.vetPlaceholder',
      tipo: 'texto',
      autoCapitalize: 'words',
    },
    {
      chave: 'notes',
      rotulo: 'healthRecords.vaccine.notesLabel',
      placeholder: 'healthRecords.vaccine.notesPlaceholder',
      tipo: 'notas',
    },
  ],
  nome: (item) => item.vaccine_name,
  icone: () => ({ name: 'medkit', color: colors.primary }),
  detalhes: (item, t) => (
    <>
      <LinhaDeDetalhe icone="calendar-outline">
        {t('healthRecords.vaccine.appliedAt', { date: formatDateDisplay(item.applied_at) })}
      </LinhaDeDetalhe>

      {item.next_dose_at ? (
        <LinhaDeDetalhe icone="time-outline" cor={colors.warning}>
          {t('healthRecords.vaccine.nextDose', { date: formatDateDisplay(item.next_dose_at) })}
        </LinhaDeDetalhe>
      ) : null}

      {item.veterinarian_name ? (
        <LinhaDeDetalhe icone="person-outline">{item.veterinarian_name}</LinhaDeDetalhe>
      ) : null}
    </>
  ),
  paraFormulario: (record) => ({
    vaccineName: record.vaccine_name,
    appliedAt: isoToDisplay(record.applied_at),
    nextDoseAt: record.next_dose_at ? isoToDisplay(record.next_dose_at) : '',
    veterinarianName: record.veterinarian_name ?? '',
    notes: record.notes ?? '',
  }),
  carregar: (petId) => vaccineService.getVaccinesByPet(petId),
  criar: (v, petId) => {
    const payload: CreateVaccineRecordDto = {
      pet_id: petId,
      vaccine_name: v.vaccineName.trim(),
      applied_at: parseDate(v.appliedAt)!,
    };

    const parsedNextDose = v.nextDoseAt.trim() ? parseDate(v.nextDoseAt) : undefined;
    if (parsedNextDose) payload.next_dose_at = parsedNextDose;
    if (v.veterinarianName.trim()) payload.veterinarian_name = v.veterinarianName.trim();
    if (v.notes.trim()) payload.notes = v.notes.trim();

    return vaccineService.createVaccine(payload);
  },
  atualizar: (id, v) =>
    vaccineService.updateVaccine(id, {
      vaccine_name: v.vaccineName.trim(),
      applied_at: parseDate(v.appliedAt)!,
      next_dose_at: v.nextDoseAt.trim() ? parseDate(v.nextDoseAt) : undefined,
      veterinarian_name: v.veterinarianName.trim() || undefined,
      notes: v.notes.trim() || undefined,
    }),
  apagar: (id) => vaccineService.deleteVaccine(id),
};

export function VaccineScreen() {
  return <TelaDeRegistroDeSaude config={config} />;
}
