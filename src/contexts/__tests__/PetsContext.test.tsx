import { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';

import { PetsProvider, usePetsContext } from '../PetsContext';
import { petService } from '../../services';

jest.mock('../../services', () => ({
  petService: { getMyPets: jest.fn() },
}));

const getMyPets = petService.getMyPets as jest.Mock;

const PETS = [
  { id: 'p1', name: 'Rex' },
  { id: 'p2', name: 'Mia' },
];

/**
 * Simula uma tela consumidora.
 *
 * Pede a lista num efeito, como o `usePets` faz dentro do `useFocusEffect` —
 * pedir durante o render dispararia setState no provider no meio do render
 * desta, que é justamente o que React proíbe.
 */
function Tela({ nome }: { nome: string }) {
  const { pets, garantirCarregado, isLoading, errorMessage } = usePetsContext();

  useEffect(() => {
    garantirCarregado();
  }, [garantirCarregado]);

  return (
    <Text testID={`tela-${nome}`}>
      {errorMessage ?? (isLoading ? 'carregando' : pets.map((p) => p.name).join(','))}
    </Text>
  );
}

describe('PetsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getMyPets.mockResolvedValue(PETS);
  });

  it('três telas montadas juntas fazem uma única requisição', async () => {
    // O caso que motivou a mudança: as abas de saúde ficam montadas, e voltar
    // para a seção acordava vacina, vermífugo e medicação ao mesmo tempo.
    render(
      <PetsProvider>
        <Tela nome="vacina" />
        <Tela nome="vermifugo" />
        <Tela nome="medicacao" />
      </PetsProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('tela-vacina')).toHaveTextContent('Rex,Mia'));

    expect(getMyPets).toHaveBeenCalledTimes(1);
  });

  it('todas as telas enxergam a mesma lista', async () => {
    render(
      <PetsProvider>
        <Tela nome="a" />
        <Tela nome="b" />
      </PetsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('tela-a')).toHaveTextContent('Rex,Mia');
      expect(screen.getByTestId('tela-b')).toHaveTextContent('Rex,Mia');
    });
  });

  it('uma tela que monta depois aproveita a lista fresca, sem nova busca', async () => {
    const { rerender } = render(
      <PetsProvider>
        <Tela nome="a" />
      </PetsProvider>,
    );
    await waitFor(() => expect(getMyPets).toHaveBeenCalledTimes(1));

    rerender(
      <PetsProvider>
        <Tela nome="a" />
        <Tela nome="b" />
      </PetsProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('tela-b')).toHaveTextContent('Rex,Mia'));

    expect(getMyPets).toHaveBeenCalledTimes(1);
  });

  it('refresh força a busca mesmo com a lista fresca', async () => {
    let refresh!: () => void;
    function Controle() {
      const { garantirCarregado, refresh: forcar } = usePetsContext();
      refresh = forcar;
      useEffect(() => {
        garantirCarregado();
      }, [garantirCarregado]);
      return null;
    }

    render(
      <PetsProvider>
        <Controle />
      </PetsProvider>,
    );
    await waitFor(() => expect(getMyPets).toHaveBeenCalledTimes(1));

    await act(async () => {
      refresh();
    });

    expect(getMyPets).toHaveBeenCalledTimes(2);
  });

  it('mostra a mensagem de erro e o retry tenta de novo', async () => {
    getMyPets.mockRejectedValueOnce(new Error('rede caiu'));

    let retry!: () => void;
    function Controle() {
      const { errorMessage, garantirCarregado, retry: tentarDeNovo } = usePetsContext();
      retry = tentarDeNovo;
      useEffect(() => {
        garantirCarregado();
      }, [garantirCarregado]);
      return <Text testID="erro">{errorMessage ?? 'sem erro'}</Text>;
    }

    render(
      <PetsProvider>
        <Controle />
      </PetsProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('erro')).toHaveTextContent(/Não foi possível carregar/),
    );

    // Depois de falhar a lista não é fresca: o retry precisa passar pela
    // janela de frescor em vez de ser descartado como redundante.
    getMyPets.mockResolvedValue(PETS);
    await act(async () => {
      retry();
    });

    expect(getMyPets).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByTestId('erro')).toHaveTextContent('sem erro'));
  });

  it('explica o erro de permissão em vez da mensagem genérica', async () => {
    getMyPets.mockRejectedValueOnce(
      Object.assign(new Error('403'), {
        isAxiosError: true,
        response: { status: 403 },
      }),
    );

    render(
      <PetsProvider>
        <Tela nome="a" />
      </PetsProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('tela-a')).toHaveTextContent(/Sem permissão/));
  });
});
