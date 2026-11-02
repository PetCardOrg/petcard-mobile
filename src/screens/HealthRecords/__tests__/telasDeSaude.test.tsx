import type { ComponentType } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { Sex, Species, type PetResponseDto } from '@petcardorg/shared';

import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from '../../../test/renderWithProviders';
import { SelectedPetProvider } from '../../../contexts/SelectedPetContext';
import { DewormingScreen } from '../DewormingScreen';
import { MedicationScreen } from '../MedicationScreen';
import { VaccineScreen } from '../VaccineScreen';

// Fixa o comportamento das três telas de saúde antes de juntá-las num
// componente genérico (AUD MOB-06): estes testes precisam passar iguais
// antes e depois.

const mockPets = [
  { id: 'p1', name: 'Rex', species: Species.DOG, sex: Sex.MALE },
] as unknown as PetResponseDto[];

jest.mock('../../../hooks/usePets', () => ({
  usePets: () => ({ pets: mockPets, isLoading: false }),
}));

const mockVacina = {
  getVaccinesByPet: jest.fn(),
  createVaccine: jest.fn(),
  updateVaccine: jest.fn(),
  deleteVaccine: jest.fn(),
};
const mockVermifugo = {
  getDewormingsByPet: jest.fn(),
  createDeworming: jest.fn(),
  updateDeworming: jest.fn(),
  deleteDeworming: jest.fn(),
};
const mockMedicacao = {
  getMedicationsByPet: jest.fn(),
  createMedication: jest.fn(),
  updateMedication: jest.fn(),
  deleteMedication: jest.fn(),
};

// Getters: a factory roda antes de as constantes acima existirem.
jest.mock('../../../services', () => ({
  get vaccineService() {
    return mockVacina;
  },
  get dewormingService() {
    return mockVermifugo;
  },
  get medicationService() {
    return mockMedicacao;
  },
  anexoService: {},
}));

type Caso = {
  tela: string;
  Tela: ComponentType;
  carregar: jest.Mock;
  criar: jest.Mock;
  atualizar: jest.Mock;
  apagar: jest.Mock;
  /** Registro do tutor, como a API devolve. */
  registro: Record<string, unknown> & { id: string };
  nome: string;
  /** Textos do card além do nome. */
  noCard: (string | RegExp)[];
  vazio: string;
  novoTitulo: string;
  editarTitulo: string;
  enviar: string;
  /** Placeholder → texto digitado, na ordem do formulário. */
  preencher: [string, string][];
  criado: Record<string, unknown>;
  /** Placeholder do nome, para trocar na edição. */
  campoNome: string;
  atualizado: Record<string, unknown>;
  obrigatorios: string[];
  sucessoCriar: string;
  sucessoEditar: string;
  excluirTitulo: string;
  /** Rótulo do botão que confirma a exclusão: difere entre as telas. */
  confirmarExclusao: string;
};

const base = {
  pet_id: 'p1',
  notes: 'Sem reação',
  anexos: [],
  created_at: '2026-09-01T00:00:00.000Z',
  updated_at: '2026-09-01T00:00:00.000Z',
};

