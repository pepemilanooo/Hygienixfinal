import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { it } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, fmt = 'dd/MM/yyyy'): string {
  if (!date) return 'N/D';
  try { return format(new Date(date), fmt, { locale: it }); } catch { return 'N/D'; }
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return 'N/D';
  const d = new Date(date);
  if (isToday(d)) return `Oggi, ${format(d, 'HH:mm')}`;
  if (isTomorrow(d)) return `Domani, ${format(d, 'HH:mm')}`;
  if (isYesterday(d)) return `Ieri, ${format(d, 'HH:mm')}`;
  return formatDistanceToNow(d, { locale: it, addSuffix: true });
}

export function formatDuration(startAt: Date | string | null, endAt: Date | string | null): string {
  if (!startAt || !endAt) return 'N/D';
  const mins = Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function truncate(str: string, maxLength = 50): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ─── LABEL MAPS ──────────────────────────────────────────────────────────────

export const CLIENT_TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'Privato', CONDO: 'Condominio', COMPANY: 'Azienda', RESTAURANT: 'Ristorante',
  HOTEL: 'Hotel', SHOP: 'Negozio', INDUSTRY: 'Industria', PA: 'Pubblica Amministrazione', OTHER: 'Altro',
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  DISINFECTION: 'Disinfestazione', RODENT_CONTROL: 'Derattizzazione', COCKROACH: 'Deblattizzazione',
  MONITORING: 'Monitoraggio', SANIFICATION: 'Sanificazione', INSPECTION: 'Sopralluogo', OTHER: 'Altro',
};

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bassa', NORMAL: 'Normale', HIGH: 'Alta', URGENT: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Pianificato', ASSIGNED: 'Assegnato', IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completato', CLOSED: 'Chiuso', ARCHIVED: 'Archiviato',
};

export const CARD_POINT_TYPE_LABELS: Record<string, string> = {
  TRAP: 'Trappola', BAIT: 'Esca', UV_LAMP: 'Lampada UV', MONITOR: 'Monitor Insetti',
  CHECK_POINT: 'Punto Controllo', CRITICAL_AREA: 'Area Critica', SENSITIVE_ACCESS: 'Accesso Sensibile',
};

export const OUTCOME_LABELS: Record<string, string> = {
  OK: 'OK', ATTENTION: 'Attenzione', CRITICAL: 'Critico', NOT_CHECKED: 'Non controllato',
};
