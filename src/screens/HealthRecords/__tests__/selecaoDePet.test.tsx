import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/renderWithProviders';
import { SelectedPetProvider } from '../../../contexts/SelectedPetContext';
import { DewormingScreen } from '../DewormingScreen';
import { VaccineScreen } from '../VaccineScreen';

// Prefixo `mock` é o que o jest permite referenciar dentro da factory.
const mockPets = [
  { id: 'p1', name: 'Rex', species: Species.DOG, sex: Sex.MALE, breed: 'Labrador' },
  { id: 'p2', name: 'Mia', species: Species.CAT, sex: Sex.FEMALE },
] as unknown as PetResponseDto[];

jest.mock('../../../hooks/usePets', () => ({
  usePets: () => ({
    pets: mockPets,
    isLoading: false,
    isRefreshing: false,
    errorMessage: null,
    refresh: jest.fn(),
    retry: jest.fn(),
  }),
}));

jest.mock('../../../services', () => ({
  vaccineService: { getVaccinesByPet: jest.fn().mockResolvedValue([]) },
  dewormingService: { getDewormingsByPet: jest.fn().mockResolvedValue([]) },
}));

/** Espelha o navegador da aba de saúde: troca a tela ativa, provider acima. */
function AbaDeSaude({ aba }: { aba: 'vacina' | 'vermifugo' }) {
  return (
    <SelectedPetProvider>
      {aba === 'vacina' ? <VaccineScreen /> : <DewormingScreen />}
    </SelectedPetProvider>
  );
}

describe('seleção de pet nas telas de saúde', () => {
  it('mantém o pet ao trocar de aba e voltar', async () => {
    const { rerender } = renderWithProviders(<AbaDeSaude aba="vacina" />);

    fireEvent.press(screen.getByText('Rex'));
    await waitFor(() => expect(screen.queryByText('Selecione o pet')).toBeNull());

    // Toque errado em vermífugo: o navegador desmonta a tela de vacina.
    rerender(<AbaDeSaude aba="vermifugo" />);
    await waitFor(() => expect(screen.queryByText('Selecione o pet')).toBeNull());

    rerender(<AbaDeSaude aba="vacina" />);

    // De volta no pet, não na lista de seleção — era o defeito relatado.
    expect(screen.queryByText('Selecione o pet')).toBeNull();
    expect(screen.getByText('Rex')).toBeVisible();
  });

  it('a escolha vale para as outras abas de saúde', async () => {
    const { rerender } = renderWithProviders(<AbaDeSaude aba="vacina" />);

    fireEvent.press(screen.getByText('Rex'));
    await waitFor(() => expect(screen.queryByText('Selecione o pet')).toBeNull());

    rerender(<AbaDeSaude aba="vermifugo" />);

    // Quem escolheu o pet está olhando a saúde dele, não só as vacinas.
    expect(screen.queryByText('Selecione o pet')).toBeNull();
    expect(screen.getByText('Rex')).toBeVisible();
  });

  it('"Trocar" devolve o tutor para a seleção', async () => {
    renderWithProviders(<AbaDeSaude aba="vacina" />);

    fireEvent.press(screen.getByText('Rex'));
    await waitFor(() => expect(screen.queryByText('Selecione o pet')).toBeNull());

    fireEvent.press(screen.getByText('Trocar'));

    expect(await screen.findByText('Selecione o pet')).toBeVisible();
    expect(screen.getByText('Mia')).toBeVisible();
  });
});
