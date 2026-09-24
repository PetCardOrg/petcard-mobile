const MS_PER_DAY = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Diferença em dias de **calendário** entre a data informada e hoje.
 *
 * Comparar instantes não serve: um agendamento hoje às 23h, visto às 21h, dá
 * 2 horas de diferença — arredondando para cima virava "1 dia" e a tela escrevia
 * "amanhã" para algo que é hoje. Normalizando as duas pontas para a meia-noite
 * local, hoje é sempre 0 e amanhã sempre 1.
 *
 * O arredondamento protege contra horário de verão, quando o dia tem 23 ou 25h.
 */
export function getRelativeDays(iso: string, now: Date = new Date()): number {
  const diff = startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime();
  return Math.round(diff / MS_PER_DAY);
}
