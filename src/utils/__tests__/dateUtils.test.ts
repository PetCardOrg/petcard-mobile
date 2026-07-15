import { formatDateDisplay, formatDateInput, parseDate } from '../dateUtils';

describe('formatDateDisplay', () => {
  it('converte ISO (YYYY-MM-DD) para DD/MM/YYYY', () => {
    expect(formatDateDisplay('2026-07-15')).toBe('15/07/2026');
  });

  it('aceita ISO com hora, usando só a data', () => {
    expect(formatDateDisplay('2026-07-15T10:30:00')).toBe('15/07/2026');
  });

  it('devolve a string original quando não casa o padrão', () => {
    expect(formatDateDisplay('15/07/2026')).toBe('15/07/2026');
  });
});

describe('formatDateInput', () => {
  it('mantém até 2 dígitos sem separador', () => {
    expect(formatDateInput('15')).toBe('15');
  });

  it('insere a primeira barra após o dia', () => {
    expect(formatDateInput('1507')).toBe('15/07');
  });

  it('formata dia/mês/ano completo', () => {
    expect(formatDateInput('15072026')).toBe('15/07/2026');
  });

  it('descarta caracteres não numéricos e trunca em 8 dígitos', () => {
    expect(formatDateInput('15/07/2026999')).toBe('15/07/2026');
  });
});

describe('parseDate', () => {
  it('converte DD/MM/AAAA válido para ISO', () => {
    expect(parseDate('15/07/2026')).toBe('2026-07-15');
  });

  it('rejeita formato incompleto', () => {
    expect(parseDate('15/07/26')).toBeUndefined();
  });

  it('rejeita dia inexistente (31/02)', () => {
    expect(parseDate('31/02/2026')).toBeUndefined();
  });

  it('rejeita mês inválido (13)', () => {
    expect(parseDate('10/13/2026')).toBeUndefined();
  });
});
