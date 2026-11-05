import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

import type { AppointmentSyncStatus } from '../../services/appointment.service';

export type EstadoDeSincronizacao = {
  /** Sufixo da chave de texto `appointments.sync.<chave>`. */
  chave: 'synced' | 'pending' | 'needsConnection' | 'failed';
  icone: ComponentProps<typeof Ionicons>['name'];
  tom: 'ok' | 'neutro' | 'falha';
};

/**
 * O que o tutor precisa saber sobre um agendamento e o Google Agenda.
 *
 * Sem isto o cartão não dizia nada: um agendamento que ficou pendente (token
 * do Google morto, fila fora) parecia igual a um sincronizado, e o tutor só
 * descobria olhando a própria agenda. Pendente sem conexão pede para conectar;
 * pendente com conexão só espera. Um valor que o app não conhece não diz nada,
 * em vez de afirmar algo errado.
 */
export function estadoDeSincronizacao(
  status: AppointmentSyncStatus,
  conectado: boolean,
): EstadoDeSincronizacao | null {
  switch (status) {
    case 'SYNCED':
      return { chave: 'synced', icone: 'checkmark-circle', tom: 'ok' };
    case 'FAILED':
      return { chave: 'failed', icone: 'alert-circle', tom: 'falha' };
    case 'PENDING_CREATE':
    case 'PENDING_UPDATE':
    case 'PENDING_DELETE':
      return conectado
        ? { chave: 'pending', icone: 'time-outline', tom: 'neutro' }
        : { chave: 'needsConnection', icone: 'link-outline', tom: 'neutro' };
    default:
      return null;
  }
}
