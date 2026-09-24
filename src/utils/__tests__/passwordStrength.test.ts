import { checkPasswordRules, validatePasswordStrength } from '../passwordStrength';

describe('validatePasswordStrength', () => {
  it('aceita uma senha com maiúscula, número e caractere especial', () => {
    expect(validatePasswordStrength('Senha123!')).toBeNull();
  });

  it.each([
    ['curta', 'Ab1!', 'tooShort'],
    ['muito longa', `A1!${'a'.repeat(80)}`, 'tooLong'],
    ['sem maiúscula', 'senha123!', 'noUppercase'],
    ['sem número', 'SenhaForte!', 'noNumber'],
    ['sem caractere especial', 'Senha12345', 'noSpecial'],
  ])('rejeita senha %s', (_caso, senha, regra) => {
    expect(validatePasswordStrength(senha)).toBe(regra);
  });

  it('reporta a primeira regra violada (comprimento antes de composição)', () => {
    expect(validatePasswordStrength('ab')).toBe('tooShort');
  });
});

describe('checkPasswordRules', () => {
  it('marca cada regra de forma independente conforme a senha digitada', () => {
    expect(checkPasswordRules('')).toEqual({
      minLength: false,
      uppercase: false,
      number: false,
      special: false,
    });

    // 6 caracteres, com maiúscula e número, sem especial
    expect(checkPasswordRules('Senha1')).toEqual({
      minLength: false,
      uppercase: true,
      number: true,
      special: false,
    });

    expect(checkPasswordRules('Senha123!')).toEqual({
      minLength: true,
      uppercase: true,
      number: true,
      special: true,
    });
  });
});
