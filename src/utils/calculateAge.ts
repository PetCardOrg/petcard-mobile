/**
 * Interpreta datas ISO (YYYY-MM-DD) sem shift de timezone.
 */
function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const localDate = /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value;
  return new Date(localDate);
}

/**
 * Retorna a idade formatada a partir de uma data de nascimento.
 * Ex: "3 anos e 2 meses", "8 meses", "Menos de 1 mês"
 */
export function calculateAge(birthValue: string | Date | null | undefined): string {
  if (!birthValue) return 'Idade não informada';

  const birthDate = parseDate(birthValue);
  if (Number.isNaN(birthDate.getTime())) return 'Idade não informada';

  const today = new Date();
  if (birthDate > today) return 'Data futura';

  let totalMonths =
    (today.getFullYear() - birthDate.getFullYear()) * 12 + today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    totalMonths -= 1;
  }

  if (totalMonths >= 12) {
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    if (months === 0) {
      return years === 1 ? '1 ano' : `${years} anos`;
    }
    const yearsPart = years === 1 ? '1 ano' : `${years} anos`;
    const monthsPart = months === 1 ? '1 mês' : `${months} meses`;
    return `${yearsPart} e ${monthsPart}`;
  }

  if (totalMonths > 0) {
    return totalMonths === 1 ? '1 mês' : `${totalMonths} meses`;
  }

  return 'Menos de 1 mês';
}
