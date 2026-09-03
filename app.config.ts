import { ExpoConfig, ConfigContext } from 'expo/config';

// Esquema de URL do iOS que o Google exige para o retorno do OAuth: é o client
// ID do iOS "ao contrário". Derivado do .env para não repetir o valor.
const iosGoogleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const iosGoogleUrlScheme = iosGoogleClientId
  ? `com.googleusercontent.apps.${iosGoogleClientId.replace('.apps.googleusercontent.com', '')}`
  : undefined;

export default ({ config }: ConfigContext): ExpoConfig => ({
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
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
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
      backgroundColor: '#ffffff',
    },
    // edgeToEdgeEnabled foi removido do config: SDK 57 exige edge-to-edge
    // sempre ativo no Android (não é mais opcional).
    package: 'com.petcardorg.mobile',
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json',
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  // App só de celular — sem `web` (react-native-web nunca foi dependência).
  // Sem isto o `expo start` tenta empacotar para web e falha ao resolver
  // react-native-web.
  platforms: ['ios', 'android'],
  scheme: 'petcard',
  plugins: [
    'expo-localization',
    'expo-notifications',
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
  ],
  extra: {
    // Client IDs do Google para o login social (mobile#54), lidos pelo
    // useGoogleAuth via process.env.EXPO_PUBLIC_*.
    googleAuth: {
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    },
  },
});
