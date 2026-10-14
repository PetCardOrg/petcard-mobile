import {
  renderWithProviders,
  screen,
  fireEvent,
  waitFor,
  act,
} from '../../../test/renderWithProviders';
import { RegisterScreen } from '../RegisterScreen';

const mockRegister = jest.fn();
const mockGoBack = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ register: mockRegister, isLoading: false }),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file:///tmp/foto.jpg' }],
  }),
}));

function preencherCamposObrigatorios(senha = 'Senha1234!', confirmacao = senha) {
  fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Ana Silva');
  fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
  fireEvent.changeText(screen.getByPlaceholderText('Mínimo 8 caracteres'), senha);
  fireEvent.changeText(screen.getByPlaceholderText('Digite a senha novamente'), confirmacao);
}

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exige senha de pelo menos 8 caracteres', () => {
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios('Curta1!');

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeVisible();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('exige senha com maiúscula, número e caractere especial', () => {
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios('senhafraca');

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('A senha deve conter ao menos uma letra maiúscula.')).toBeVisible();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('barra nome muito curto sem chamar a api', () => {
    renderWithProviders(<RegisterScreen />);
    fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'A');
    fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
    fireEvent.changeText(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Senha1234!');
    fireEvent.changeText(screen.getByPlaceholderText('Digite a senha novamente'), 'Senha1234!');

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('O nome deve ter pelo menos 2 caracteres.')).toBeVisible();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('barra senhas divergentes sem chamar a api', () => {
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios('Senha1234!', 'Outra1234!');

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('As senhas não coincidem.')).toBeVisible();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('cadastra com os dados básicos, sem telefone nem foto', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('Ana Silva', 'ana@petcard.com', 'Senha1234!', {
        phone: undefined,
        photoUri: undefined,
      }),
    );
  });

  it('cadastra com telefone e foto quando informados', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();
    fireEvent.changeText(screen.getByPlaceholderText('(00) 00000-0000'), '11999990000');

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Adicionar foto'));
    });
    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('Ana Silva', 'ana@petcard.com', 'Senha1234!', {
        phone: '11999990000',
        photoUri: 'file:///tmp/foto.jpg',
      }),
    );
  });

  it('avisa em português que o e-mail já está cadastrado (409)', async () => {
    mockRegister.mockRejectedValueOnce(
      Object.assign(new Error('409'), {
        isAxiosError: true,
        response: { status: 409, data: { message: 'Email already registered' } },
      }),
    );

    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();
    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(
        screen.getByText('Este e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.'),
      ).toBeVisible(),
    );
    expect(screen.queryByText('Email already registered')).toBeNull();
  });

  it('traduz os demais erros da api sem mostrar o texto em inglês', async () => {
    mockRegister.mockRejectedValueOnce(
      Object.assign(new Error('400'), {
        isAxiosError: true,
        response: { status: 400, data: { message: ['phone must be a phone number'] } },
      }),
    );

    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();
    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(screen.getByText('Confira os dados informados e tente novamente.')).toBeVisible(),
    );
    expect(screen.queryByText('phone must be a phone number')).toBeNull();
  });

  it('volta para o login pelo link secundário', () => {
    renderWithProviders(<RegisterScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Já tenho conta' }));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
