import { Alert } from 'react-native';
import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/renderWithProviders';
import { ResetPasswordScreen } from '../ResetPasswordScreen';

const mockResetPassword = jest.fn();
const mockNavigate = jest.fn();
let mockRouteParams: { token?: string } | undefined;

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ resetPassword: mockResetPassword }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useRoute: () => ({ params: mockRouteParams }),
}));

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteParams = undefined;
  });

  function preencher(senha: string, confirmacao = senha, token = 'tok-123') {
    if (!mockRouteParams?.token) {
      fireEvent.changeText(screen.getByPlaceholderText('Cole o código recebido por e-mail'), token);
    }
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 8 caracteres'), senha);
    fireEvent.changeText(screen.getByPlaceholderText('Digite a senha novamente'), confirmacao);
  }

  it('exige senha forte antes de chamar a api', () => {
    renderWithProviders(<ResetPasswordScreen />);
    preencher('fraca');

    fireEvent.press(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeVisible();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('barra senhas divergentes', () => {
    renderWithProviders(<ResetPasswordScreen />);
    preencher('NovaSenha1!', 'OutraSenha1!');

    fireEvent.press(screen.getByRole('button', { name: 'Redefinir senha' }));

    expect(screen.getByText('As senhas não coincidem.')).toBeVisible();
    expect(mockResetPassword).not.toHaveBeenCalled();
  });

  it('redefine a senha com o token do deep link', async () => {
    mockRouteParams = { token: 'deep-link-token' };
    mockResetPassword.mockResolvedValueOnce(undefined);
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

    renderWithProviders(<ResetPasswordScreen />);
    preencher('NovaSenha1!');

    fireEvent.press(screen.getByRole('button', { name: 'Redefinir senha' }));

    await waitFor(() =>
      expect(mockResetPassword).toHaveBeenCalledWith('deep-link-token', 'NovaSenha1!'),
    );
    expect(alertSpy).toHaveBeenCalled();
  });
});
