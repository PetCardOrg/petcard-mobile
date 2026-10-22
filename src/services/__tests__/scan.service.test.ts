import { api } from '../api';
import { getByPet } from '../scan.service';

jest.mock('../api', () => ({
  api: { get: jest.fn() },
}));

const mockGet = api.get as jest.Mock;

// Uma resposta 200 fora do contrato não pode virar `undefined` na tela: o
// render lê `.length` da lista e, em build Release, o erro derruba o app.
describe('getByPet', () => {
  beforeEach(() => mockGet.mockReset());

  it('devolve a lista de leituras do pet', async () => {
    const leituras = [{ id: 's1', pet_id: 'p1', created_at: '2026-09-05T15:30:00.000Z' }];
    mockGet.mockResolvedValue({ data: leituras });

    await expect(getByPet('p1')).resolves.toEqual(leituras);
    expect(mockGet).toHaveBeenCalledWith('/coleira/pets/p1/scans');
  });

  it.each([
    ['corpo ausente', undefined],
    ['corpo vazio', ''],
    ['objeto no lugar da lista', { message: 'ok' }],
    ['HTML de proxy', '<html></html>'],
  ])('rejeita %s em vez de devolver algo que não é lista', async (_caso, data) => {
    mockGet.mockResolvedValue({ data });

    await expect(getByPet('p1')).rejects.toThrow('Resposta inesperada');
  });
});
