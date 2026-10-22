import { ensureList } from '../ensureList';
import { getHistoricoClinico } from '../historico.service';
import { api } from '../api';

jest.mock('../api', () => ({
  api: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

// As telas leem `.length`/`.map` do que o service devolve. Um 200 fora do
// contrato tem de virar falha tratada, e não `undefined` no estado: em build
// Release o erro não tratado do render encerra o app.
describe('ensureList', () => {
  it('devolve a própria lista, inclusive vazia', () => {
    expect(ensureList(['a'], 'x')).toEqual(['a']);
    expect(ensureList([], 'x')).toEqual([]);
  });

  it.each([undefined, null, '', '<html></html>', { itens: [] }])(
    'rejeita %p, que não é lista',
    (valor) => {
      expect(() => ensureList(valor, 'vacinas')).toThrow('Resposta inesperada: vacinas');
    },
  );
});

describe('getHistoricoClinico', () => {
  beforeEach(() => mockGet.mockReset());

  it('mantém o histórico quando a lista vem', async () => {
    mockGet.mockResolvedValue({ data: { pet_id: 'p1', pet_nome: 'Rex', itens: [{ id: 1 }] } });

    await expect(getHistoricoClinico('p1')).resolves.toEqual({
      pet_id: 'p1',
      pet_nome: 'Rex',
      itens: [{ id: 1 }],
    });
  });

  it.each([undefined, {}, { itens: null }])(
    'rejeita a resposta %p sem lista de itens',
    async (data) => {
      mockGet.mockResolvedValue({ data });

      await expect(getHistoricoClinico('p1')).rejects.toThrow('Resposta inesperada');
    },
  );
});
