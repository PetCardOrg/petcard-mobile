import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { PetResponseDto } from '@petcardorg/shared';
import { isAxiosError } from 'axios';

import { petService } from '../services';

/**
 * Janela em que a lista já carregada é considerada fresca.
 *
 * Voltar para a aba de saúde não precisa de dado novo: a lista de pets muda
 * quando o tutor cadastra ou remove um animal, não a cada segundo. Dentro da
 * janela, focar uma tela reaproveita o que está em memória.
 */
export const JANELA_DE_FRESCOR_MS = 30_000;

type PetsContextValue = {
  pets: PetResponseDto[];
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  /** Busca se os dados estiverem velhos; reaproveita a requisição em voo. */
  garantirCarregado: () => void;
  /** Força a busca, ignorando o frescor. Pull-to-refresh. */
  refresh: () => void;
  retry: () => void;
};

const PetsContext = createContext<PetsContextValue | null>(null);

function mensagemDeErro(err: unknown): string {
  if (isAxiosError(err) && err.response?.status === 403) {
    return 'Sem permissão para acessar seus pets. Peça ao administrador para configurar sua conta.';
  }
  return 'Não foi possível carregar seus pets. Tente novamente.';
}

/**
 * Dono único da lista de pets do tutor.
 *
 * Antes cada tela chamava `usePets` e ganhava o próprio estado, com o próprio
 * `useFocusEffect` disparando `GET /pets`. As abas de saúde permanecem
 * montadas depois de visitadas, então voltar para a seção de saúde acordava
 * vacina, vermífugo e medicação ao mesmo tempo — três chamadas paralelas para
 * a mesma lista, mais a da Home e a de agendamentos.
 *
 * Aqui o estado é um só. Duas defesas contra requisição desperdiçada:
 * a janela de frescor, que dispensa a busca se a lista é recente, e a
 * promessa em voo compartilhada, que faz telas acordando juntas aguardarem a
 * mesma requisição em vez de abrirem uma cada.
 */
export function PetsProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<PetResponseDto[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const buscaEmVoo = useRef<Promise<void> | null>(null);
  const carregadoEm = useRef<number | null>(null);

  const buscar = useCallback(async (modo: 'initial' | 'refresh') => {
    // Uma busca já a caminho atende todo mundo que chegar enquanto ela corre.
    if (buscaEmVoo.current) return buscaEmVoo.current;

    if (modo === 'refresh') setIsRefreshing(true);
    else if (carregadoEm.current === null) setIsLoading(true);

    const promessa = (async () => {
      try {
        const data = await petService.getMyPets();
        setPets(data);
        setErrorMessage(null);
        carregadoEm.current = Date.now();
      } catch (err) {
        setErrorMessage(mensagemDeErro(err));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        buscaEmVoo.current = null;
      }
    })();

    buscaEmVoo.current = promessa;
    return promessa;
  }, []);

  const garantirCarregado = useCallback(() => {
    const em = carregadoEm.current;
    const fresco = em !== null && Date.now() - em < JANELA_DE_FRESCOR_MS;
    if (fresco || buscaEmVoo.current) return;
    void buscar('initial');
  }, [buscar]);

  const refresh = useCallback(() => {
    void buscar('refresh');
  }, [buscar]);

  const retry = useCallback(() => {
    // Depois de erro a lista não é fresca coisa nenhuma: força.
    carregadoEm.current = null;
    void buscar('initial');
  }, [buscar]);

  const value = useMemo(
    () => ({
      pets,
      isLoading,
      isRefreshing,
      errorMessage,
      garantirCarregado,
      refresh,
      retry,
    }),
    [pets, isLoading, isRefreshing, errorMessage, garantirCarregado, refresh, retry],
  );

  return <PetsContext.Provider value={value}>{children}</PetsContext.Provider>;
}

export function usePetsContext(): PetsContextValue {
  const ctx = useContext(PetsContext);
  if (!ctx) {
    throw new Error('usePetsContext precisa estar dentro de <PetsProvider>');
  }
  return ctx;
}
