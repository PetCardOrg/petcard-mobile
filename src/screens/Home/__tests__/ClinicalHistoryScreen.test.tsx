import { renderWithProviders, screen, waitFor } from '../../../test/renderWithProviders';
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

  it('mostra estado vazio quando o pet não tem registros', async () => {
    mockGetHistorico.mockResolvedValue(historico([]));

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    expect(await screen.findByText('Nenhum registro ainda')).toBeVisible();
  });

  it('mostra erro quando a busca falha', async () => {
    mockGetHistorico.mockRejectedValue(new Error('boom'));

    renderWithProviders(<ClinicalHistoryScreen navigation={{} as never} route={route} />);

    await waitFor(() =>
      expect(screen.getByText('Não foi possível carregar o histórico.')).toBeVisible(),
    );
  });
});
