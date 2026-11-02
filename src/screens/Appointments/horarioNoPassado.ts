const MS_PER_MINUTE = 60_000;

function minuto(date: Date): number {
  return Math.floor(date.getTime() / MS_PER_MINUTE);
}

/**
 * Se o horário escolhido no formulário já passou. A comparação é por minuto,
 * porque o formulário só tem HH:MM: o minuto atual ainda vale.
 *
 * Na edição (`originalIso`), a regra só se aplica quando data ou hora mudaram:
 * um compromisso que já passou continua editável (título, local) sem obrigar
 * a remarcar.
 */
export function horarioNoPassado(
  escolhido: Date,
  agora: Date = new Date(),
  originalIso?: string,
): boolean {
  if (originalIso && minuto(new Date(originalIso)) === minuto(escolhido)) return false;
  return minuto(escolhido) < minuto(agora);
}
