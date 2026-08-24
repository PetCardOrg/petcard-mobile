import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { api } from '../../services/api';
import { AuthProvider, useAuth } from '../AuthContext';

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

const SESSION = {
  access_token: 'tok-abc',
  user: { id: 'u1', name: 'Ana', email: 'ana@petcard.com', role: 'TUTOR' },
};

describe('AuthContext', () => {
  it('inicia deslogado após restaurar sessão vazia', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('restaura a sessão salva no SecureStore ao montar', async () => {
    await SecureStore.setItemAsync('auth_access_token', 'tok-abc');
    await SecureStore.setItemAsync('auth_user', JSON.stringify(SESSION.user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe('ana@petcard.com');
  });

  it('login autentica e persiste o token', async () => {
    const postSpy = jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.login('ana@petcard.com', 'senha123');
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/login', {
      email: 'ana@petcard.com',
      password: 'senha123',
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(await SecureStore.getItemAsync('auth_access_token')).toBe('tok-abc');
  });

  it('propaga erro e mantém deslogado quando o login falha', async () => {
    jest.spyOn(api, 'post').mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    let thrown: unknown;
    await act(async () => {
      try {
        await result.current.login('ana@petcard.com', 'errada');
      } catch (e) {
        thrown = e;
      }
    });

    expect(thrown).toBeInstanceOf(Error);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('login que falha não mexe em isBootstrapping', async () => {
    // isBootstrapping é só sobre restaurar a sessão salva no boot do app — o
    // AppNavigator usa esse flag pra decidir se desmonta a AuthStack. Se
    // login() também mexesse nele (como isLoading mexia antes), uma
    // credencial errada remontava a LoginScreen bem na hora de mostrar o erro,
    // e o aviso desaparecia antes do usuário ver.
    jest.spyOn(api, 'post').mockRejectedValue(new Error('401'));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      try {
        await result.current.login('ana@petcard.com', 'errada');
      } catch {
        // esperado
      }
    });

    expect(result.current.isBootstrapping).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('logout limpa sessão e SecureStore', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.login('ana@petcard.com', 'senha123');
    });
    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(await SecureStore.getItemAsync('auth_access_token')).toBeNull();
  });

  it('updateUser funde as alterações e persiste no SecureStore', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.login('ana@petcard.com', 'senha123');
    });

    await act(async () => {
      await result.current.updateUser({ name: 'Ana Souza', phone: '11988887777' });
    });

    expect(result.current.user).toEqual({
      ...SESSION.user,
      name: 'Ana Souza',
      phone: '11988887777',
    });
    const stored = await SecureStore.getItemAsync('auth_user');
    expect(JSON.parse(stored ?? '{}')).toEqual({
      ...SESSION.user,
      name: 'Ana Souza',
      phone: '11988887777',
    });
  });

  it('updateUser não faz nada sem sessão ativa', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.updateUser({ name: 'Ninguém' });
    });

    expect(result.current.user).toBeNull();
  });
});