const casos: Caso[] = [
  {
    tela: 'vacinas',
    Tela: VaccineScreen,
    carregar: mockVacina.getVaccinesByPet,
    criar: mockVacina.createVaccine,
    atualizar: mockVacina.updateVaccine,
    apagar: mockVacina.deleteVaccine,
    registro: {
      ...base,
      id: 'v1',
      vaccine_name: 'V10',
      applied_at: '2026-09-05',
      next_dose_at: '2027-09-05',
      veterinarian_name: 'Dra. Ana',
    },
    nome: 'V10',
    noCard: ['Aplicada em 05/09/2026', 'Próxima dose: 05/09/2027', 'Dra. Ana'],
    vazio: 'Adicionar vacina',
    novoTitulo: 'Nova vacina',
    editarTitulo: 'Editar vacina',
    enviar: 'Registrar vacina',
    preencher: [
      ['Ex: V10, Antirrábica, Gripe...', '  Antirrábica  '],
      ['DD/MM/AAAA', '01102026'],
      ['Nome do veterinário', 'Dr. Beto'],
      ['Observações adicionais...', 'Braço esquerdo'],
    ],
    criado: {
      pet_id: 'p1',
      vaccine_name: 'Antirrábica',
      applied_at: '2026-10-01',
      veterinarian_name: 'Dr. Beto',
      notes: 'Braço esquerdo',
    },
    campoNome: 'Ex: V10, Antirrábica, Gripe...',
    atualizado: {
      vaccine_name: 'V8',
      applied_at: '2026-09-05',
      next_dose_at: '2027-09-05',
      veterinarian_name: 'Dra. Ana',
      notes: 'Sem reação',
    },
    obrigatorios: ['Nome da vacina é obrigatório', 'Data de aplicação é obrigatória'],
    sucessoCriar: 'Vacina registrada com sucesso!',
    sucessoEditar: 'Vacina atualizada com sucesso!',
    excluirTitulo: 'Excluir vacina',
    confirmarExclusao: 'Excluir',
  },
  {
    tela: 'vermífugos',
    Tela: DewormingScreen,
    carregar: mockVermifugo.getDewormingsByPet,
    criar: mockVermifugo.createDeworming,
    atualizar: mockVermifugo.updateDeworming,
    apagar: mockVermifugo.deleteDeworming,
    registro: {
      ...base,
      id: 'd1',
      product_name: 'Drontal',
      applied_at: '2026-09-05',
      next_dose_at: '2026-12-05',
      veterinarian_name: 'Dra. Ana',
    },
    nome: 'Drontal',
    noCard: ['Aplicado em 05/09/2026', 'Próxima dose: 05/12/2026', 'Dra. Ana'],
    vazio: 'Adicionar vermífugo',
    novoTitulo: 'Novo vermífugo',
    editarTitulo: 'Editar vermífugo',
    enviar: 'Registrar vermífugo',
    preencher: [
      ['Ex: Drontal, Milbemax...', 'Milbemax'],
      ['DD/MM/AAAA', '01102026'],
      ['Observações adicionais...', '  '],
    ],
    criado: { pet_id: 'p1', product_name: 'Milbemax', applied_at: '2026-10-01' },
    campoNome: 'Ex: Drontal, Milbemax...',
    atualizado: {
      product_name: 'V8',
      applied_at: '2026-09-05',
      next_dose_at: '2026-12-05',
      veterinarian_name: 'Dra. Ana',
      notes: 'Sem reação',
    },
    obrigatorios: ['Nome do produto é obrigatório', 'Data de aplicação é obrigatória'],
    sucessoCriar: 'Vermífugo registrado com sucesso!',
    sucessoEditar: 'Vermífugo atualizado com sucesso!',
    excluirTitulo: 'Excluir vermífugo',
    confirmarExclusao: 'Excluir vermífugo',
  },
  {
    tela: 'medicações',
    Tela: MedicationScreen,
    carregar: mockMedicacao.getMedicationsByPet,
    criar: mockMedicacao.createMedication,
    atualizar: mockMedicacao.updateMedication,
    apagar: mockMedicacao.deleteMedication,
    registro: {
      ...base,
      id: 'm1',
      medication_name: 'Prednisolona',
      dosage: '5mg',
      frequency: '2x ao dia',
      start_date: '2026-09-05',
      end_date: '2026-09-12',
    },
    nome: 'Prednisolona',
    noCard: ['5mg — 2x ao dia', /Início: 05\/09\/2026/, /Término: 12\/09\/2026/, 'Sem reação'],
    vazio: 'Adicionar medicação',
    novoTitulo: 'Nova medicação',
    editarTitulo: 'Editar medicação',
    enviar: 'Registrar medicação',
    preencher: [
      ['Ex: Prednisolona, Omeprazol...', 'Omeprazol'],
      ['Ex: 5mg', ' 10mg '],
      ['Ex: 2x ao dia', '1x ao dia'],
      ['DD/MM/AAAA', '01102026'],
    ],
    criado: {
      pet_id: 'p1',
      medication_name: 'Omeprazol',
      dosage: '10mg',
      frequency: '1x ao dia',
      start_date: '2026-10-01',
    },
    campoNome: 'Ex: Prednisolona, Omeprazol...',
    atualizado: {
      medication_name: 'V8',
      dosage: '5mg',
      frequency: '2x ao dia',
      start_date: '2026-09-05',
      end_date: '2026-09-12',
      notes: 'Sem reação',
    },
    obrigatorios: [
      'Nome da medicação é obrigatório',
      'Dosagem é obrigatória',
      'Frequência é obrigatória',
      'Data de início é obrigatória',
    ],
    sucessoCriar: 'Medicação registrada com sucesso!',
    sucessoEditar: 'Medicação atualizada com sucesso!',
    excluirTitulo: 'Excluir medicação',
    confirmarExclusao: 'Excluir medicação',
  },
];

