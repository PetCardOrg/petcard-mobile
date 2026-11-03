import type { AxiosAdapter } from 'axios';

import { api, UPLOAD_TIMEOUT_MS } from '../api';
import { uploadImage } from '../upload.service';

const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe('uploadImage', () => {
  // Foto de câmera tem alguns MB: com o teto padrão de 10s (pensado para JSON)
  // o envio caía no meio em rede móvel, ainda mais com a API acordando.
  it('usa o teto de upload, e não o padrão das chamadas JSON', async () => {
    let timeoutUsado: number | undefined;
    const adapter: AxiosAdapter = async (config) => {
      timeoutUsado = config.timeout;
      return {
        data: { url: 'https://bucket/pets/foto.jpg' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    };
    api.defaults.adapter = adapter;

    await uploadImage('file:///tmp/foto.jpg');

    expect(UPLOAD_TIMEOUT_MS).toBe(60000);
    expect(timeoutUsado).toBe(UPLOAD_TIMEOUT_MS);
  });
});
