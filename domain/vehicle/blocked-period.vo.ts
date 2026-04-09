/**
 * BlockedPeriod — a time window during which a vehicle is unavailable
 * (maintenance, manual block by agency, etc.).
 */
export interface BlockedPeriod {
  start: string; // ISO DateTime string, local
  end: string; // ISO DateTime string, local
}
