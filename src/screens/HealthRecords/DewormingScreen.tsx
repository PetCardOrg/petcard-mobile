import type { CreateDewormingRecordDto, DewormingRecordResponseDto } from '@petcardorg/shared';

import { dewormingService } from '../../services';
import { formatDateDisplay, parseDate } from '../../utils/dateUtils';
import { colors } from '../../utils/theme';
import {
  isoToDisplay,
  LinhaDeDetalhe,
  TelaDeRegistroDeSaude,
  type ConfigDaTelaDeSaude,
} from './TelaDeRegistroDeSaude';

// Fora do componente: a tela usa `carregar` como dependência do efeito de foco.
const config: ConfigDaTelaDeSaude<DewormingRecordResponseDto> = {
  escopo: 'vermifugos',
  prefixo: 'healthRecords.deworming',
  seletor: {
    subtitulo: 'healthRecords.petSelector.dewormingSubtitle',
    vazio: 'healthRecords.petSelector.dewormingEmpty',
  },
  iconeDoVazio: 'shield-outline',
  confirmarExclusao: 'healthRecords.deworming.deleteTitle',
  entidade: 'VERMIFUGO',
  campos: [
    {
      chave: 'productName',
      rotulo: 'healthRecords.deworming.nameLabel',
      placeholder: 'healthRecords.deworming.namePlaceholder',
      tipo: 'texto',
      autoCapitalize: 'words',
      obrigatorio: 'validation.productNameRequired',
    },
    {
      chave: 'appliedAt',
      rotulo: 'healthRecords.deworming.appliedAtLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
      obrigatorio: 'validation.appliedAtRequired',
    },
    {
      chave: 'nextDoseAt',
      rotulo: 'healthRecords.deworming.nextDoseLabel',
      placeholder: 'common.datePlaceholder',
      tipo: 'data',
    },
    {
      chave: 'veterinarianName',
      rotulo: 'healthRecords.deworming.vetLabel',
      placeholder: 'healthRecords.deworming.vetPlaceholder',
      tipo: 'texto',
      autoCapitalize: 'words',
    },
    {
      chave: 'notes',
      rotulo: 'healthRecords.deworming.notesLabel',
      placeholder: 'healthRecords.deworming.notesPlaceholder',
      tipo: 'notas',
    },
  ],
  nome: (item) => item.product_name,
  icone: () => ({ name: 'shield-checkmark', color: colors.success }),
  detalhes: (item, t) => (
    <>
      <LinhaDeDetalhe icone="calendar-outline">
        {t('healthRecords.deworming.appliedAt', { date: formatDateDisplay(item.applied_at) })}
      </LinhaDeDetalhe>

      {item.next_dose_at ? (
        <LinhaDeDetalhe icone="time-outline" cor={colors.warning}>
          {t('healthRecords.deworming.nextDose', { date: formatDateDisplay(item.next_dose_at) })}
        </LinhaDeDetalhe>
      ) : null}

      {item.veterinarian_name ? (
        <LinhaDeDetalhe icone="person-outline">{item.veterinarian_name}</LinhaDeDetalhe>
      ) : null}
    </>
  ),
  paraFormulario: (record) => ({
    productName: record.product_name,
    appliedAt: isoToDisplay(record.applied_at),
    nextDoseAt: record.next_dose_at ? isoToDisplay(record.next_dose_at) : '',
    veterinarianName: record.veterinarian_name ?? '',
    notes: record.notes ?? '',
  }),
  carregar: (petId) => dewormingService.getDewormingsByPet(petId),
  criar: (v, petId) => {
    const payload: CreateDewormingRecordDto = {
      pet_id: petId,
      product_name: v.productName.trim(),
      applied_at: parseDate(v.appliedAt)!,
    };

    const parsedNextDose = v.nextDoseAt.trim() ? parseDate(v.nextDoseAt) : undefined;
    if (parsedNextDose) payload.next_dose_at = parsedNextDose;
    if (v.veterinarianName.trim()) payload.veterinarian_name = v.veterinarianName.trim();
    if (v.notes.trim()) payload.notes = v.notes.trim();

    return dewormingService.createDeworming(payload);
  },
  atualizar: (id, v) =>
    dewormingService.updateDeworming(id, {
      product_name: v.productName.trim(),
      applied_at: parseDate(v.appliedAt)!,
      next_dose_at: v.nextDoseAt.trim() ? parseDate(v.nextDoseAt) : undefined,
      veterinarian_name: v.veterinarianName.trim() || undefined,
      notes: v.notes.trim() || undefined,
    }),
  apagar: (id) => dewormingService.deleteDeworming(id),
};

export function DewormingScreen() {
  return <TelaDeRegistroDeSaude config={config} />;
}
