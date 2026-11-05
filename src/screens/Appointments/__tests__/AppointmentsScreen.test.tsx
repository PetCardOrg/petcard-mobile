import { Alert, type AlertButton } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from '../../../test/renderWithProviders';
import { mockRotaDeTeste } from '../../../test/mockRotaDeTeste';
import type { AppointmentResponse } from '../../../services/appointment.service';
import { AppointmentsScreen } from '../AppointmentsScreen';

// Fixa o comportamento da tela antes de dividi-la (AUD MOB-11): estes testes
// precisam passar iguais antes e depois do refactor.

const mockPets = [
  { id: 'p1', name: 'Rex', species: Species.DOG, sex: Sex.MALE },
] as unknown as PetResponseDto[];

jest.mock('../../../hooks/usePets', () => ({
  usePets: () => ({ pets: mockPets }),
}));

const mockAppointments = {
  getUpcoming: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
const mockCalendar = {
  getStatus: jest.fn(),
  getConnectUrl: jest.fn(),
  parseConnectOutcome: jest.fn(),
  disconnect: jest.fn(),
};

// Getters: a factory roda antes de as constantes acima existirem.
jest.mock('../../../services', () => ({
  get appointmentService() {
    return mockAppointments;
  },
  get calendarService() {
    return mockCalendar;
  },
}));

// O autocomplete fala com o Places e com a localização; aqui basta um campo.
jest.mock('../../../components/ui/PlaceAutocompleteInput', () => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const React = require('react');
  const { TextInput } = require('react-native');
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    PlaceAutocompleteInput: (props: { value: string; onChangeText: (t: string) => void }) =>
      React.createElement(TextInput, { ...props, testID: 'place-autocomplete-input' }),
  };
});

