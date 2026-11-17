import type { AppointmentSyncStatus } from '@petcardorg/shared';
import { estadoDeSincronizacao } from '../estadoDeSincronizacao';

// É o que o tutor lê para saber se o agendamento chegou à agenda dele: errar
// aqui é dizer "sincronizado" para o que não foi, ou o contrário.
describe('estadoDeSincronizacao', () => {
  it('SYNCED é confirmação, com ou sem conexão', () => {
    expect(estadoDeSincronizacao('SYNCED', true)?.chave).toBe('synced');
    expect(estadoDeSincronizacao('SYNCED', false)?.chave).toBe('synced');
  });

  it('FAILED é falha, e o tom é de alerta', () => {
    expect(estadoDeSincronizacao('FAILED', true)).toMatchObject({ chave: 'failed', tom: 'falha' });
  });

  it.each(['PENDING_CREATE', 'PENDING_UPDATE', 'PENDING_DELETE'] as const)(
    '%s com o Google Agenda conectado só espera',
    (status) => {
      expect(estadoDeSincronizacao(status, true)?.chave).toBe('pending');
    },
  );

  it.each(['PENDING_CREATE', 'PENDING_UPDATE', 'PENDING_DELETE'] as const)(
    '%s sem conexão pede para conectar',
    (status) => {
      expect(estadoDeSincronizacao(status, false)?.chave).toBe('needsConnection');
    },
  );

  it('um valor que o app não conhece não afirma nada', () => {
    expect(estadoDeSincronizacao('ALGO_NOVO' as AppointmentSyncStatus, true)).toBeNull();
  });
});
