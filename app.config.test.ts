import type { ConfigContext } from 'expo/config';

/**
 * Num build de distribuição, variável faltando tem que parar o build: sem
 * `EXPO_PUBLIC_API_URL` o app chama `localhost` (o próprio celular), sem a
 * chave do Maps o mapa abre em branco e sem o client ID do Google o botão de
 * login some sem aviso.
 */
describe('app.config — variáveis de distribuição', () => {
  const envOriginal = { ...process.env };

  const VARIAVEIS_COMPLETAS = {
    EXPO_PUBLIC_API_URL: 'https://api.petcard.example',
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: 'maps-key',
    EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: 'android.apps.googleusercontent.com',
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: 'ios.apps.googleusercontent.com',
  };

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.EAS_BUILD_PLATFORM;
    Object.assign(process.env, VARIAVEIS_COMPLETAS);
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
    process.env.EXPO_PUBLIC_API_URL = '';

    expect(montarConfig).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it('falha o build de distribuição sem a chave do Maps', () => {
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY = '';

    expect(montarConfig).toThrow(/EXPO_PUBLIC_GOOGLE_MAPS_API_KEY/);
  });

  it.each([
    ['android', 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'],
    ['ios', 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'],
  ])('falha o build %s sem o client ID do Google da plataforma', (plataforma, variavel) => {
    process.env.EAS_BUILD_PROFILE = 'preview';
    process.env.EAS_BUILD_PLATFORM = plataforma;
    process.env[variavel] = '';

    expect(montarConfig).toThrow(new RegExp(variavel));
  });

  it('não cobra o client ID de outra plataforma', () => {
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EAS_BUILD_PLATFORM = 'android';
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID = '';

    expect(montarConfig).not.toThrow();
  });

  it('aceita o build de distribuição com as variáveis definidas', () => {
    process.env.EAS_BUILD_PROFILE = 'production';
    process.env.EAS_BUILD_PLATFORM = 'android';

    expect(montarConfig).not.toThrow();
  });

  it('não exige nada no desenvolvimento local', () => {
    for (const nome of Object.keys(VARIAVEIS_COMPLETAS)) process.env[nome] = '';

    expect(montarConfig).not.toThrow();
  });
});
