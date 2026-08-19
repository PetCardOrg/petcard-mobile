import { Alert } from 'react-native';

import { confirmarAcaoEmRegistroDeVet, ehRegistroDeVeterinario } from '../vetRecordGuard';

const t = ((chave: string, params?: Record<string, string>) =>
  params ? `${chave}:${JSON.stringify(params)}` : chave) as never;

const doVet = {
  veterinario_id: 'vet-1',
  veterinario_crmv: 'CRMV-SP 12345',
  veterinarian_name: 'Dra. Camila',
};

describe('ehRegistroDeVeterinario', () => {
  it('só conta o veterinário do PetCard, não o nome digitado', () => {
    expect(ehRegistroDeVeterinario(doVet)).toBe(true);
    // Nome em texto livre pode ter sido o próprio tutor quem digitou.
    expect(ehRegistroDeVeterinario({ veterinarian_name: 'Dr. Paulo' })).toBe(false);
    expect(ehRegistroDeVeterinario({})).toBe(false);
  });
});

describe('confirmarAcaoEmRegistroDeVet', () => {
  const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

  beforeEach(() => {
    alerta.mockClear();
  });

  it('segue direto quando o registro é do próprio tutor', () => {
    const onConfirm = jest.fn();

    confirmarAcaoEmRegistroDeVet({
      registro: { veterinarian_name: 'Dr. Paulo' },
      nomeDoRegistro: 'V8',
      acao: 'editar',
      t,
      onConfirm,
    });

    // Confirmar duas vezes o que o tutor digitou seria só atrito.
    expect(alerta).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('avisa antes de editar registro de veterinário, com nome e CRMV', () => {
    const onConfirm = jest.fn();

    confirmarAcaoEmRegistroDeVet({
      registro: doVet,
      nomeDoRegistro: 'Antirrábica',
      acao: 'editar',
      t,
      onConfirm,
    });

    expect(onConfirm).not.toHaveBeenCalled();
    const [titulo, mensagem] = alerta.mock.calls[0];
    expect(titulo).toBe('healthRecords.vetRecord.editTitle');
    expect(mensagem).toContain('Dra. Camila (CRMV-SP 12345)');
    expect(mensagem).toContain('Antirrábica');
  });

  it('confirma a ação só quando o tutor escolhe continuar', () => {
    const onConfirm = jest.fn();

    confirmarAcaoEmRegistroDeVet({
      registro: doVet,
      nomeDoRegistro: 'Antirrábica',
      acao: 'apagar',
      t,
      onConfirm,
    });

    const botoes = alerta.mock.calls[0][2]!;
    expect(botoes[0].style).toBe('cancel');
    expect(botoes[1].style).toBe('destructive');

    botoes[1].onPress!();
    expect(onConfirm).toHaveBeenCalled();
  });

  it('usa rótulo genérico quando o registro não tem nome do profissional', () => {
    confirmarAcaoEmRegistroDeVet({
      registro: { veterinario_id: 'vet-1' },
      nomeDoRegistro: 'Drontal',
      acao: 'apagar',
      t,
      onConfirm: jest.fn(),
    });

    expect(alerta.mock.calls[0][1]).toContain('healthRecords.vetRecord.autorDesconhecido');
  });
});
