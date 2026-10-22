import { renderWithProviders, screen } from '../../../test/renderWithProviders';
import { ClinicalHistoryScreen } from '../ClinicalHistoryScreen';

const mockGetHistorico = jest.fn();

jest.mock('../../../services', () => ({
  historicoService: {
    getHistoricoClinico: (petId: string) => mockGetHistorico(petId) as unknown,
  },
}));

const route = {
  params: { petId: 'p1', petName: 'Rex' },
} as never;

function historico(itens: unknown[]) {
  return { pet_id: 'p1', pet_nome: 'Rex', itens };
}

const vacina = {
  entidade: 'VACINA',
  entidade_id: 'v1',
  titulo: 'Antirrábica',
  descricao: 'Dose anual',
  ocorrido_em: '2026-08-19',
  registrado_em: '2026-08-19T10:00:00.000Z',
  excluido: false,
  veterinario_nome: 'Dra. Camila',
  veterinario_crmv: 'CRMV-SP 12345',
  acoes: [],
};

describe('ClinicalHistoryScreen', () => {
  beforeEach(() => {
    mockGetHistorico.mockReset();
  });

  it('mostra o registro com data, autor e CRMV', async () => {
    mockGetHistorico.mockResolvedValue(historico([vacina]));

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    expect(await screen.findByText('Antirrábica')).toBeVisible();
    expect(screen.getByText('Dose anual')).toBeVisible();
    expect(screen.getByText('Dra. Camila — CRMV-SP 12345')).toBeVisible();
    // Dia de calendário não pode passar pelo Date: em UTC-3 viraria 18/08.
    expect(screen.getByText('19/08/2026')).toBeVisible();
    expect(mockGetHistorico).toHaveBeenCalledWith('p1');
  });

  // Registro sem a trilha não pode derrubar a tela: o render lia `acoes.length`.
  it('mostra o registro mesmo quando a trilha de ações não vem', async () => {
    const semTrilha: Record<string, unknown> = { ...vacina };
    delete semTrilha.acoes;
    mockGetHistorico.mockResolvedValue(historico([semTrilha]));

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    expect(await screen.findByText('Antirrábica')).toBeVisible();
  });

  it('marca o que foi excluído e mostra a trilha de quem agiu', async () => {
    mockGetHistorico.mockResolvedValue(
      historico([
        {
          ...vacina,
          excluido: true,
          acoes: [
            {
              id: 'a1',
              tipo: 'EXCLUSAO',
              autor_tipo: 'TUTOR',
              autor_id: 't1',
              autor_nome: 'Ana Silva',
              ocorrido_em: '2026-08-19T12:00:00.000Z',
            },
          ],
        },
      ]),
    );

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    // O ponto da api#117: o que o vet orientou continua demonstrável mesmo
    // depois de o tutor apagar da própria lista.
    expect(await screen.findByText('Excluído')).toBeVisible();
    expect(screen.getByText(/Apagado por · Ana Silva/)).toBeVisible();
  });

  it('mostra os comprovantes do registro e se um veterinário os verificou', async () => {
    mockGetHistorico.mockResolvedValue(
      historico([
        {
          ...vacina,
          anexos: [
            {
              id: 'x1',
              nome_arquivo: 'carteirinha.jpg',
              verificado: true,
              verificado_por_nome: 'Dra. Camila',
              verificado_por_crmv: 'CRMV-SP 12345',
            },
            { id: 'x2', nome_arquivo: 'receita.pdf', verificado: false },
          ],
        },
      ]),
    );

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    expect(
      await screen.findByText(/carteirinha\.jpg · Verificado por Dra\. Camila \(CRMV-SP 12345\)/),
    ).toBeVisible();
    expect(screen.getByText(/receita\.pdf · Aguardando verificação/)).toBeVisible();
  });
});
