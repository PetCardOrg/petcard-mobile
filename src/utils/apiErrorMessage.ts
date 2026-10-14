import { isAxiosError } from 'axios';
import type { TFunction } from 'i18next';

/**
 * Status HTTP cuja causa é a mesma em qualquer tela e, por isso, tem texto
 * próprio em `apiErrors`. Fora desta lista (401, 5xx, sem resposta) vale a
 * mensagem específica da tela, passada como `fallback`.
 */
const STATUS_COM_TEXTO = [400, 403, 404, 409, 413, 415, 429];

/**
 * Mensagem de erro para mostrar ao usuário a partir de uma falha de chamada à
 * API.
 *
 * Nunca devolve o texto cru de `response.data.message`: a API responde em
 * inglês (validação dos DTOs e boa parte das exceções), e o app tem tradução
 * própria para os dois idiomas.
 *
 * `overrides` troca o texto de um status específico — ex.: o 409 do cadastro
 * significa "e-mail já cadastrado", e na edição de pet significa outra coisa.
 */
export function apiErrorMessage(
  err: unknown,
  fallback: string,
  t: TFunction,
  overrides: Partial<Record<number, string>> = {},
): string {
  if (!isAxiosError(err)) return fallback;

  const status = err.response?.status;
  if (status === undefined) return fallback;

  const override = overrides[status];
  if (override) return override;

  return STATUS_COM_TEXTO.includes(status) ? t(`apiErrors.${status}`) : fallback;
}
