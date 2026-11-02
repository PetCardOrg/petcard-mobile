import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';

import { calendarService } from '../../services';

/** Conexão do tutor com o Google Agenda: status, conectar e desconectar. */
export function useGoogleCalendar() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      setConnected(await calendarService.getStatus());
    } catch {
      // Silently fail — calendar status is not critical
    }
  }, []);

  async function connect() {
    // A API devolve o tutor para este endereço ao fim do consentimento; a
    // sessão de auth reconhece a volta e fecha a aba sozinha. A raiz ('/') não
    // casa com nenhuma rota do linking, então a navegação não se mexe.
    const returnUrl = Linking.createURL('/');
    try {
      const url = await calendarService.getConnectUrl(returnUrl);
      if (!url) {
        Alert.alert(t('common.error'), t('appointments.calendar.notConfigured'));
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(url, returnUrl);
      const outcome =
        result.type === 'success' ? calendarService.parseConnectOutcome(result.url) : null;

      if (outcome === 'connected') {
        setConnected(true);
        setSuccessVisible(true);
      } else if (outcome === 'denied') {
        Alert.alert(t('appointments.calendar.deniedTitle'), t('appointments.calendar.denied'));
      } else if (outcome === 'error') {
        Alert.alert(t('common.error'), t('appointments.calendar.connectError'));
      } else {
        // Aba fechada à mão (ou volta por um app antigo da API): o status do
        // servidor é quem diz se conectou.
        void checkStatus();
      }
    } catch {
      Alert.alert(t('common.error'), t('appointments.calendar.connectError'));
    }
  }

  function disconnect() {
    Alert.alert(
      t('appointments.calendar.disconnectTitle'),
      t('appointments.calendar.disconnectMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('appointments.calendar.disconnectConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await calendarService.disconnect();
              setConnected(false);
            } catch {
              Alert.alert(t('common.error'), t('appointments.calendar.disconnectError'));
            }
          },
        },
      ],
    );
  }

  return {
    connected,
    successVisible,
    closeSuccess: () => setSuccessVisible(false),
    checkStatus,
    connect,
    disconnect,
  };
}
