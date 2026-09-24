import { getRelativeDays } from '../relativeDate';

/** Constrói um ISO local (sem Z) para não embaralhar fuso no teste. */
function iso(y: number, m: number, d: number, h = 0, min = 0): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:00`;
}

describe('getRelativeDays', () => {
  const agora = new Date(2026, 7, 13, 20, 59); // 13/08/2026 20:59

  it('conta hoje como 0 mesmo faltando poucas horas', () => {
    // O bug: 2h de diferença arredondava para 1 e a tela escrevia "amanhã".
    expect(getRelativeDays(iso(2026, 8, 13, 23, 0), agora)).toBe(0);
  });

  it('conta hoje como 0 no início e no fim do dia', () => {
    expect(getRelativeDays(iso(2026, 8, 13, 0, 1), agora)).toBe(0);
    expect(getRelativeDays(iso(2026, 8, 13, 23, 59), agora)).toBe(0);
  });

  it('conta amanhã como 1, mesmo logo depois da meia-noite', () => {
    expect(getRelativeDays(iso(2026, 8, 14, 0, 5), agora)).toBe(1);
    expect(getRelativeDays(iso(2026, 8, 14, 22, 0), agora)).toBe(1);
  });

  it('conta os dias seguintes', () => {
    expect(getRelativeDays(iso(2026, 8, 15), agora)).toBe(2);
    expect(getRelativeDays(iso(2026, 8, 20), agora)).toBe(7);
  });

  it('atravessa a virada de mês', () => {
    expect(getRelativeDays(iso(2026, 9, 1), new Date(2026, 7, 31, 10))).toBe(1);
  });

  it('devolve negativo para datas passadas', () => {
    expect(getRelativeDays(iso(2026, 8, 12, 23, 0), agora)).toBe(-1);
  });
});
