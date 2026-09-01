import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, DefaultTheme, type LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { AuthStackParamList } from './src/navigation/types';

import { initI18n } from './src/i18n';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { colors } from './src/utils/theme';

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

// Deep links dos e-mails de auth (mobile#54): .../reset-password?token=... e
// .../verify-email?token=... (o scheme vem do APP_DEEP_LINK_BASE na API —
// exp://<ip>:8081/--/ no Expo Go, petcard:// no dev build). A verificação com
// o tutor já logado é tratada à parte (useEmailVerificationLink), porque aí a
// AuthStack não está montada.
const linking: LinkingOptions<AuthStackParamList> = {
  prefixes: [Linking.createURL('/'), 'petcard://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      VerifyEmail: 'verify-email',
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
