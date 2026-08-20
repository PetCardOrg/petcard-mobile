import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import { renderWithProviders, screen, fireEvent, waitFor } from '../../test/renderWithProviders';
import { SelectedPetProvider } from '../../contexts/SelectedPetContext';
import { HealthRecordsNavigator } from '../HealthRecordsNavigator';

const mockPets = [
  { id: 'p1', name: 'Rex', species: Species.DOG, sex: Sex.MALE, breed: 'Labrador' },
] as unknown as PetResponseDto[];

jest.mock('../../hooks/usePets', () => ({
  usePets: () => ({
    pets: mockPets,
    isLoading: false,
    isRefreshing: false,
    errorMessage: null,
    refresh: jest.fn(),
    retry: jest.fn(),
  }),
}));

// Prefixo `mock` é o que o jest permite referenciar dentro da factory.
const mockGetVaccinesByPet = jest.fn().mockResolvedValue([]);

jest.mock('../../services', () => ({
  vaccineService: { getVaccinesByPet: (petId: string) => mockGetVaccinesByPet(petId) as unknown },
  dewormingService: { getDewormingsByPet: jest.fn().mockResolvedValue([]) },
  medicationService: { getMedicationsByPet: jest.fn().mockResolvedValue([]) },
}));

function renderNavegador() {
  return renderWithProviders(
    <SelectedPetProvider>
      <HealthRecordsNavigator />
    </SelectedPetProvider>,
  );
}

describe('HealthRecordsNavigator', () => {
  beforeEach(() => {
    mockGetVaccinesByPet.mockClear();
  });

  it('só monta a aba depois de ela ser aberta', () => {
    renderNavegador();

    // Só vacinas montada: uma seleção de pet na árvore.
    expect(screen.getAllByText('Selecione o pet', { includeHiddenElements: true })).toHaveLength(1);

    fireEvent.press(screen.getByText('Vermífugos'));

    expect(screen.getAllByText('Selecione o pet', { includeHiddenElements: true })).toHaveLength(2);
  });

  it('esconde a aba anterior sem desmontar', async () => {
    renderNavegador();

    fireEvent.press(screen.getByText('Rex'));
    await waitFor(() => expect(mockGetVaccinesByPet).toHaveBeenCalledTimes(1));

    fireEvent.press(screen.getByText('Vermífugos'));
    fireEvent.press(screen.getByText('Vacinas'));

    // Remontar refaria a busca. Uma chamada só = a tela ficou viva.
    expect(mockGetVaccinesByPet).toHaveBeenCalledTimes(1);
  });
});
