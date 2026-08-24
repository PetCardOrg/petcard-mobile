import type { ReactNode } from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';

import { api } from '../../services/api';
import { AuthProvider, useAuth } from '../AuthContext';

jest.mock('../../services', () => ({
  tutorService: { updateCurrentTutor: jest.fn() },
  uploadService: { uploadImage: jest.fn() },
}));

const { tutorService, uploadService } = jest.requireMock('../../services');

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

  it('register cria a conta e autentica sem telefone/foto', async () => {
    const postSpy = jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.register('Ana', 'ana@petcard.com', 'senha1234');
    });

    expect(postSpy).toHaveBeenCalledWith('/auth/register', {
      name: 'Ana',
      email: 'ana@petcard.com',
      password: 'senha1234',
    });
    expect(tutorService.updateCurrentTutor).not.toHaveBeenCalled();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('register com foto e telefone faz upload e PATCH antes de autenticar', async () => {
    // O token precisa estar salvo ANTES dessas chamadas — upload de imagem e
    // PATCH /tutors/me exigem Authorization — e isAuthenticated só deve virar
    // true depois que telefone/foto já estão no usuário final, senão a tela
    // de cadastro desmontaria no meio do fluxo (mesma classe de bug do login).
    jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    uploadService.uploadImage.mockResolvedValueOnce(
      'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    );
    tutorService.updateCurrentTutor.mockResolvedValueOnce({
      ...SESSION.user,
      phone: '11999990000',
      profile_image_url: 'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.register('Ana', 'ana@petcard.com', 'senha1234', {
        phone: '11999990000',
        photoUri: 'file:///tmp/foto.jpg',
      });
    });

    expect(uploadService.uploadImage).toHaveBeenCalledWith('file:///tmp/foto.jpg', 'tutors');
    expect(tutorService.updateCurrentTutor).toHaveBeenCalledWith({
      phone: '11999990000',
      profile_image_url: 'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    });
    expect(result.current.user?.phone).toBe('11999990000');
    expect(result.current.user?.profile_image_url).toBe(
      'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    );
  });

  it('register segue autenticando mesmo se o PATCH de telefone/foto falhar', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: SESSION });
    tutorService.updateCurrentTutor.mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isBootstrapping).toBe(false));

    await act(async () => {
      await result.current.register('Ana', 'ana@petcard.com', 'senha1234', {
        phone: '11999990000',
      });
    });

    // A conta já foi criada — não faz sentido derrubar o cadastro por causa
    // de um PATCH complementar. O telefone fica pendente pra ser completado
    // depois no perfil.
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('ana@petcard.com');
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
