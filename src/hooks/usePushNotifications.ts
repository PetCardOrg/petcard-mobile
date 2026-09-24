import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import { useTranslation } from 'react-i18next';

import { DevicePlatform } from '@petcardorg/shared';

import { useAuth } from '../contexts/AuthContext';
import { deviceService } from '../services';
import {
  isPushAvailable,
  loadNotifications,
  type NotificationsModule,
} from '../utils/notifications';

const ANDROID_CHANNEL_ID = 'default';

function resolvePlatform(tokenType: string): DevicePlatform {
  if (tokenType === 'ios' || Platform.OS === 'ios') return DevicePlatform.IOS;
  return DevicePlatform.ANDROID;
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'PetCard',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermission(Notifications: NotificationsModule): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  if (!settings.canAskAgain) return false;

  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

/**
 * Registers the device's native FCM token with the backend once the tutor is
 * authenticated, so the push worker (PC-068) can reach this device. Remote push
 * requires a development build — it does not work in Expo Go (SDK 53+).
 */
export function usePushNotifications(): void {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    // Push remoto saiu do Expo Go na SDK 53. No Android as APIs de token não
    // avisam: elas lançam (warnOfExpoGoPushUsage), e como addPushTokenListener
    // fica fora do try/catch do bootstrap, o app inteiro caía na inicialização.
    // Sem dev build não há token a registrar, então sai cedo e deixa o resto do
    // app utilizável no Expo Go.
    if (!isPushAvailable()) return;

    if (!isAuthenticated) {
      registeredToken.current = null;
      return;
    }

    const Notifications = loadNotifications();
    let cancelled = false;

    async function registerToken(token: string, type: string): Promise<void> {
      if (cancelled || registeredToken.current === token) return;
      try {
        await deviceService.register({ token, platform: resolvePlatform(type) });
        registeredToken.current = token;
      } catch {
        // Push is best-effort: a failed registration must not break the app.
      }
    }

    async function bootstrap(): Promise<void> {
      if (!Device.isDevice) return;

      const granted = await ensurePermission(Notifications);
      if (!granted) {
        Alert.alert(t('notifications.permissionDeniedTitle'), t('notifications.permissionDenied'));
        return;
      }

      await ensureAndroidChannel(Notifications);

      try {
        const devicePushToken = await Notifications.getDevicePushTokenAsync();
        await registerToken(String(devicePushToken.data), devicePushToken.type);
      } catch {
        // Token not available (e.g. running without FCM credentials).
      }
    }

    void bootstrap();

    // FCM may rotate the token at any time — re-register when it does.
    const tokenSub = Notifications.addPushTokenListener((token) => {
      void registerToken(String(token.data), token.type);
    });

    return () => {
      cancelled = true;
      tokenSub.remove();
    };
  }, [isAuthenticated, t]);
}
