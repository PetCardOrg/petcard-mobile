import type { CarteiraDigitalResponseDto } from '@petcardorg/shared';

import { api } from './api';

export async function getDigitalWallet(petId: string): Promise<CarteiraDigitalResponseDto> {
  const { data } = await api.get<CarteiraDigitalResponseDto>(`/cards/pets/${petId}`);
  return data;
}

export async function regenerateQrCode(petId: string): Promise<void> {
  await api.post(`/pets/${petId}/qr-code`);
}
