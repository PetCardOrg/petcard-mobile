import type { CarteiraDigitalResponseDto } from '@petcardorg/shared';

import { api } from '../api';
import { getDigitalWallet, regenerateQrCode } from '../card.service';

describe('card.service', () => {
  it('busca a carteira digital pelo id do pet', async () => {
    const wallet = { pet_name: 'Rex' } as CarteiraDigitalResponseDto;
    const getSpy = jest.spyOn(api, 'get').mockResolvedValue({ data: wallet });

    const result = await getDigitalWallet('pet-1');

    expect(getSpy).toHaveBeenCalledWith('/cards/pets/pet-1');
    expect(result).toBe(wallet);
  });

  it('solicita regeneração do QR Code via POST', async () => {
    const postSpy = jest.spyOn(api, 'post').mockResolvedValue({ data: undefined });

    await regenerateQrCode('pet-1');

    expect(postSpy).toHaveBeenCalledWith('/pets/pet-1/qr-code');
  });
});
