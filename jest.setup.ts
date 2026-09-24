// O app carrega isto no boot (index.ts); os DTOs do @petcardorg/shared usam
// decorators de class-validator que dependem de Reflect.getMetadata.
import 'reflect-metadata';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from './src/i18n/locales/en-US/common.json';
import ptBR from './src/i18n/locales/pt-BR/common.json';
import { mockRotaDeTeste } from './src/test/mockRotaDeTeste';

// i18n determinístico (pt-BR) para as asserções por rótulo — espelha o setup
// do petcard-web. Inicializa o mesmo singleton do i18next que o app consome.
beforeAll(async () => {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: {
        'pt-BR': { translation: ptBR },
        'en-US': { translation: enUS },
      },
      lng: 'pt-BR',
      fallbackLng: 'pt-BR',
      interpolation: { escapeValue: false },
    });
  }
});

// SecureStore em memória: o AuthContext e o i18n do app persistem sessão/idioma
// por aqui. Cada teste começa com o store limpo.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    getItemAsync: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    setItemAsync: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
    __store: store,
  };
});

jest.mock('expo-localization', () => ({
  __esModule: true,
  getLocales: () => [{ languageTag: 'pt-BR', languageCode: 'pt' }],
}));

// Auth social do Google (mobile#54): sem credenciais nos testes, o hook devolve
// um request nulo e `promptAsync` no-op. Casos que exercitam o sucesso do
// fluxo sobrescrevem este mock.
jest.mock('expo-auth-session/providers/google', () => ({
  __esModule: true,
  useAuthRequest: () => [null, null, jest.fn()],
}));

jest.mock('expo-web-browser', () => ({
  __esModule: true,
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  __esModule: true,
  createURL: (path: string) => `petcard://${path}`,
  useURL: () => null,
  parse: (url: string) => ({ path: url, queryParams: {} }),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}));

// @expo/vector-icons carrega fontes de forma assíncrona (setState pós-render →
// warning de act). Stub simples por família mantém o render síncrono.
jest.mock('@expo/vector-icons', () => {
  // require dentro do factory: jest hoista jest.mock acima dos imports ESM.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const React = require('react');
  const { Text } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  const makeIcon = (family: string) => {
    const Icon = ({ name }: { name: string }) =>
      React.createElement(Text, null, `${family}:${name}`);
    Icon.displayName = family;
    return Icon;
  };
  return {
    __esModule: true,
    Ionicons: makeIcon('Ionicons'),
    MaterialCommunityIcons: makeIcon('MaterialCommunityIcons'),
    MaterialIcons: makeIcon('MaterialIcons'),
    FontAwesome: makeIcon('FontAwesome'),
    Feather: makeIcon('Feather'),
  };
});

// @react-navigation/native: hooks isolados dos containers nativos. Os testes
// que precisam asserir navegação sobrescrevem `useNavigation` via spy.
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  const { useEffect } = jest.requireActual('react') as typeof import('react');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
    // Executar o callback direto no corpo do render fazia tela que carrega
    // dados no foco entrar em laço: buscar → setState → renderizar → buscar.
    // Como efeito, roda quando o callback muda de identidade, igual ao hook
    // real, e telas com `useCallback` estável buscam uma vez só.
    useFocusEffect: (cb: () => void | (() => void)) => useEffect(cb, [cb]),
    useIsFocused: () => true,
    // Params vêm do `rotaDeTeste`, que o teste preenche antes de renderizar.
    useRoute: () => ({ key: 'test', name: 'test', params: mockRotaDeTeste.params }),
  };
});

afterEach(() => {
  jest.clearAllMocks();
  // Zera o SecureStore em memória (o Map vive no closure do mock, fora do
  // alcance de clearAllMocks) para isolar sessão/idioma entre testes.
  const secureStore = jest.requireMock('expo-secure-store') as {
    __store: Map<string, string>;
  };
  secureStore.__store.clear();
});

// Rota de teste não vaza de um caso para o outro.
afterEach(() => {
  delete mockRotaDeTeste.params;
});
