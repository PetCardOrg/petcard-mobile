import { formatPhoneBR, unformatPhone } from '../phoneMask';

describe('formatPhoneBR', () => {
  it('retorna string vazia quando não há dígito nenhum', () => {
    expect(formatPhoneBR('')).toBe('');
  });

  it('formata progressivamente enquanto o usuário digita', () => {
    expect(formatPhoneBR('1')).toBe('(1');
    expect(formatPhoneBR('11')).toBe('(11');
    expect(formatPhoneBR('119')).toBe('(11) 9');
    expect(formatPhoneBR('11999998888')).toBe('(11) 99999-8888');
  });

  it('ignora caracteres não numéricos e limita a 11 dígitos', () => {
    expect(formatPhoneBR('(11) 99999-8888extra')).toBe('(11) 99999-8888');
  });
});

describe('unformatPhone', () => {
  it('retorna só os dígitos, o formato enviado à api', () => {
    expect(unformatPhone('(11) 99999-8888')).toBe('11999998888');
  });

  it('retorna string vazia quando não há dígitos', () => {
    expect(unformatPhone('')).toBe('');
  });
});
