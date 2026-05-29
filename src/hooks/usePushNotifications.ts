import { useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useTranslation } from 'react-i18next';

import { DevicePlatform } from '@petcardorg/shared';

import { useAuth } from '../contexts/AuthContext';
import { deviceService } from '../services';

const ANDROID_CHANNEL_ID = 'default';

function resolvePlatform(tokenType: string): DevicePlatform {
  if (tokenType === 'ios' || Platform.OS === 'ios') return DevicePlatform.IOS;
  return DevicePlatform.ANDROID;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: 'PetCard',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermission(): Promise<boolean> {
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
    if (!isAuthenticated) {
      registeredToken.current = null;
      return;
    }

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

      const granted = await ensurePermission();
      if (!granted) {
        Alert.alert(t('notifications.permissionDeniedTitle'), t('notifications.permissionDenied'));
        return;
      }

      await ensureAndroidChannel();

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
