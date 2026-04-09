/**
 * OpeningHours — defines the daily availability window of an agency
 * and the granularity at which time slots can be reserved.
 */
export interface OpeningHours {
  openTime: string; // "HH:mm"
  closeTime: string; // "HH:mm"
  interval: number; // minutes
}
