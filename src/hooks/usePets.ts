import { useCallback } from 'react';
import type { PetResponseDto } from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';

import { useAuth } from '../contexts/AuthContext';
import { usePetsContext } from '../contexts/PetsContext';

type UsePetsReturn = {
  pets: PetResponseDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  refresh: () => void;
  retry: () => void;
};

/**
 * Lista de pets do tutor, vinda do cache compartilhado.
 *
 * A assinatura é a mesma de antes — as telas não mudam. O que mudou é de onde
 * o estado vem: era um por tela, agora é um só no `PetsProvider`. Focar uma
 * tela pede a lista, e o provider decide se isso vira requisição ou não.
 */
export function usePets(): UsePetsReturn {
  const { isAuthenticated } = useAuth();
  const { pets, isLoading, isRefreshing, errorMessage, garantirCarregado, refresh, retry } =
    usePetsContext();

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) return;
      garantirCarregado();
    }, [garantirCarregado, isAuthenticated]),
  );

  return { pets, isLoading, isRefreshing, errorMessage, refresh, retry };
}
