import { act, renderHook, waitFor } from '@testing-library/react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { useGoogleAuthNativo, useGoogleIdTokenNativo } from '../useGoogleAuth';

/**
 * Android usa o login nativo: o Google recusa o retorno por scheme customizado
 * do `expo-auth-session` em client Android (`400 invalid_request`).
 */
const mockLoginWithGoogle = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: mockLoginWithGoogle }),
}));

const signIn = GoogleSignin.signIn as jest.Mock;

describe('useGoogleAuth no Android (login nativo)', () => {
  beforeEach(() => {
    mockLoginWithGoogle.mockReset();
    signIn.mockReset();
  });

  it('troca o ID token do login nativo por sessão do PetCard', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);
    signIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-tok' } });

    const { result } = renderHook(() => useGoogleAuthNativo());
    act(() => result.current.promptAsync());

    await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalledWith('google-tok'));
    await waitFor(() => expect(result.current.inProgress).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('não faz nada quando a pessoa cancela', async () => {
    signIn.mockResolvedValue({ type: 'cancelled', data: null });

    const { result } = renderHook(() => useGoogleAuthNativo());
    act(() => result.current.promptAsync());

    await waitFor(() => expect(result.current.inProgress).toBe(false));
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('mostra erro quando o login nativo falha', async () => {
    const onError = jest.fn();
    signIn.mockRejectedValue(Object.assign(new Error('DEVELOPER_ERROR'), { code: '10' }));

    const { result } = renderHook(() => useGoogleAuthNativo(onError));
    act(() => result.current.promptAsync());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(result.current.error);
  });

  it('devolve o ID token para confirmar a exclusão sem abrir sessão (AUD MOB-14)', async () => {
    signIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-tok' } });

    const { result } = renderHook(() => useGoogleIdTokenNativo());

    await expect(result.current.obterIdToken()).resolves.toBe('google-tok');
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
  });
});
