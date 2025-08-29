import { format, parseISO, isToday, isSameDay } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

export type Event = {
  id: string;
  title: string;
  start: string; // ISO UTC string
  end: string;   // ISO UTC string
  color?: string;
  notes?: string;
};

// Default time zone to use
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Convert a UTC ISO date string to local Date object
 */
export function toLocal(utcISO: string, tz: string = DEFAULT_TIMEZONE): Date {
  return utcToZonedTime(parseISO(utcISO), tz);
}

/**
 * Convert a local Date object to UTC ISO string
 */
export function toUTC(localDate: Date, tz: string = DEFAULT_TIMEZONE): string {
  return zonedTimeToUtc(localDate, tz).toISOString();
}

/**
 * Format a time range in local timezone
 */
export function formatRange(
  utcStartISO: string,
  utcEndISO: string,
  tz: string = DEFAULT_TIMEZONE
): string {
  const start = toLocal(utcStartISO, tz);
  const end = toLocal(utcEndISO, tz);
  
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
}

/**
 * Get the date at the start of the day in UTC
 */
export function getDayStart(dateISO: string): string {
  const date = parseISO(dateISO);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

/**
 * Get the date at the end of the day in UTC
 */
export function getDayEnd(dateISO: string): string {
  const date = parseISO(dateISO);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();
}

/**
 * Check if a date is today
 */
export function isTodayISO(dateISO: string): boolean {
  return isToday(parseISO(dateISO));
}
