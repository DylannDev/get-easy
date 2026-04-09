/**
 * DateRange — Value Object representing an inclusive [start, end] range.
 * Pure domain type, no framework dependency.
 */
export interface DateRange {
  start: string; // ISO DateTime string, local
  end: string; // ISO DateTime string, local
}
