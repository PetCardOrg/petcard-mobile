import type { DeviceTokenResponseDto, RegisterDeviceDto } from '@petcardorg/shared';

import { api } from './api';

const ENDPOINT = '/devices';

export async function register(payload: RegisterDeviceDto): Promise<DeviceTokenResponseDto> {
  const { data } = await api.post<DeviceTokenResponseDto>(ENDPOINT, payload);
  return data;
}
