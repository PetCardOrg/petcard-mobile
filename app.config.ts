import { ExpoConfig, ConfigContext } from 'expo/config';

// Esquema de URL do iOS que o Google exige para o retorno do OAuth: é o client
// ID do iOS "ao contrário". Derivado do .env para não repetir o valor.
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const iosGoogleUrlScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace('.apps.googleusercontent.com', '')}`
  : undefined;

const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!googleMapsApiKey) {
  console.warn(
    '[app.config] EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ausente: o mapa vai abrir em branco. ' +
      'Defina no .env (local) ou no ambiente do EAS (build).',
  );
}

/** Perfis do `eas.json` que geram app para outras pessoas instalarem. */
const PERFIS_DE_DISTRIBUICAO = ['preview', 'production'];

/**
 * Client ID do Google que o login usa em cada plataforma (`useGoogleAuth`). No
 * Android o login é nativo e pede o client **Web** (o client Android é achado
 * pelo pacote + SHA-1, não pelo ID).
 */
const CLIENT_ID_GOOGLE_POR_PLATAFORMA: Record<string, string> = {
  android: 'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID',
  ios: 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
};

/**
 * Num build de distribuição, variável faltando não pode virar app "verde" que
 * não funciona:
 * - sem a URL, o app cai no fallback `http://localhost:3000` do `api.ts`, que
 *   no celular é o próprio aparelho (AUD MOB-03);
 * - sem a chave do Maps, o mapa abre em branco;
 * - sem o client ID do Google da plataforma, o botão do Google some sem aviso
 *   (`isGoogleAuthConfigured`) (AUD MOB-15).
 * O client ID só é cobrado quando a plataforma do build é conhecida: o builder
 * do EAS define `EAS_BUILD_PLATFORM` e avalia este arquivo de novo.
 */
function exigirVariaveisEmDistribuicao() {
  const perfil = process.env.EAS_BUILD_PROFILE;
  if (!perfil || !PERFIS_DE_DISTRIBUICAO.includes(perfil)) return;

  const exigidas = ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY'];
  const clientIdDaPlataforma =
    CLIENT_ID_GOOGLE_POR_PLATAFORMA[process.env.EAS_BUILD_PLATFORM ?? ''];
  if (clientIdDaPlataforma) exigidas.push(clientIdDaPlataforma);

  const ausentes = exigidas.filter((nome) => !process.env[nome]);
  if (ausentes.length > 0) {
    throw new Error(
      `[app.config] ${ausentes.join(', ')} ausente(s) no build "${perfil}". ` +
        `Defina no ambiente "${perfil}" do EAS.`,
    );
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  exigirVariaveisEmDistribuicao();
  return configDoApp(config);
};

const configDoApp = (config: ConfigContext['config']): ExpoConfig => ({
  ...config,
  name: 'petcard-mobile',
  slug: 'petcard-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  // newArchEnabled removido do config: SDK 57 só roda com a New Architecture,
  // não é mais opcional.
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.petcardorg.mobile',
    ...(iosGoogleUrlScheme
      ? {
          infoPlist: {
            CFBundleURLTypes: [{ CFBundleURLSchemes: [iosGoogleUrlScheme] }],
          },
        }
      : {}),
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#27A9D8',
    },
    // edgeToEdgeEnabled foi removido do config: SDK 57 exige edge-to-edge
    // sempre ativo no Android (não é mais opcional).
    package: 'com.petcardorg.mobile',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
  },
  // App só de celular — sem `web` (react-native-web nunca foi dependência).
  // Sem isto o `expo start` tenta empacotar para web e falha ao resolver
  // react-native-web.
  platforms: ['ios', 'android'],
  // Scheme do app. Serve ao retorno do OAuth do Google e ao `Linking.createURL`
  // do Expo — NÃO aos e-mails de auth: scheme customizado não tem dono, e no
  // Android outro app que registre `petcard` pode ser escolhido para abrir o
  // link, levando junto o token de redefinição. Esses e-mails apontam para as
  // páginas em https que a própria API serve.
  scheme: 'petcard',
  plugins: [
    'expo-localization',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#27A9D8',
      },
    ],
    'expo-web-browser',
    'expo-font',
    'expo-secure-store',
    'expo-sharing',
    'expo-status-bar',
    // Substitui a chave `splash` legada, removida do ExpoConfig na SDK 57.
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
    // O build de distribuição passa pelo R8, que renomeia/remove a classe
    // `WorkDatabase_Impl` que o Room procura por reflexão. O WorkManager (trazido
    // pelo push) sobe na abertura do app e, sem a classe, o app fecha antes de
    // abrir ("Failed to create an instance of class
    // androidx.work.impl.WorkDatabase").
    [
      'expo-build-properties',
      {
        android: {
          extraProguardRules: [
            '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
            '-keep class androidx.work.impl.WorkDatabase_Impl { *; }',
          ].join('\n'),
        },
      },
    ],
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: googleMapsApiKey,
        iosGoogleMapsApiKey: googleMapsApiKey,
      },
    ],
  ],
  extra: {
    // Id do projeto no EAS. Escrito à mão porque o `eas` não consegue editar
    // config dinâmica (app.config.ts) — ele só avisa e pede que se coloque
    // aqui. Não é segredo: identifica o projeto, não autentica ninguém.
    eas: {
      projectId: 'e007adf6-fa3f-4315-a6ac-9864e0d1a181',
    },
    // Client IDs do Google para o login social (mobile#54), lidos pelo
    // useGoogleAuth via process.env.EXPO_PUBLIC_*.
    googleAuth: {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    },
  },
});
