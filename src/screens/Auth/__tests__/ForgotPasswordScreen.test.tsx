import { renderWithProviders, screen, fireEvent, waitFor } from '../../../test/renderWithProviders';
import { ForgotPasswordScreen } from '../ForgotPasswordScreen';

const mockForgotPassword = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ forgotPassword: mockForgotPassword }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('ForgotPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não envia sem e-mail', () => {
    renderWithProviders(<ForgotPasswordScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Enviar link' }));

    expect(screen.getByText('Informe o e-mail.')).toBeVisible();
    expect(mockForgotPassword).not.toHaveBeenCalled();
  });

  it('envia o pedido e mostra a mensagem neutra', async () => {
    mockForgotPassword.mockResolvedValueOnce(undefined);
    renderWithProviders(<ForgotPasswordScreen />);

    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
    fireEvent.press(screen.getByRole('button', { name: 'Enviar link' }));

    await waitFor(() => expect(mockForgotPassword).toHaveBeenCalledWith('ana@petcard.com'));
    expect(await screen.findByText(/enviamos um link para redefinir a senha/i)).toBeVisible();
  });
});
