import { act, renderHook, waitFor } from '@testing-library/react-native';

import { usePetScanNotificationNavigation } from '../usePetScanNotificationNavigation';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../contexts/PetsContext', () => ({
  usePetsContext: () => ({ pets: [{ id: 'p1', name: 'Rex' }] }),
}));

// Última resposta que o sistema guarda: a do toque que abriu o app.
let mockUltimaResposta: unknown = null;
const mockNotifications = {
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(mockUltimaResposta)),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
};
jest.mock('../../utils/notifications', () => ({
  isPushAvailable: () => true,
  loadNotifications: () => mockNotifications,
}));

function resposta(identifier: string) {
  return {
    notification: {
      request: { identifier, content: { data: { type: 'pet_scan', pet_id: 'p1' } } },
    },
  };
}

describe('usePetScanNotificationNavigation (AUD MOB-05)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockNotifications.getLastNotificationResponseAsync.mockClear();
  });

  it('abre a tela do pet encontrado pelo toque que abriu o app', async () => {
    mockUltimaResposta = resposta('toque-1');

    renderHook(() => usePetScanNotificationNavigation());

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('Home', {
        screen: 'PetScans',
        params: { petId: 'p1', petName: 'Rex' },
      }),
    );
  });

  it('não reabre a tela com a mesma notificação depois de um novo login', async () => {
    mockUltimaResposta = resposta('toque-2');

    const primeiro = renderHook(() => usePetScanNotificationNavigation());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));

    // Logout e login desmontam e remontam o MainNavigator; o sistema continua
    // devolvendo a mesma última resposta.
    primeiro.unmount();
    renderHook(() => usePetScanNotificationNavigation());
    await waitFor(() =>
      expect(mockNotifications.getLastNotificationResponseAsync).toHaveBeenCalledTimes(2),
    );
    // Deixa a resposta da segunda montagem chegar ao estado do hook.
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
