import { api } from './api';

/**
 * Uma leitura do QR da coleira do pet.
 *
 * Tipo local, e não do `@petcardorg/shared`: o DTO correspondente na api também
 * é local ao módulo `card`, porque o pacote compartilhado só publica em push
 * para a `main` daquele repo.
 */
export type PetScan = {
  id: string;
  pet_id: string;
  /** Ausentes quando quem encontrou o pet recusou compartilhar a localização. */
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  created_at: string;
};

export type TagColeira = {
  pet_id: string;
  /** Imagem PNG no S3. Ausente enquanto a fila ainda não gerou. */
  qr_code_url?: string;
  /** Endereço que o QR carrega — serve para compartilhar sem a imagem. */
  public_url: string;
};

export async function getTag(petId: string): Promise<TagColeira> {
  const { data } = await api.get<TagColeira>(`/coleira/pets/${petId}/tag`);
  return data;
}

export async function getByPet(petId: string): Promise<PetScan[]> {
  const { data } = await api.get<PetScan[]>(`/coleira/pets/${petId}/scans`);
  return data;
}
