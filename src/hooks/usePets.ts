import { useCallback, useRef, useState } from 'react';
import type { PetResponseDto } from '@petcardorg/shared';
import { useFocusEffect } from '@react-navigation/native';
import { isAxiosError } from 'axios';

import { useAuth } from '../contexts/AuthContext';
import { petService } from '../services';

type UsePetsReturn = {
  pets: PetResponseDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  refresh: () => void;
  retry: () => void;
};

export function usePets(): UsePetsReturn {
  const { isReady } = useAuth();
  const hasLoaded = useRef(false);

  const [pets, setPets] = useState<PetResponseDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadPets = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'refresh') {
      setIsRefreshing(true);
    } else if (!hasLoaded.current) {
      setIsLoading(true);
    }

    try {
      const data = await petService.getMyPets();
      setPets(data);
      setErrorMessage(null);
      hasLoaded.current = true;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setErrorMessage(
          'Sem permissão para acessar seus pets. Peça ao administrador para configurar sua conta.',
        );
      } else {
        setErrorMessage('Não foi possível carregar seus pets. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;
      void loadPets();
    }, [loadPets, isReady]),
  );

  const refresh = useCallback(() => {
    void loadPets('refresh');
  }, [loadPets]);

  const retry = useCallback(() => {
    void loadPets();
  }, [loadPets]);

  return { pets, isLoading, isRefreshing, errorMessage, refresh, retry };
}
