import type { HistoricoClinicoResponseDto } from '@petcardorg/shared';

import { api } from './api';
import { ensureList } from './ensureList';

const getHistoricoEndpoint = (petId: string) => `/pets/${petId}/historico-clinico`;

/**
 * Linha do tempo clínica do pet (api#117).
 *
 * Traz também o que foi excluído, marcado por `excluido`, e a trilha de quem
 * fez cada ação. O tutor vê o mesmo que o veterinário: o que foi orientado
 * continua visível mesmo depois de ele apagar da própria lista.
 */
export async function getHistoricoClinico(petId: string): Promise<HistoricoClinicoResponseDto> {
  const { data } = await api.get<HistoricoClinicoResponseDto>(getHistoricoEndpoint(petId));
  // A tela lê `itens.length`: sem a lista, a falha tem de nascer aqui e cair no
  // estado de erro, e não no render.
  return {
    ...data,
    itens: ensureList<HistoricoClinicoResponseDto['itens'][number]>(
      data?.itens,
      'histórico clínico',
    ),
  };
}
