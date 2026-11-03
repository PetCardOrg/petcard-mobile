import { horarioNoPassado } from '../horarioNoPassado';

describe('horarioNoPassado (AUD MOB-13)', () => {
  const agora = new Date(2026, 10, 2, 10, 30, 45); // 02/11/2026 10:30:45

  it('recusa agendamento novo em dia ou hora que já passou', () => {
    expect(horarioNoPassado(new Date(2026, 10, 1, 15, 0), agora)).toBe(true);
    expect(horarioNoPassado(new Date(2026, 10, 2, 10, 29), agora)).toBe(true);
  });

  it('aceita o minuto atual e qualquer horário futuro', () => {
    expect(horarioNoPassado(new Date(2026, 10, 2, 10, 30), agora)).toBe(false);
    expect(horarioNoPassado(new Date(2026, 10, 3, 8, 0), agora)).toBe(false);
  });

  it('na edição, deixa salvar um compromisso passado sem mudar data e hora', () => {
    // O ISO salvo pode ter segundos; o formulário só mostra HH:MM.
    const original = new Date(2026, 9, 20, 14, 0, 30).toISOString();
    expect(horarioNoPassado(new Date(2026, 9, 20, 14, 0), agora, original)).toBe(false);
  });

  it('na edição, recusa remarcar para o passado', () => {
    const original = new Date(2026, 9, 20, 14, 0).toISOString();
    expect(horarioNoPassado(new Date(2026, 9, 21, 14, 0), agora, original)).toBe(true);
  });
});
