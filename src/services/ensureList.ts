/**
 * Garante que a resposta de uma rota de lista é mesmo uma lista.
 *
 * Um 200 com corpo fora do contrato (vazio, HTML de proxy) não falha no axios e
 * chegaria às telas como `undefined`. O render lê `.length`/`.map` desse estado
 * e, em build Release, o erro não tratado encerra o app inteiro. Aqui vira uma
 * falha comum, que as telas já tratam no `catch` com a mensagem de erro.
 */
export function ensureList<T>(data: unknown, recurso: string): T[] {
  if (!Array.isArray(data)) {
    throw new Error(`Resposta inesperada: ${recurso}`);
  }
  return data as T[];
}
