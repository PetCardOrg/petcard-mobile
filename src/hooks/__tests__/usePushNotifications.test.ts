import { renderHook, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { usePushNotifications } from '../usePushNotifications';

let mockIsAuthenticated = true;
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

const mockRegister = jest.fn();
jest.mock('../../services', () => ({
  deviceService: { register: (...args: unknown[]) => mockRegister(...args) },
}));

jest.mock('expo-device', () => ({ __esModule: true, isDevice: true }));

// Módulo de notificações falso: guarda o listener de rotação do token para o
// teste disparar como o FCM faria.
let mockTokenListener: ((token: { data: string; type: string }) => void) | null = null;
const mockNotifications = {
  AndroidImportance: { DEFAULT: 3 },
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  getDevicePushTokenAsync: jest.fn(),
  addPushTokenListener: jest.fn((cb: (token: { data: string; type: string }) => void) => {
    mockTokenListener = cb;
    return { remove: jest.fn() };
  }),
};
jest.mock('../../utils/notifications', () => ({
  isPushAvailable: () => true,
  loadNotifications: () => mockNotifications,
}));

describe('usePushNotifications (AUD MOB-07)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsAuthenticated = true;
    mockTokenListener = null;
    mockRegister.mockReset().mockResolvedValue(undefined);
    mockNotifications.getPermissionsAsync.mockResolvedValue({ granted: true });
    mockNotifications.getDevicePushTokenAsync.mockResolvedValue({
      data: 'fcm-1',
      type: 'android',
    });
  });

  it('registra o token do aparelho uma vez só', async () => {
    const { rerender } = renderHook(() => usePushNotifications());

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
    expect(mockRegister).toHaveBeenCalledWith(expect.objectContaining({ token: 'fcm-1' }));

    // O mesmo token chegando de novo (listener ou nova renderização) não
    // gera outra chamada.
    rerender({});
    mockTokenListener?.({ data: 'fcm-1', type: 'android' });
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));
  });

  it('registra de novo quando o FCM rotaciona o token', async () => {
    renderHook(() => usePushNotifications());
    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(1));

    mockTokenListener?.({ data: 'fcm-2', type: 'android' });

    await waitFor(() => expect(mockRegister).toHaveBeenCalledTimes(2));
    expect(mockRegister).toHaveBeenLastCalledWith(expect.objectContaining({ token: 'fcm-2' }));
  });

  it('não registra sem sessão', async () => {
    mockIsAuthenticated = false;

    renderHook(() => usePushNotifications());

    await waitFor(() => expect(mockNotifications.getPermissionsAsync).not.toHaveBeenCalled());
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('avisa e não registra quando a permissão é negada', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockNotifications.getPermissionsAsync.mockResolvedValue({
      granted: false,
      canAskAgain: false,
    });

    renderHook(() => usePushNotifications());

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(mockRegister).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