/** Aperta o botão do Alert com o rótulo dado, como o usuário faria. */
async function apertarNoAlerta(alerta: jest.SpyInstance, rotulo: string) {
  const botoes = alerta.mock.calls.at(-1)?.[2] as AlertButton[];
  const botao = botoes.find((b) => b.text === rotulo);
  await act(async () => {
    await botao?.onPress?.();
  });
}

describe.each(casos)('tela de $tela', (caso) => {
  let alerta: jest.SpyInstance;

  beforeEach(() => {
    caso.carregar.mockResolvedValue([]);
    caso.criar.mockResolvedValue({});
    caso.atualizar.mockResolvedValue({});
    caso.apagar.mockResolvedValue(undefined);
    alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Renderiza a tela já com o Rex escolhido e a lista carregada. */
  async function abrirNoRex(registros: unknown[] = []) {
    caso.carregar.mockResolvedValue(registros);
    renderWithProviders(
      <SelectedPetProvider>
        <caso.Tela />
      </SelectedPetProvider>,
    );
    fireEvent.press(screen.getByText('Rex'));
    await waitFor(() => expect(caso.carregar).toHaveBeenCalledWith('p1'));
    if (registros.length) await screen.findByText(caso.nome);
    else await screen.findByText(caso.vazio);
  }

  it('mostra o registro no card', async () => {
    await abrirNoRex([caso.registro]);

    for (const texto of caso.noCard) expect(screen.getByText(texto)).toBeTruthy();
  });

  it('cria com os campos preenchidos e recarrega a lista', async () => {
    await abrirNoRex();
    fireEvent.press(screen.getByText(caso.vazio));
    expect(screen.getByText(caso.novoTitulo)).toBeTruthy();

    for (const [placeholder, texto] of caso.preencher) {
      fireEvent.changeText(screen.getAllByPlaceholderText(placeholder)[0], texto);
    }
    fireEvent.press(screen.getByText(caso.enviar));

    await waitFor(() => expect(caso.criar).toHaveBeenCalledWith(caso.criado));
    expect(alerta).toHaveBeenCalledWith('Sucesso', caso.sucessoCriar);
    await waitFor(() => expect(caso.carregar).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(caso.novoTitulo)).toBeNull();
  });

  it('não envia sem os campos obrigatórios', async () => {
    await abrirNoRex();
    fireEvent.press(screen.getByText(caso.vazio));

    fireEvent.press(screen.getByText(caso.enviar));

    for (const msg of caso.obrigatorios) expect(screen.getByText(msg)).toBeTruthy();
    expect(caso.criar).not.toHaveBeenCalled();
  });

  it('recusa data inválida', async () => {
    await abrirNoRex();
    fireEvent.press(screen.getByText(caso.vazio));

    fireEvent.changeText(screen.getAllByPlaceholderText('DD/MM/AAAA')[0], '31022026');
    fireEvent.press(screen.getByText(caso.enviar));

    expect(screen.getByText('Data inválida. Use DD/MM/AAAA')).toBeTruthy();
  });

  it('mantém o formulário aberto quando a criação falha', async () => {
    caso.criar.mockRejectedValue(new Error('rede fora'));
    await abrirNoRex();
    fireEvent.press(screen.getByText(caso.vazio));
    for (const [placeholder, texto] of caso.preencher) {
      fireEvent.changeText(screen.getAllByPlaceholderText(placeholder)[0], texto);
    }

    fireEvent.press(screen.getByText(caso.enviar));

    await waitFor(() => expect(alerta).toHaveBeenCalledWith('Erro', expect.any(String)));
    expect(screen.getByText(caso.novoTitulo)).toBeTruthy();
  });

  it('edita: abre preenchido e envia ao update', async () => {
    await abrirNoRex([caso.registro]);

    fireEvent.press(screen.getByText('Ionicons:create-outline'));
    expect(screen.getByText(caso.editarTitulo)).toBeTruthy();
    expect(screen.getByDisplayValue(caso.nome)).toBeTruthy();
    expect(screen.getByDisplayValue('05/09/2026')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText(caso.campoNome), 'V8');
    fireEvent.press(screen.getByText('Salvar alterações'));

    await waitFor(() =>
      expect(caso.atualizar).toHaveBeenCalledWith(caso.registro.id, caso.atualizado),
    );
    expect(alerta).toHaveBeenCalledWith('Sucesso', caso.sucessoEditar);
    await waitFor(() => expect(caso.carregar).toHaveBeenCalledTimes(2));
  });

  it('depois de editar, "novo" abre o formulário em branco', async () => {
    await abrirNoRex([caso.registro]);
    fireEvent.press(screen.getByText('Ionicons:create-outline'));
    fireEvent.press(screen.getByText('Ionicons:close'));

    fireEvent.press(screen.getByLabelText(caso.vazio));

    expect(screen.getByText(caso.novoTitulo)).toBeTruthy();
    expect(screen.queryByDisplayValue(caso.nome)).toBeNull();
  });

  it('exclui depois de confirmar e recarrega a lista', async () => {
    await abrirNoRex([caso.registro]);

    fireEvent.press(screen.getByText('Ionicons:trash-outline'));
    expect(alerta).toHaveBeenCalledWith(
      caso.excluirTitulo,
      `Deseja excluir o registro de "${caso.nome}"?`,
      expect.any(Array),
    );
    await apertarNoAlerta(alerta, caso.confirmarExclusao);

    expect(caso.apagar).toHaveBeenCalledWith(caso.registro.id);
    await waitFor(() => expect(caso.carregar).toHaveBeenCalledTimes(2));
  });

  describe('registro de veterinário', () => {
    const doVet = () => ({
      ...caso.registro,
      veterinario_id: 'vet-1',
      veterinario_crmv: 'CE 123',
      veterinarian_name: 'Dra. Ana',
    });

    it('avisa antes de editar', async () => {
      await abrirNoRex([doVet()]);

      fireEvent.press(screen.getByText('Ionicons:create-outline'));

      expect(alerta.mock.calls[0][0]).toBe('Registro do veterinário');
      expect(screen.queryByText(caso.editarTitulo)).toBeNull();
      await apertarNoAlerta(alerta, 'Continuar');
      expect(screen.getByText(caso.editarTitulo)).toBeTruthy();
    });

    it('troca o texto da confirmação ao apagar', async () => {
      await abrirNoRex([doVet()]);

      fireEvent.press(screen.getByText('Ionicons:trash-outline'));

      expect(alerta).toHaveBeenCalledTimes(1);
      expect(alerta.mock.calls[0][0]).toBe('Apagar registro do veterinário?');
      await apertarNoAlerta(alerta, 'Excluir');
      expect(caso.apagar).toHaveBeenCalledWith(caso.registro.id);
    });
  });
});

describe('selo da medicação', () => {
  beforeEach(() => {
    jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marca em andamento sem término e concluída com término passado', async () => {
    mockMedicacao.getMedicationsByPet.mockResolvedValue([
      { ...casos[2].registro, id: 'm1', end_date: undefined },
      { ...casos[2].registro, id: 'm2', medication_name: 'Antigo', end_date: '2020-01-10' },
    ]);
    renderWithProviders(
      <SelectedPetProvider>
        <MedicationScreen />
      </SelectedPetProvider>,
    );
    fireEvent.press(screen.getByText('Rex'));

    expect(await screen.findByText('Em andamento')).toBeTruthy();
    expect(screen.getByText('Concluída')).toBeTruthy();
  });
});
