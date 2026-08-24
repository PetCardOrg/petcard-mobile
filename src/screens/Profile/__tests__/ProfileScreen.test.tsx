import { Alert } from 'react-native';

import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  act,
} from '../../../test/renderWithProviders';
import { ProfileScreen } from '../ProfileScreen';

const mockLogout = jest.fn();
const mockUpdateUser = jest.fn();
const mockUser = {
  id: 'u1',
  name: 'Ana Silva',
  email: 'ana@petcard.com',
  role: 'TUTOR',
  phone: '11999990000',
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser, logout: mockLogout, updateUser: mockUpdateUser }),
}));

jest.mock('../../../services', () => ({
  tutorService: {
    updateCurrentTutor: jest.fn(),
    deleteCurrentTutor: jest.fn(),
  },
  uploadService: {
    uploadImage: jest.fn(),
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/foto.jpg' }],
  }),
}));

const { tutorService, uploadService } = jest.requireMock('../../../services');

describe('ProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mostra nome, email e telefone do tutor', () => {
    renderWithProviders(<ProfileScreen />);

    expect(screen.getByText('Ana Silva')).toBeVisible();
    expect(screen.getByText('ana@petcard.com')).toBeVisible();
    expect(screen.getByText('11999990000')).toBeVisible();
  });

  it('entra em modo de edição com os campos preenchidos', () => {
    renderWithProviders(<ProfileScreen />);

    fireEvent.press(screen.getByLabelText('Editar perfil'));

    expect(screen.getByDisplayValue('Ana Silva')).toBeVisible();
    expect(screen.getByDisplayValue('11999990000')).toBeVisible();
  });

  it('salva o nome editado e atualiza a sessão', async () => {
    tutorService.updateCurrentTutor.mockResolvedValueOnce({
      ...mockUser,
      name: 'Ana Souza',
    });

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Editar perfil'));

    fireEvent.changeText(screen.getByLabelText('Nome'), 'Ana Souza');
    fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(tutorService.updateCurrentTutor).toHaveBeenCalledWith({
        name: 'Ana Souza',
        phone: '11999990000',
      }),
    );
    expect(mockUpdateUser).toHaveBeenCalledWith({ ...mockUser, name: 'Ana Souza' });

    // Sai do modo de edição depois de salvar.
    await waitFor(() => expect(screen.queryByLabelText('Nome')).toBeNull());
  });

  it('troca a foto, faz upload e envia profile_image_url no PATCH', async () => {
    // O S3 devolve a coluna como profileImageUrl (camelCase) — quem lê a
    // resposta e persiste na sessão é o que precisamos garantir que funcione
    // de ponta a ponta com a chave certa (profile_image_url).
    uploadService.uploadImage.mockResolvedValueOnce(
      'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    );
    tutorService.updateCurrentTutor.mockResolvedValueOnce({
      ...mockUser,
      profile_image_url: 'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    });

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Editar perfil'));

    // A escolha da foto é assíncrona (permissão + picker) — sem esperar essa
    // cadeia, o Salvar dispara antes do imageUri ser setado e o upload nunca
    // é chamado.
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Trocar foto'));
    });
    fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(uploadService.uploadImage).toHaveBeenCalledWith('file:///tmp/foto.jpg', 'tutors'),
    );
    expect(tutorService.updateCurrentTutor).toHaveBeenCalledWith({
      name: 'Ana Silva',
      phone: '11999990000',
      profile_image_url: 'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    });
    expect(mockUpdateUser).toHaveBeenCalledWith({
      ...mockUser,
      profile_image_url: 'https://bucket.s3.amazonaws.com/tutors/foto.jpg',
    });
  });

  it('avisa quando salvar falha', async () => {
    tutorService.updateCurrentTutor.mockRejectedValueOnce(new Error('rede caiu'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation();

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Editar perfil'));
    fireEvent.press(screen.getByText('Salvar'));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Erro',
        'Não foi possível salvar as alterações. Tente novamente.',
      ),
    );
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it('cancelar edição descarta as alterações', () => {
    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Editar perfil'));

    fireEvent.changeText(screen.getByLabelText('Nome'), 'Rascunho');
    fireEvent.press(screen.getByText('Cancelar'));

    expect(screen.getByText('Ana Silva')).toBeVisible();
    expect(screen.queryByText('Rascunho')).toBeNull();
  });

  it('exclui a conta só depois dos dois passos de confirmação', async () => {
    tutorService.deleteCurrentTutor.mockResolvedValueOnce(undefined);
    // O primeiro Alert dispara o segundo; o segundo dispara a exclusão de fato.
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _msg, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Excluir conta'));

    await waitFor(() => expect(tutorService.deleteCurrentTutor).toHaveBeenCalled());
    expect(alertSpy).toHaveBeenCalledTimes(2);
    expect(alertSpy).toHaveBeenNthCalledWith(
      1,
      'Excluir conta',
      'Tem certeza que deseja excluir sua conta?',
      expect.any(Array),
    );
    expect(alertSpy).toHaveBeenNthCalledWith(
      2,
      'Esta ação é irreversível',
      expect.stringContaining('Todos os seus pets'),
      expect.any(Array),
    );
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });

  it('não exclui a conta se o usuário cancelar no primeiro passo', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _msg, buttons) => {
      const cancel = buttons?.find((b) => b.style === 'cancel');
      cancel?.onPress?.();
    });

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Excluir conta'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(tutorService.deleteCurrentTutor).not.toHaveBeenCalled();
  });

  it('faz logout ao confirmar a saída', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation((title, _msg, buttons) => {
      const destructive = buttons?.find((b) => b.style === 'destructive');
      destructive?.onPress?.();
    });

    renderWithProviders(<ProfileScreen />);
    fireEvent.press(screen.getByLabelText('Sair da conta'));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
  });
});
