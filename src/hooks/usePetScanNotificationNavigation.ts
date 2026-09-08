import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';

import { usePetsContext } from '../contexts/PetsContext';
import type { MainTabParamList } from '../navigation/types';
import { isPushAvailable, loadNotifications } from '../utils/notifications';

/** `type` que a api manda no payload do push de leitura da coleira. */
const PET_SCAN = 'pet_scan';

function extrairPetId(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const payload = data as Record<string, unknown>;
  if (payload.type !== PET_SCAN) return null;
  // O FCM só transporta string no `data`, então pet_id chega sempre como texto.
  return typeof payload.pet_id === 'string' ? payload.pet_id : null;
}

/**
 * Abre "Onde encontraram" ao tocar na notificação de que o pet foi encontrado.
 *
 * Sem isto o toque só traz o app para frente, na tela em que ele estava.
 *
 * A rota `PetScans` exige `petName`, que o payload não carrega — só `pet_id`. O
 * nome sai do `PetsContext`, que já tem a lista em memória. Como o app pode
 * estar sendo aberto do zero pela própria notificação, a lista costuma ainda não
 * ter chegado nesse instante: o id fica pendente e a navegação acontece assim
 * que os pets carregam.
 */
export function usePetScanNotificationNavigation(): void {
  const navigation = useNavigation<MaterialTopTabNavigationProp<MainTabParamList>>();
  const { pets } = usePetsContext();
  const [petIdPendente, setPetIdPendente] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushAvailable()) return;

    const Notifications = loadNotifications();

    // App aberto do zero pelo toque: a resposta não passa pelo listener, que
    // ainda não existia quando o usuário tocou.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const petId = extrairPetId(response?.notification.request.content.data);
      if (petId) setPetIdPendente(petId);
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const petId = extrairPetId(response.notification.request.content.data);
      if (petId) setPetIdPendente(petId);
    });

    return () => subscription.remove();
  }, []);

  const abrir = useCallback(
    (petId: string, petName: string) => {
      setPetIdPendente(null);
      navigation.navigate('Home', {
        screen: 'PetScans',
        params: { petId, petName },
      });
    },
    [navigation],
  );

  useEffect(() => {
    if (!petIdPendente) return;

    const pet = pets.find((p) => p.id === petIdPendente);
    // Pet ainda não carregado: espera a lista mudar. Se ele tiver sido apagado,
    // o id fica pendente sem efeito — melhor do que navegar para uma tela vazia.
    if (!pet) return;

    abrir(pet.id, pet.name);
  }, [petIdPendente, pets, abrir]);
}
