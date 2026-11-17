import type { UploadFolder, UploadImageResponseDto } from '@petcardorg/shared';
import { Platform } from 'react-native';

import { api, UPLOAD_TIMEOUT_MS } from './api';

export async function uploadImage(
  uri: string,
  folder: Exclude<UploadFolder, 'vets'> = 'pets',
): Promise<string> {
  const filename = uri.split('/').pop() ?? 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';

  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  const type = mimeMap[ext.toLowerCase()] ?? 'image/jpeg';

  const formData = new FormData();
  formData.append('file', {
    uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
    name: filename,
    type,
  } as unknown as Blob);

  const { data } = await api.post<UploadImageResponseDto>(
    `/upload/image?folder=${folder}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT_MS,
    },
  );

  return data.url;
}
