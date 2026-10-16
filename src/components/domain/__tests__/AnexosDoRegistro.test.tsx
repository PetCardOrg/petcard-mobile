import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';

import { fireEvent, renderWithProviders, screen, waitFor } from '../../../test/renderWithProviders';
import { AnexosDoRegistro } from '../AnexosDoRegistro';

const mockUpload = jest.fn();
const mockLink = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../../services', () => ({
  anexoService: {
    uploadAnexo: (...args: unknown[]) => mockUpload(...args) as unknown,
    getLinkDoAnexo: (id: string) => mockLink(id) as unknown,
    deleteAnexo: (id: string) => mockDelete(id) as unknown,
  },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const picker = ImagePicker as jest.Mocked<typeof ImagePicker>;

const verificado = {
  id: 'a1',
  nome_arquivo: 'carteirinha.jpg',
  mime_type: 'image/jpeg',
  tamanho_bytes: 2048,
  enviado_por_nome: 'Dra. Camila',
  verificado: true,
  verificado_por_nome: 'Dra. Camila',
  verificado_por_crmv: 'CRMV-SP 12345',
};
const pendente = {
  id: 'a2',
  nome_arquivo: 'receita.pdf',
  mime_type: 'application/pdf',
  tamanho_bytes: 4096,
  enviado_por_nome: 'Ana',
  verificado: false,
};

function renderizar(anexos: unknown[] = [], onChanged = jest.fn()) {
  renderWithProviders(
    <AnexosDoRegistro
      anexos={anexos as never}
      entidade="VACINA"
      entidadeId="v1"
      onChanged={onChanged}
      petId="p1"
    />,
  );
  return onChanged;
}

describe('AnexosDoRegistro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
  });

  it('distingue o comprovante verificado do que aguarda verificação', () => {
    renderizar([verificado, pendente]);

    expect(screen.getByTestId('anexo-verificado-a1')).toBeVisible();
    expect(screen.getByText('Verificado por Dra. Camila (CRMV-SP 12345)')).toBeVisible();
    expect(screen.getByTestId('anexo-pendente-a2')).toBeVisible();
    expect(screen.getByText('Aguardando verificação do veterinário')).toBeVisible();
  });

  it('anexa a foto escolhida, com o tipo deduzido, e recarrega o registro', async () => {
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/vacina.PNG', fileName: 'vacina.PNG', fileSize: 1000 }],
    } as never);
    mockUpload.mockResolvedValue({});
    const onChanged = renderizar();

    fireEvent.press(screen.getByTestId('anexo-adicionar-v1'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(mockUpload).toHaveBeenCalledWith(
      'p1',
      { entidade: 'VACINA', entidadeId: 'v1' },
      { uri: 'file:///tmp/vacina.PNG', name: 'vacina.PNG', mimeType: 'image/png' },
    );
  });

  it('não envia formato que a API recusaria nem arquivo acima de 10 MB', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    renderizar();

    picker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/foto.heic', fileName: 'foto.heic' }],
    } as never);
    fireEvent.press(screen.getByTestId('anexo-adicionar-v1'));
    await waitFor(() => expect(alerta).toHaveBeenCalledTimes(1));

    picker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.jpg', fileName: 'a.jpg', fileSize: 11 * 1024 * 1024 }],
    } as never);
    fireEvent.press(screen.getByTestId('anexo-adicionar-v1'));
    await waitFor(() => expect(alerta).toHaveBeenCalledTimes(2));

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('sem permissão da galeria, não abre o seletor', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    picker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);
    renderizar();

    fireEvent.press(screen.getByTestId('anexo-adicionar-v1'));

    await waitFor(() => expect(alerta).toHaveBeenCalled());
    expect(picker.launchImageLibraryAsync).not.toHaveBeenCalled();
  });

  it('mostra o motivo que a API devolveu quando o envio é recusado', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    picker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///tmp/a.jpg', fileName: 'a.jpg' }],
    } as never);
    mockUpload.mockRejectedValue(
      Object.assign(new Error('x'), {
        isAxiosError: true,
        response: { data: { message: 'Cada registro aceita no máximo 10 comprovantes.' } },
      }),
    );
    const onChanged = renderizar();

    fireEvent.press(screen.getByTestId('anexo-adicionar-v1'));

    await waitFor(() =>
      expect(alerta).toHaveBeenCalledWith(
        'Erro',
        'Cada registro aceita no máximo 10 comprovantes.',
      ),
    );
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('abre o arquivo pelo link temporário da API', async () => {
    mockLink.mockResolvedValue({ url: 'https://s3.example/assinado' });
    renderizar([pendente]);

    fireEvent.press(screen.getByTestId('anexo-abrir-a2'));

    await waitFor(() =>
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith('https://s3.example/assinado'),
    );
    expect(mockLink).toHaveBeenCalledWith('a2');
  });

  it('só remove depois de confirmar, e avisa quando havia verificação', async () => {
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    mockDelete.mockResolvedValue(undefined);
    const onChanged = renderizar([verificado]);

    fireEvent.press(screen.getByTestId('anexo-remover-a1'));

    expect(mockDelete).not.toHaveBeenCalled();
    const [, mensagem, botoes] = alerta.mock.calls[0] as [
      string,
      string,
      { text: string; onPress?: () => void }[],
    ];
    expect(mensagem).toContain('verificado por um veterinário');
    botoes.find((b) => b.onPress)!.onPress!();

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });
});
