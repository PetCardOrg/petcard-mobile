/**
 * Formata uma data ISO (YYYY-MM-DD) para exibição (DD/MM/YYYY).
 */
export function formatDateDisplay(dateStr: string): string {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return dateStr;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/**
 * Auto-formata dígitos enquanto o usuário digita: DD/MM/AAAA.
 */
export function formatDateInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

/**
 * Converte DD/MM/AAAA para YYYY-MM-DD, validando dia/mês reais.
 * Retorna undefined se inválida.
 */
export function parseDate(text: string): string | undefined {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00`);
  if (isNaN(date.getTime())) return undefined;
  if (date.getDate() !== Number(day) || date.getMonth() + 1 !== Number(month)) return undefined;
  return `${year}-${month}-${day}`;
}
