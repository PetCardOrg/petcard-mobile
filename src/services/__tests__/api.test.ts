import type { AxiosAdapter } from 'axios';

import { api, setTokenProvider, setUnauthorizedHandler } from '../api';

// Adapter que ecoa os headers da request como `data`, permitindo inspecionar o
// que os interceptors montaram sem tocar a rede.
const echoAdapter: AxiosAdapter = async (config) => ({
  data: config.headers,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  setTokenProvider(null);
  setUnauthorizedHandler(null);
});

describe('interceptor de request (Authorization)', () => {
  it('injeta Bearer token quando o provider retorna um token', async () => {
    api.defaults.adapter = echoAdapter;
    setTokenProvider(async () => 'tok-123');

    const { data } = await api.get('/pets');

    expect(data.Authorization).toBe('Bearer tok-123');
  });

  it('não injeta Authorization quando não há token', async () => {
    api.defaults.adapter = echoAdapter;
    setTokenProvider(async () => null);

    const { data } = await api.get('/pets');

    expect(data.Authorization).toBeUndefined();
  });

  it('segue sem auth se o provider lançar erro', async () => {
    api.defaults.adapter = echoAdapter;
    setTokenProvider(async () => {
      throw new Error('secure store indisponível');
    });

    const { data } = await api.get('/pets');

    expect(data.Authorization).toBeUndefined();
  });
});

describe('interceptor de response (401)', () => {
  function failWith(status: number): AxiosAdapter {
    return async (config) => {
      const error = Object.assign(new Error(`HTTP ${status}`), {
        response: { status, data: {}, headers: {}, config, statusText: '' },
        config,
        isAxiosError: true,
      });
      throw error;
    };
  }

  it('chama o handler de não autorizado em 401', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    api.defaults.adapter = failWith(401);

    await expect(api.get('/pets')).rejects.toBeDefined();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('não chama o handler em outros erros (ex: 500)', async () => {
    const onUnauthorized = jest.fn();
    setUnauthorizedHandler(onUnauthorized);
    api.defaults.adapter = failWith(500);

    await expect(api.get('/pets')).rejects.toBeDefined();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
