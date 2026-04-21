import { Platform } from 'react-native';

import { api } from './api';

interface UploadImageResponse {
  url: string;
}

export async function uploadImage(
  uri: string,
  folder: 'pets' | 'tutors' = 'pets',
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

  const { data } = await api.post<UploadImageResponse>(`/upload/image?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.url;
}