/** Amanhã às 10h, no fuso do aparelho. */
function amanhaAsDez(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

function agendamento(over: Partial<AppointmentResponse> = {}): AppointmentResponse {
  return {
    id: 'a1',
    title: 'Consulta de rotina',
    description: 'Levar a carteira',
    scheduled_at: amanhaAsDez().toISOString(),
    duration_minutes: 45,
    location: 'Clínica Amigo Fiel',
    pet_id: 'p1',
    pet_name: 'Rex',
    sync_status: 'SYNCED',
    created_at: '2026-10-01T00:00:00.000Z',
    updated_at: '2026-10-01T00:00:00.000Z',
    ...over,
  };
}

/** Botão de envio do formulário: o último "Agendar consulta" (o do estado vazio vem antes). */
function enviar() {
  fireEvent.press(screen.getAllByText('Agendar consulta').at(-1)!);
}

/** Aperta o botão do Alert com o rótulo dado, como o usuário faria. */
async function apertarNoAlerta(alerta: jest.SpyInstance, rotulo: string) {
  const botoes = alerta.mock.calls.at(-1)?.[2] as AlertButton[];
  const botao = botoes.find((b) => b.text === rotulo);
  // O onPress é assíncrono e mexe no estado da tela depois do await.
  await act(async () => {
    await botao?.onPress?.();
  });
}

describe('AppointmentsScreen', () => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    mockAppointments.getUpcoming.mockResolvedValue([]);
    mockAppointments.create.mockResolvedValue({});
    mockAppointments.update.mockResolvedValue({});
    mockAppointments.remove.mockResolvedValue(undefined);
    mockCalendar.getStatus.mockResolvedValue(false);
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('lista', () => {
    it('mostra o agendamento com data, hora, duração, local, pet e "Amanhã"', async () => {
      mockAppointments.getUpcoming.mockResolvedValue([agendamento()]);
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Consulta de rotina')).toBeTruthy();
      const dez = amanhaAsDez();
      const data = `${String(dez.getDate()).padStart(2, '0')}/${String(dez.getMonth() + 1).padStart(2, '0')}/${dez.getFullYear()}`;
      expect(screen.getByText(data)).toBeTruthy();
      expect(screen.getByText('10:00')).toBeTruthy();
      expect(screen.getByText('45 min')).toBeTruthy();
      expect(screen.getByText('Clínica Amigo Fiel')).toBeTruthy();
      expect(screen.getByText('Levar a carteira')).toBeTruthy();
      expect(screen.getByText('Rex')).toBeTruthy();
      expect(screen.getByText('Amanhã')).toBeTruthy();
    });

    it('mostra o estado vazio, que abre o formulário de criação', async () => {
      renderWithProviders(<AppointmentsScreen />);

      fireEvent.press(await screen.findByText('Agendar consulta'));

      expect(screen.getByText('Novo agendamento')).toBeTruthy();
    });

    it('mostra o erro de carga e tenta de novo', async () => {
      mockAppointments.getUpcoming.mockRejectedValueOnce(new Error('rede fora'));
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Não foi possível carregar os agendamentos.')).toBeTruthy();
      fireEvent.press(screen.getByText('Tentar novamente'));

      await waitFor(() => expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(2));
      expect(await screen.findByText('Nenhum agendamento')).toBeTruthy();
    });
  });

  describe('formulário', () => {
    it('cria o agendamento com os campos preenchidos e recarrega a lista', async () => {
      renderWithProviders(<AppointmentsScreen />);
      fireEvent.press(await screen.findByText('Agendar consulta'));

      fireEvent.changeText(
        screen.getByPlaceholderText('Ex: Consulta de rotina, Vacinação...'),
        '  Vacina anual  ',
      );
      fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '15032099');
      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '1030');
      fireEvent.press(screen.getByTestId('duration-option-30'));
      fireEvent.changeText(screen.getByTestId('place-autocomplete-input'), 'Clínica X');
      fireEvent.press(screen.getByText('Rex'));
      fireEvent.changeText(
        screen.getByPlaceholderText('Detalhes adicionais sobre a consulta...'),
        'Em jejum',
      );
      enviar();

      await waitFor(() =>
        expect(mockAppointments.create).toHaveBeenCalledWith({
          title: 'Vacina anual',
          description: 'Em jejum',
          scheduled_at: new Date('2099-03-15T10:30:00').toISOString(),
          duration_minutes: 30,
          location: 'Clínica X',
          pet_id: 'p1',
        }),
      );
      expect(alerta).toHaveBeenCalledWith('Sucesso', 'Agendamento criado com sucesso!');
      expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(2);
      expect(screen.queryByText('Novo agendamento')).toBeNull();
    });

    it('não envia sem título, data e hora', async () => {
      renderWithProviders(<AppointmentsScreen />);
      fireEvent.press(await screen.findByText('Agendar consulta'));

      enviar();

      expect(screen.getByText('Título é obrigatório')).toBeTruthy();
      expect(screen.getByText('Data é obrigatória')).toBeTruthy();
      expect(screen.getByText('Hora é obrigatória')).toBeTruthy();
      expect(mockAppointments.create).not.toHaveBeenCalled();
    });

    it('recusa hora inválida e horário que já passou', async () => {
      renderWithProviders(<AppointmentsScreen />);
      fireEvent.press(await screen.findByText('Agendar consulta'));
      fireEvent.changeText(
        screen.getByPlaceholderText('Ex: Consulta de rotina, Vacinação...'),
        'Vacina',
      );
      fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '01012020');

      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '2599');
      enviar();
      expect(screen.getByText('Hora inválida. Use HH:MM')).toBeTruthy();

      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '1000');
      enviar();
      expect(
        screen.getByText('Esse horário já passou. Escolha uma data e hora futuras.'),
      ).toBeTruthy();
      expect(mockAppointments.create).not.toHaveBeenCalled();
    });

    it('mantém o formulário aberto e avisa quando a criação falha', async () => {
      mockAppointments.create.mockRejectedValue(new Error('rede fora'));
      renderWithProviders(<AppointmentsScreen />);
      fireEvent.press(await screen.findByText('Agendar consulta'));
      fireEvent.changeText(
        screen.getByPlaceholderText('Ex: Consulta de rotina, Vacinação...'),
        'Vacina',
      );
      fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '15032099');
      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '1030');
      enviar();

      await waitFor(() =>
        expect(alerta).toHaveBeenCalledWith(
          'Erro',
          'Não foi possível criar o agendamento. Tente novamente.',
        ),
      );
      expect(screen.getByText('Novo agendamento')).toBeTruthy();
      expect(screen.getByDisplayValue('Vacina')).toBeTruthy();
    });

    it('edita: abre preenchido e envia ao update', async () => {
      const original = agendamento();
      mockAppointments.getUpcoming.mockResolvedValue([original]);
      renderWithProviders(<AppointmentsScreen />);

      fireEvent.press(await screen.findByText('Ionicons:create-outline'));

      expect(screen.getByText('Editar agendamento')).toBeTruthy();
      expect(screen.getByDisplayValue('Consulta de rotina')).toBeTruthy();
      expect(screen.getByDisplayValue('10:00')).toBeTruthy();
      expect(screen.getByDisplayValue('Clínica Amigo Fiel')).toBeTruthy();
      expect(screen.getByDisplayValue('Levar a carteira')).toBeTruthy();

      fireEvent.changeText(screen.getByDisplayValue('Consulta de rotina'), 'Retorno');
      fireEvent.press(screen.getByText('Salvar alterações'));

      await waitFor(() =>
        expect(mockAppointments.update).toHaveBeenCalledWith('a1', {
          title: 'Retorno',
          description: 'Levar a carteira',
          scheduled_at: original.scheduled_at,
          duration_minutes: 45,
          location: 'Clínica Amigo Fiel',
          pet_id: 'p1',
        }),
      );
      expect(alerta).toHaveBeenCalledWith('Sucesso', 'Agendamento atualizado com sucesso!');
      await waitFor(() => expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(2));
      expect(await screen.findByText('Consulta de rotina')).toBeTruthy();
    });

    it('depois de editar, "novo" abre o formulário em branco', async () => {
      mockAppointments.getUpcoming.mockResolvedValue([agendamento()]);
      renderWithProviders(<AppointmentsScreen />);
      fireEvent.press(await screen.findByText('Ionicons:create-outline'));
      fireEvent.press(screen.getByText('Ionicons:close'));

      fireEvent.press(screen.getByLabelText('Agendar consulta'));

      expect(screen.getByText('Novo agendamento')).toBeTruthy();
      expect(screen.queryByDisplayValue('Consulta de rotina')).toBeNull();
    });

    it('abre já com o local quando vem da tela de clínicas', async () => {
      mockRotaDeTeste.params = { prefill: { location: 'Petshop Central', _ts: 1 } };
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Novo agendamento')).toBeTruthy();
      expect(screen.getByDisplayValue('Petshop Central')).toBeTruthy();
    });
  });

  it('exclui depois de confirmar e recarrega a lista', async () => {
    mockAppointments.getUpcoming.mockResolvedValue([agendamento()]);
    renderWithProviders(<AppointmentsScreen />);

    fireEvent.press(await screen.findByText('Ionicons:trash-outline'));
    expect(alerta).toHaveBeenCalledWith(
      'Excluir agendamento',
      'Deseja excluir "Consulta de rotina"?',
      expect.any(Array),
    );
    await apertarNoAlerta(alerta, 'Excluir');

    await waitFor(() => expect(mockAppointments.remove).toHaveBeenCalledWith('a1'));
    await waitFor(() => expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(2));
  });

  describe('sincronização com o Google Agenda', () => {
    it('diz que o agendamento está na agenda quando foi sincronizado', async () => {
      mockCalendar.getStatus.mockResolvedValue(true);
      mockAppointments.getUpcoming.mockResolvedValue([agendamento({ sync_status: 'SYNCED' })]);
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Na sua agenda')).toBeTruthy();
    });

    it('diz que aguarda, quando o Google Agenda está conectado e o envio ainda não terminou', async () => {
      mockCalendar.getStatus.mockResolvedValue(true);
      mockAppointments.getUpcoming.mockResolvedValue([
        agendamento({ sync_status: 'PENDING_CREATE' }),
      ]);
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Aguardando sincronizar')).toBeTruthy();
    });

    // O tutor que agendou sem conectar não tinha como saber por que nada chegou
    // à agenda dele.
    it('pede para conectar quando o agendamento está pendente e o Google Agenda não', async () => {
      mockCalendar.getStatus.mockResolvedValue(false);
      mockAppointments.getUpcoming.mockResolvedValue([
        agendamento({ sync_status: 'PENDING_CREATE' }),
      ]);
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Conecte o Google Agenda para sincronizar')).toBeTruthy();
    });

    it('avisa quando o envio ao Google Agenda falhou', async () => {
      mockCalendar.getStatus.mockResolvedValue(true);
      mockAppointments.getUpcoming.mockResolvedValue([agendamento({ sync_status: 'FAILED' })]);
      renderWithProviders(<AppointmentsScreen />);

      expect(await screen.findByText('Não sincronizou com o Google Agenda')).toBeTruthy();
    });

    /** Cria um agendamento e devolve o que a tela agendou para daqui a pouco. */
    async function criarAgendamento(timers: jest.SpyInstance) {
      renderWithProviders(<AppointmentsScreen />);
      await screen.findByText('Consulta de rotina');
      fireEvent.press(screen.getByLabelText('Agendar consulta'));
      fireEvent.changeText(
        screen.getByPlaceholderText('Ex: Consulta de rotina, Vacinação...'),
        'Vacina anual',
      );
      fireEvent.changeText(screen.getByPlaceholderText('DD/MM/AAAA'), '15032099');
      fireEvent.changeText(screen.getByPlaceholderText('HH:MM'), '1030');
      enviar();
      await waitFor(() =>
        expect(alerta).toHaveBeenCalledWith('Sucesso', 'Agendamento criado com sucesso!'),
      );
      const reconferencia = timers.mock.calls.find(([, ms]) => ms === 4000);
      expect(reconferencia).toBeDefined();
      return reconferencia![0] as () => void;
    }

    // O envio corre em segundo plano: sem reconsultar, o cartão ficaria
    // "aguardando" para sempre e o banner não perceberia um token recusado.
    it('depois de salvar, reconsulta a lista e a conexão uma vez, em silêncio', async () => {
      const timers = jest.spyOn(global, 'setTimeout');
      mockCalendar.getStatus.mockResolvedValue(true);
      mockAppointments.getUpcoming.mockResolvedValue([
        agendamento({ sync_status: 'PENDING_CREATE' }),
      ]);

      const reconferir = await criarAgendamento(timers);
      // Carga inicial e recarga logo depois de salvar; a conexão foi lida ao abrir.
      expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(2);
      expect(mockCalendar.getStatus).toHaveBeenCalledTimes(1);

      mockAppointments.getUpcoming.mockResolvedValue([agendamento({ sync_status: 'SYNCED' })]);
      await act(async () => {
        reconferir();
      });

      expect(mockAppointments.getUpcoming).toHaveBeenCalledTimes(3);
      expect(mockCalendar.getStatus).toHaveBeenCalledTimes(2);
      expect(await screen.findByText('Na sua agenda')).toBeTruthy();
    });

    it('se a reconsulta de fundo falhar, mantém a lista em vez de mostrar erro', async () => {
      const timers = jest.spyOn(global, 'setTimeout');
      mockCalendar.getStatus.mockResolvedValue(true);
      mockAppointments.getUpcoming.mockResolvedValue([
        agendamento({ sync_status: 'PENDING_CREATE' }),
      ]);

      const reconferir = await criarAgendamento(timers);
      mockAppointments.getUpcoming.mockRejectedValue(new Error('rede fora'));
      await act(async () => {
        reconferir();
      });

      expect(screen.getByText('Consulta de rotina')).toBeTruthy();
      expect(screen.queryByText('Não foi possível carregar os agendamentos.')).toBeNull();
    });
  });

  describe('Google Agenda', () => {
    it('conecta e mostra a confirmação', async () => {
      mockCalendar.getConnectUrl.mockResolvedValue('https://accounts.google.com/x');
      jest
        .mocked(WebBrowser.openAuthSessionAsync)
        .mockResolvedValue({ type: 'success', url: 'petcard:///?calendar=connected' });
      mockCalendar.parseConnectOutcome.mockReturnValue('connected');
      renderWithProviders(<AppointmentsScreen />);

      await screen.findByText('Nenhum agendamento');
      fireEvent.press(screen.getByText('Conectar'));

      expect(await screen.findByText('Google Agenda conectado')).toBeTruthy();
      expect(screen.getByText('Google Agenda conectado!')).toBeTruthy();
      expect(mockCalendar.getConnectUrl).toHaveBeenCalledWith('petcard:///');
    });

    it('avisa quando o tutor não autoriza', async () => {
      mockCalendar.getConnectUrl.mockResolvedValue('https://accounts.google.com/x');
      jest
        .mocked(WebBrowser.openAuthSessionAsync)
        .mockResolvedValue({ type: 'success', url: 'petcard:///?calendar=denied' });
      mockCalendar.parseConnectOutcome.mockReturnValue('denied');
      renderWithProviders(<AppointmentsScreen />);

      await screen.findByText('Nenhum agendamento');
      fireEvent.press(screen.getByText('Conectar'));

      await waitFor(() =>
        expect(alerta).toHaveBeenCalledWith(
          'Conexão cancelada',
          'Você não autorizou o acesso ao Google Agenda. Tente de novo quando quiser.',
        ),
      );
    });

    it('consulta o status quando a aba é fechada à mão', async () => {
      mockCalendar.getConnectUrl.mockResolvedValue('https://accounts.google.com/x');
      // O enum WebBrowserResultType não existe no mock do jest.setup; o literal basta.
      jest
        .mocked(WebBrowser.openAuthSessionAsync)
        .mockResolvedValue({ type: 'dismiss' } as WebBrowser.WebBrowserAuthSessionResult);
      renderWithProviders(<AppointmentsScreen />);
      await screen.findByText('Nenhum agendamento');
      fireEvent.press(screen.getByText('Conectar'));

      await waitFor(() => expect(mockCalendar.getStatus).toHaveBeenCalledTimes(2));
    });

    it('avisa quando a integração não está configurada', async () => {
      mockCalendar.getConnectUrl.mockResolvedValue(null);
      renderWithProviders(<AppointmentsScreen />);

      await screen.findByText('Nenhum agendamento');
      fireEvent.press(screen.getByText('Conectar'));

      await waitFor(() =>
        expect(alerta).toHaveBeenCalledWith(
          'Erro',
          'Integração com Google Calendar não configurada.',
        ),
      );
    });

    it('desconecta depois de confirmar', async () => {
      mockCalendar.getStatus.mockResolvedValue(true);
      mockCalendar.disconnect.mockResolvedValue(undefined);
      renderWithProviders(<AppointmentsScreen />);

      await screen.findByText('Nenhum agendamento');
      fireEvent.press(screen.getByText('Ionicons:close-circle-outline'));
      await apertarNoAlerta(alerta, 'Desconectar');

      expect(mockCalendar.disconnect).toHaveBeenCalled();
      expect(await screen.findByText('Google Agenda não conectado')).toBeTruthy();
    });
  });
});
