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

function preencherCamposObrigatorios(senha = 'senha1234') {
  fireEvent.changeText(screen.getByPlaceholderText('Seu nome completo'), 'Ana Silva');
  fireEvent.changeText(screen.getByPlaceholderText('seu@email.com'), 'ana@petcard.com');
  fireEvent.changeText(screen.getByPlaceholderText('Mínimo 8 caracteres'), senha);
}

describe('RegisterScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exige senha de pelo menos 8 caracteres', () => {
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios('curta12');

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('A senha deve ter no mínimo 8 caracteres.')).toBeVisible();
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('cadastra com os dados básicos, sem telefone nem foto', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();

    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() =>
      expect(mockRegister).toHaveBeenCalledWith('Ana Silva', 'ana@petcard.com', 'senha1234', {
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
      expect(mockRegister).toHaveBeenCalledWith('Ana Silva', 'ana@petcard.com', 'senha1234', {
        phone: '11999990000',
        photoUri: 'file:///tmp/foto.jpg',
      }),
    );
  });

  it('mostra a mensagem de erro devolvida pela api', async () => {
    mockRegister.mockRejectedValueOnce(
      Object.assign(new Error('409'), {
        isAxiosError: true,
        response: { data: { message: 'Email already registered' } },
      }),
    );

    renderWithProviders(<RegisterScreen />);
    preencherCamposObrigatorios();
    fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));

    await waitFor(() => expect(screen.getByText('Email already registered')).toBeVisible());
  });

  it('volta para o login pelo link secundário', () => {
    renderWithProviders(<RegisterScreen />);

    fireEvent.press(screen.getByRole('button', { name: 'Já tenho conta' }));

    expect(mockGoBack).toHaveBeenCalled();
  });
});
