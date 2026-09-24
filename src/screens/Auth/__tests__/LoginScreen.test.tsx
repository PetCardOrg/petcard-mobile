import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/renderWithProviders';
import { LoginScreen } from '../LoginScreen';

const mockLogin = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, isLoading: false }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('LoginScreen', () => {
  it('valida campos vazios sem chamar login', () => {
    renderWithProviders(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    expect(screen.getByText('Preencha email e senha.')).toBeVisible();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('autentica com as credenciais informadas', async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
    fireEvent.changeText(screen.getByPlaceholderText('Sua senha'), 'senha123');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('ana@petcard.com', 'senha123'));
  });

  it('exibe mensagem de erro quando o login falha', async () => {
    mockLogin.mockRejectedValueOnce(new Error('401'));
    renderWithProviders(<LoginScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
    fireEvent.changeText(screen.getByPlaceholderText('Sua senha'), 'errada');
    fireEvent.press(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() =>
      expect(screen.getByText('Email ou senha incorretos. Tente novamente.')).toBeVisible(),
    );
  });

  it('navega para o cadastro pelo link secundário', () => {
    renderWithProviders(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Criar conta' }));

    expect(mockNavigate).toHaveBeenCalledWith('Register');
  });

  it('leva para a recuperação de senha', () => {
    renderWithProviders(<LoginScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Esqueci minha senha' }));

    expect(mockNavigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
