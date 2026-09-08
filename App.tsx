import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { isRunningInExpoGo } from 'expo';
import { NavigationContainer, DefaultTheme, type LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AuthStackParamList } from './src/navigation/types';

import { initI18n } from './src/i18n';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/utils/theme';

// Importar expo-notifications já executa o auto-registro de token do próprio
// pacote (DevicePushTokenAutoRegistration.fx chama addPushTokenListener em
// escopo de módulo). Desde a SDK 57 isso lança no Android dentro do Expo Go e
// derruba o app antes de renderizar. Push remoto não existe em Expo Go de
// qualquer forma, então o módulo só é carregado fora dele — por require, para
// que o import não seja avaliado na entrada do bundle.
if (!isRunningInExpoGo()) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  // Present incoming notifications while the app is in the foreground. With the
  // app backgrounded/quitted, the OS shows them from the FCM `notification` block.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Os e-mails de auth não abrem mais o app: o link aponta para as páginas que a
// própria API serve (`/auth/reset-password` e `/auth/verify-email`), em https.
// `petcard://` é um scheme customizado e scheme customizado não tem dono —
// qualquer app pode registrar `petcard` e, no Android, ser escolhido para
// abrir o link do e-mail, levando o token junto. As rotas que existiam só para
// receber esses links saíram daqui com ele.
//
// O scheme continua declarado no app.config.ts: é por ele que volta o OAuth do
// Google.
const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: [Linking.createURL('/'), 'petcard://'],
  config: {
    screens: {
      ForgotPassword: 'forgot-password',
      Login: 'login',
    },
  },
};

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    primary: colors.primary,
    text: colors.text,
  },
};

export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking} theme={navigationTheme}>
          <StatusBar style="dark" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
