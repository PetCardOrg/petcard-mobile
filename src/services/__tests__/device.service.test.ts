import { DevicePlatform } from '@petcardorg/shared';

import { api } from '../api';
import { register, unregisterCurrent } from '../device.service';

describe('device.service — descadastro no logout (AUD MOB-01)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('descadastra o último token registrado, codificado na URL', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: {} });
    const deleteSpy = jest.spyOn(api, 'delete').mockResolvedValue({ data: undefined });

    // Token do FCM tem `:`, que não pode ir cru no caminho.
    await register({ token: 'abc:123', platform: DevicePlatform.ANDROID });
    await unregisterCurrent();

    expect(deleteSpy).toHaveBeenCalledWith(
      '/devices/abc%3A123',
      expect.objectContaining({ timeout: expect.any(Number) }),
    );
  });

  it('não chama a API sem token registrado, nem duas vezes', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: {} });
    const deleteSpy = jest.spyOn(api, 'delete').mockResolvedValue({ data: undefined });

    await register({ token: 'tok-1', platform: DevicePlatform.ANDROID });
    await unregisterCurrent();
    await unregisterCurrent();

    expect(deleteSpy).toHaveBeenCalledTimes(1);
  });

  it('engole a falha da rede: sair da conta não pode travar', async () => {
    jest.spyOn(api, 'post').mockResolvedValue({ data: {} });
    jest.spyOn(api, 'delete').mockRejectedValue(new Error('timeout'));

    await register({ token: 'tok-2', platform: DevicePlatform.ANDROID });

    await expect(unregisterCurrent()).resolves.toBeUndefined();
  });
});
