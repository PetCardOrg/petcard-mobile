import { calculateAge } from '../calculateAge';

describe('calculateAge', () => {
  // Fixa "hoje" em 2026-07-15 para tornar as faixas de idade determinísticas.
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-15T12:00:00'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('retorna aviso quando a data é ausente', () => {
    expect(calculateAge(null)).toBe('Idade não informada');
    expect(calculateAge(undefined)).toBe('Idade não informada');
    expect(calculateAge('')).toBe('Idade não informada');
  });

  it('retorna aviso para data inválida', () => {
    expect(calculateAge('não-é-data')).toBe('Idade não informada');
  });

  it('detecta data futura', () => {
    expect(calculateAge('2030-01-01')).toBe('Data futura');
  });

  it('formata anos e meses (plural)', () => {
    expect(calculateAge('2023-05-15')).toBe('3 anos e 2 meses');
  });

  it('formata exatamente 1 ano (singular, sem meses)', () => {
    expect(calculateAge('2025-07-15')).toBe('1 ano');
  });

  it('formata só meses quando abaixo de 1 ano', () => {
    expect(calculateAge('2025-11-15')).toBe('8 meses');
  });

  it('formata 1 mês no singular', () => {
    expect(calculateAge('2026-06-15')).toBe('1 mês');
  });

  it('retorna "Menos de 1 mês" para recém-nascido', () => {
    expect(calculateAge('2026-07-10')).toBe('Menos de 1 mês');
  });
});
