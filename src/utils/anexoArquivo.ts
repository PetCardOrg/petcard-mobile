/**
 * Formatos que a API aceita para comprovante, mapeados pela extensão.
 *
 * A galeria devolve `mimeType` em versões novas do expo-image-picker, mas nem
 * sempre: o app cai no que a extensão diz. A API confere os bytes de qualquer
 * forma — aqui só evita mandar o que ela vai recusar.
 */
const MIME_POR_EXTENSAO: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export const ANEXO_TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024;

export function mimeDoArquivo(nome: string, declarado?: string | null): string | null {
  if (declarado && Object.values(MIME_POR_EXTENSAO).includes(declarado)) {
    return declarado;
  }
  const ext = /\.(\w+)$/.exec(nome)?.[1]?.toLowerCase();
  return (ext && MIME_POR_EXTENSAO[ext]) || null;
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
