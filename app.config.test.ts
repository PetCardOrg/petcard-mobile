import type { ConfigContext } from 'expo/config';

/**
 * Sem `EXPO_PUBLIC_API_URL`, o app cai no fallback `http://localhost:3000`:
 * num aparelho de verdade isso é o próprio celular, e toda chamada falha sem
 * dizer por quê. Em build de distribuição isso tem que parar o build.
 */
describe('app.config — URL da API', () => {
  const envOriginal = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...envOriginal };
    jest.restoreAllMocks();
  });

  function montarConfig() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: appConfig } = require('./app.config');
    return appConfig({ config: {} } as ConfigContext);
  }

  it.each(['preview', 'production'])('falha o build "%s" sem a URL da API', (perfil) => {
    process.env.EAS_BUILD_PROFILE = perfil;
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(montarConfig).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('aceita o build de distribuição com a URL definida', () => {
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EXPO_PUBLIC_API_URL = 'https://api.petcard.example';

    expect(montarConfig).not.toThrow();
  });

  it('não exige a URL no desenvolvimento local', () => {
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.EXPO_PUBLIC_API_URL;

    expect(montarConfig).not.toThrow();
  });
});
