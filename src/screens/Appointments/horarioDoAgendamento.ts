/** Máscara HH:MM enquanto o tutor digita. */
export function formatTime(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
}

export function parseTime(text: string): { hours: number; minutes: number } | undefined {
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return { hours, minutes };
}

/** Data (DD/MM/AAAA) e hora (HH:MM) do agendamento, no fuso do aparelho. */
export function formatScheduledAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return { date: `${day}/${month}/${year}`, time: `${hours}:${minutes}` };
}

export function isUpcoming(iso: string): boolean {
  return new Date(iso) >= new Date();
}
