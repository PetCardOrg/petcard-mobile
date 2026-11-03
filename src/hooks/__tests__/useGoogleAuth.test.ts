import { act, renderHook, waitFor } from '@testing-library/react-native';
import i18n from 'i18next';
import type { AuthSessionResult } from 'expo-auth-session';

import { useGoogleAuth, useGoogleIdToken } from '../useGoogleAuth';

const mockLoginWithGoogle = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ loginWithGoogle: mockLoginWithGoogle }),
}));

// Resposta do consentimento do Google; cada teste define a sua antes de montar.
let mockResponse: Partial<AuthSessionResult> | null = null;
const mockPromptAsync = jest.fn();
jest.mock('expo-auth-session/providers/google', () => ({
  __esModule: true,
  useAuthRequest: () => [{}, mockResponse, mockPromptAsync],
}));

describe('useGoogleAuth (AUD MOB-07)', () => {
  beforeEach(() => {
    mockLoginWithGoogle.mockReset();
    mockResponse = null;
  });

  it('troca o id_token do Google por sessão do PetCard', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);
    mockResponse = { type: 'success', params: { id_token: 'google-tok' } };

    const { result } = renderHook(() => useGoogleAuth());

    await waitFor(() => expect(result.current.inProgress).toBe(false));
    expect(mockLoginWithGoogle).toHaveBeenCalledWith('google-tok');
    expect(result.current.error).toBeNull();
  });

  it('usa o idToken da autenticação quando não vem nos params', async () => {
    mockLoginWithGoogle.mockResolvedValue(undefined);
    mockResponse = {
      type: 'success',
      params: {},
      authentication: { idToken: 'auth-tok' } as never,
    };

    renderHook(() => useGoogleAuth());

    await waitFor(() => expect(mockLoginWithGoogle).toHaveBeenCalledWith('auth-tok'));
  });

  it('define erro e não tenta entrar quando o Google não devolve id_token', async () => {
    const onError = jest.fn();
    mockResponse = { type: 'success', params: {} };

    const { result } = renderHook(() => useGoogleAuth(onError));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(result.current.error);
  });

  it('define erro quando a API recusa o token', async () => {
    const onError = jest.fn();
    mockLoginWithGoogle.mockRejectedValue(new Error('401'));
    mockResponse = { type: 'success', params: { id_token: 'google-tok' } };

    const { result } = renderHook(() => useGoogleAuth(onError));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.inProgress).toBe(false);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('mostra o erro no idioma escolhido (AUD MOB-08)', async () => {
    mockResponse = { type: 'success', params: {} };
    await act(async () => {
      await i18n.changeLanguage('en-US');
    });
    try {
      const { result } = renderHook(() => useGoogleAuth());

      await waitFor(() => expect(result.current.error).toBe("Google didn't return a valid token."));
    } finally {
      await act(async () => {
        await i18n.changeLanguage('pt-BR');
      });
    }
  });

  it('não faz nada quando o usuário cancela o consentimento', () => {
    mockResponse = { type: 'cancel' };

    const { result } = renderHook(() => useGoogleAuth());

    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });
});

describe('useGoogleIdToken (AUD MOB-14)', () => {
  beforeEach(() => {
    mockPromptAsync.mockReset();
    mockLoginWithGoogle.mockReset();
    mockResponse = null;
  });

  it('devolve o id_token do Google sem abrir sessão', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'success', params: { id_token: 'google-tok' } });

    const { result } = renderHook(() => useGoogleIdToken());

    await expect(result.current.obterIdToken()).resolves.toBe('google-tok');
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
  });

  it('devolve null quando a pessoa cancela', async () => {
    mockPromptAsync.mockResolvedValue({ type: 'cancel' });

    const { result } = renderHook(() => useGoogleIdToken());

    await expect(result.current.obterIdToken()).resolves.toBeNull();
  });
});
