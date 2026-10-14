import { Alert } from 'react-native';
import { renderWithProviders, screen, waitFor, fireEvent } from '../../../test/renderWithProviders';
import { PetDetailsScreen } from '../PetDetailsScreen';

const mockRemoverPet = jest.fn();
const mockInvalidar = jest.fn();
const mockDeletePet = jest.fn();
const mockGetPetById = jest.fn();

jest.mock('../../../contexts/PetsContext', () => ({
  usePetsContext: () => ({ removerPet: mockRemoverPet, invalidar: mockInvalidar }),
}));
const mockGetByPet = jest.fn();

jest.mock('../../../services', () => ({
  petService: {
    getPetById: (id: string) => mockGetPetById(id) as unknown,
    updatePet: jest.fn(),
    deletePet: (id: string) => mockDeletePet(id) as unknown,
  },
  scanService: {
    getByPet: (id: string) => mockGetByPet(id) as unknown,
  },
  uploadService: { uploadImage: jest.fn() },
}));

const route = { params: { petId: 'p1', petName: 'Rex' } } as never;
const navigation = { navigate: jest.fn(), setParams: jest.fn(), goBack: jest.fn() } as never;

const PET = {
  id: 'p1',
  name: 'Rex',
  species: 'DOG',
  sex: 'MALE',
  breed: 'Labrador',
  birth_date: '2022-03-10',
  weight: 12.5,
  photo_url: null,
};

const LEITURA = {
  id: 'scan-1',
  pet_id: 'p1',
  latitude: -3.73,
  longitude: -38.52,
  created_at: '2026-09-07T12:00:00.000Z',
};

function renderizar() {
  renderWithProviders(<PetDetailsScreen route={route} navigation={navigation} />);
}

describe('PetDetailsScreen — atalho para as leituras da coleira', () => {
  beforeEach(() => {
    mockGetPetById.mockReset().mockResolvedValue(PET);
    mockGetByPet.mockReset().mockResolvedValue([]);
  });

  it('esconde o atalho quando ninguém leu o QR ainda', async () => {
    renderizar();

    await screen.findByText('Rex');
    await waitFor(() => expect(mockGetByPet).toHaveBeenCalledWith('p1'));
    expect(screen.queryByText('Onde encontraram')).toBeNull();
  });

  it('mostra o atalho quando existe pelo menos uma leitura', async () => {
    mockGetByPet.mockResolvedValue([LEITURA]);
    renderizar();

    expect(await screen.findByText('Onde encontraram')).toBeTruthy();
  });

  // Falhar ao consultar as leituras só pode custar o atalho. Derrubar a tela
  // do pet por causa disso trocaria um problema pequeno por um grande.
  it('mantém a tela do pet de pé quando a busca das leituras falha', async () => {
    mockGetByPet.mockRejectedValue(new Error('rede fora'));
    renderizar();

    expect(await screen.findByText('Rex')).toBeTruthy();
    await waitFor(() => expect(mockGetByPet).toHaveBeenCalled());
    expect(screen.queryByText('Onde encontraram')).toBeNull();
  });
});

describe('PetDetailsScreen — exclusão do pet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetPetById.mockReset().mockResolvedValue(PET);
    mockGetByPet.mockReset().mockResolvedValue([]);
    mockDeletePet.mockReset();
  });

  /** Aperta "Excluir" e confirma no diálogo do sistema. */
  async function excluirOPet() {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    renderizar();
    fireEvent.press(await screen.findByText('Excluir'));

    const botoes = alerta.mock.calls[0]?.[2] ?? [];
    const confirmar = botoes.find((b) => b.style === 'destructive');
    await confirmar?.onPress?.();
    return alerta;
  }

  it('tira o pet da lista da Home quando a exclusão dá certo', async () => {
    mockDeletePet.mockResolvedValue(undefined);

    await excluirOPet();

    await waitFor(() => expect(mockRemoverPet).toHaveBeenCalledWith('p1'));
    expect(mockDeletePet).toHaveBeenCalledWith('p1');
  });

  it('mantém o pet na lista quando a exclusão falha', async () => {
    mockDeletePet.mockRejectedValue(new Error('rede'));

    await excluirOPet();

    await waitFor(() => expect(mockDeletePet).toHaveBeenCalled());
    expect(mockRemoverPet).not.toHaveBeenCalled();
  });
});
