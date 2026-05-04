import { format, parseISO, isValid, differenceInMinutes } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Formats a date to "YYYY-MM-DD" string.
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Formats a date to "HH:mm" string.
 */
export function toTimeString(date: Date): string {
  return format(date, 'HH:mm');
}

/**
 * Formats a date to a human-readable Indonesian format.
 * e.g. "Senin, 1 Januari 2024"
 */
export function toIndonesianDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'EEEE, d MMMM yyyy', { locale: id });
}

/**
 * Formats a date to a short Indonesian format.
 * e.g. "1 Jan 2024"
 */
export function toShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '-';
  return format(d, 'd MMM yyyy', { locale: id });
}

/**
 * Formats a datetime to "HH:mm" string.
 */
export function toTime(date: Date | null): string {
  if (!date) return '-';
  return format(date, 'HH:mm');
}

/**
 * Calculates work duration in minutes between check-in and check-out.
 */
export function calculateWorkDuration(
  checkIn: Date | null,
  checkOut: Date | null
): number | null {
  if (!checkIn || !checkOut) return null;
  const minutes = differenceInMinutes(checkOut, checkIn);
  return minutes > 0 ? minutes : null;
}

/**
 * Formats work duration in minutes to "Xj Ym" format.
 * e.g. 495 minutes → "8j 15m"
 */
export function formatWorkDuration(minutes: number | null): string {
  if (minutes === null) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}j`;
  return `${hours}j ${mins}m`;
}

/**
 * Parses "HH:mm" time string to total minutes from midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = parseInt(hoursStr ?? '0', 10);
  const minutes = parseInt(minutesStr ?? '0', 10);
  return hours * 60 + minutes;
}

/**
 * Checks if a given date is a workday based on workday config.
 */
export function isWorkday(date: Date, workDays: number[]): boolean {
  return workDays.includes(date.getDay());
}

/**
 * Returns today's date as "YYYY-MM-DD" string.
 */
export function today(): string {
  return toDateString(new Date());
}
