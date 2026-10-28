import { Platform } from 'react-native';
import type {
  AnexoArquivoResponseDto,
  AnexoResponseDto,
  EntidadeComAnexo,
} from '@petcardorg/shared';

import { api, UPLOAD_TIMEOUT_MS } from './api';

export interface ArquivoParaEnvio {
  uri: string;
  name: string;
  mimeType: string;
}

export async function uploadAnexo(
  petId: string,
  alvo: { entidade: EntidadeComAnexo; entidadeId: string },
  arquivo: ArquivoParaEnvio,
): Promise<AnexoResponseDto> {
  const formData = new FormData();
  formData.append('entidade', alvo.entidade);
  formData.append('entidade_id', alvo.entidadeId);
  formData.append('file', {
    uri: Platform.OS === 'android' ? arquivo.uri : arquivo.uri.replace('file://', ''),
    name: arquivo.name,
    type: arquivo.mimeType,
  } as unknown as Blob);

  const { data } = await api.post<AnexoResponseDto>(`/pets/${petId}/anexos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return data;
}

/** Link temporário: o arquivo é privado e cada abertura pede um novo. */
export async function getLinkDoAnexo(id: string): Promise<AnexoArquivoResponseDto> {
  const { data } = await api.get<AnexoArquivoResponseDto>(`/anexos/${id}/arquivo`);
  return data;
}

export async function deleteAnexo(id: string): Promise<void> {
  await api.delete(`/anexos/${id}`);
}
