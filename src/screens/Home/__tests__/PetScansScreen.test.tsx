import { Linking } from 'react-native';

import { fireEvent, renderWithProviders, screen } from '../../../test/renderWithProviders';
import { PetScansScreen } from '../PetScansScreen';

const mockGetByPet = jest.fn();

jest.mock('../../../services', () => ({
  scanService: {
    getByPet: (petId: string) => mockGetByPet(petId) as unknown,
  },
}));

const route = {
  params: { petId: 'p1', petName: 'Rex' },
} as never;

const comLocalizacao = {
  id: 'scan-1',
  pet_id: 'p1',
  latitude: -3.73,
  longitude: -38.52,
  accuracy_meters: 18.4,
  created_at: '2026-09-05T15:30:00.000Z',
};

const semLocalizacao = {
  id: 'scan-2',
  pet_id: 'p1',
  created_at: '2026-09-04T09:00:00.000Z',
};

describe('PetScansScreen', () => {
  beforeEach(() => {
    mockGetByPet.mockReset();
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre o ponto no app de mapas com marcador cravado', async () => {
    mockGetByPet.mockResolvedValue([comLocalizacao]);
    renderWithProviders(<PetScansScreen route={route} navigation={{} as never} />);

    // Espera a lista sair do estado de carga antes de procurar o botão: sem
    // isto o findByTestId gasta o próprio orçamento de retry esperando a
    // requisição, e flaka em máquina fria.
    await screen.findByText(/QR da coleira lido/i);
    fireEvent.press(screen.getByTestId('open-map-scan-1'));

    // O `q=` repetido não é redundante: sem ele o Android centraliza o mapa
    // mas não crava o marcador, e o tutor perde de vista o que veio ver.
    expect(Linking.openURL).toHaveBeenCalledWith('geo:-3.73,-38.52?q=-3.73,-38.52');
  });

  // A leitura sem coordenada ainda é informação: alguém encontrou o pet.
  it('mostra a leitura sem localização, sem oferecer o mapa', async () => {
    mockGetByPet.mockResolvedValue([semLocalizacao]);
    renderWithProviders(<PetScansScreen route={route} navigation={{} as never} />);

    expect(await screen.findByText(/não compartilhou a localização/i)).toBeTruthy();
    expect(screen.queryByTestId('open-map-scan-2')).toBeNull();
  });

  it('mostra a precisão arredondada quando o navegador informou', async () => {
    mockGetByPet.mockResolvedValue([comLocalizacao]);
    renderWithProviders(<PetScansScreen route={route} navigation={{} as never} />);

    expect(await screen.findByText(/cerca de 18 m/i)).toBeTruthy();
  });

  it('avisa quando a carga falha', async () => {
    mockGetByPet.mockRejectedValue(new Error('rede fora'));
    renderWithProviders(<PetScansScreen route={route} navigation={{} as never} />);

    expect(await screen.findByText(/não foi possível carregar/i)).toBeTruthy();
  });

  it('mostra estado vazio quando ninguém leu o QR ainda', async () => {
    mockGetByPet.mockResolvedValue([]);
    renderWithProviders(<PetScansScreen route={route} navigation={{} as never} />);

    expect(await screen.findByText(/nenhuma leitura ainda/i)).toBeTruthy();
  });
});
