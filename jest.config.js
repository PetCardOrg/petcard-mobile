/**
 * Configuração de teste do app mobile (PC-090).
 * Usa o preset `jest-expo`, que já configura o transform de RN/Expo, o
 * ambiente e os mocks nativos básicos. `transformIgnorePatterns` é
 * estendido para transpilar os pacotes ESM de RN/Expo e o `@petcardorg/shared`.
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|' +
      '@expo-google-fonts/.*|react-navigation|@react-navigation/.*|' +
      '@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|' +
      '@petcardorg/shared' +
      ')',
  ],
  // Cobertura coletada sobre todo o src (não maquiar o número escondendo as
  // telas ainda sem teste). O threshold abaixo é o PISO INICIAL desta milestone
  // — a camada de teste do mobile nasce aqui (PC-090). A fundação (services,
  // utils, contexts, componentes reutilizáveis) está bem coberta; as 12 telas
  // (mapas, image-picker, notificações) são a PRÓXIMA catraca a subir.
  // Regra do projeto: subir o piso, nunca abaixar.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/i18n/**',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      statements: 14,
      branches: 7,
      functions: 17,
      lines: 14,
    },
  },
};
