import i18n from '../../i18n';
import { apiErrorMessage } from '../apiErrorMessage';

const t = i18n.getFixedT('pt-BR');
const tEn = i18n.getFixedT('en-US');

function erroDaApi(status: number, message: unknown = 'Email already registered') {
  return Object.assign(new Error(String(status)), {
    isAxiosError: true,
    response: { status, data: { message } },
  });
}

describe('apiErrorMessage', () => {
  it('nunca devolve o texto cru da api, que vem em inglês', () => {
    const texto = apiErrorMessage(erroDaApi(409, 'Email already registered'), 'falhou', t);

    expect(texto).not.toContain('Email already registered');
    expect(texto).toBe('Já existe um registro com esses dados.');
  });

  it('não mostra as mensagens de validação dos DTOs (lista em inglês)', () => {
    const texto = apiErrorMessage(
      erroDaApi(400, ['name should not be empty', 'email must be an email']),
      'falhou',
      t,
    );

    expect(texto).toBe('Confira os dados informados e tente novamente.');
  });

  it.each([
    [400, 'Confira os dados informados e tente novamente.'],
    [403, 'Você não tem permissão para fazer isso.'],
    [404, 'Não encontramos o que você procura. Atualize a tela e tente de novo.'],
    [413, 'O arquivo é grande demais.'],
    [415, 'Esse formato de arquivo não é aceito.'],
    [429, 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.'],
  ])('traduz o status %i', (status, esperado) => {
    expect(apiErrorMessage(erroDaApi(status), 'falhou', t)).toBe(esperado);
  });

  it('segue o idioma do app', () => {
    expect(apiErrorMessage(erroDaApi(403), 'failed', tEn)).toBe(
      "You don't have permission to do that.",
    );
  });

  it('usa a mensagem da tela para o que não tem texto próprio (5xx e 401)', () => {
    expect(apiErrorMessage(erroDaApi(500), 'Erro ao salvar o pet.', t)).toBe(
      'Erro ao salvar o pet.',
    );
    expect(apiErrorMessage(erroDaApi(401), 'Erro ao salvar o pet.', t)).toBe(
      'Erro ao salvar o pet.',
    );
  });

  it('usa a mensagem da tela quando não há resposta (sem rede) ou o erro não é do axios', () => {
    const semRede = Object.assign(new Error('Network Error'), { isAxiosError: true });

    expect(apiErrorMessage(semRede, 'Erro ao salvar o pet.', t)).toBe('Erro ao salvar o pet.');
    expect(apiErrorMessage(new Error('boom'), 'Erro ao salvar o pet.', t)).toBe(
      'Erro ao salvar o pet.',
    );
  });

  it('deixa a tela trocar o texto de um status específico', () => {
    const texto = apiErrorMessage(erroDaApi(409), 'falhou', t, { 409: 'E-mail já cadastrado.' });

    expect(texto).toBe('E-mail já cadastrado.');
  });
});
