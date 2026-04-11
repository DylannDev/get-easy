import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";

const TIMEZONE = "America/Cayenne";

/**
 * Formats a date string (UTC) to Cayenne local time.
 */
export function formatDateCayenne(
  date: string | Date,
  formatStr: string
): string {
  return formatInTimeZone(date, TIMEZONE, formatStr, { locale: fr });
}
