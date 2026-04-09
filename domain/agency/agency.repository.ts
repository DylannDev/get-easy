import type { Agency } from "./agency.entity";

/**
 * Port — implemented by infrastructure.
 *
 * Notes on the Agency aggregate:
 *  - The Agency entity (`/domain/agency/agency.entity.ts`) carries a list of
 *    Vehicle children, but in practice we often need a "lightweight" version
 *    without vehicles (listing screens, dropdowns, etc.). Two methods are
 *    exposed for that reason.
 */
export interface AgencyRepository {
  findById(agencyId: string): Promise<Agency | null>;
  findAll(): Promise<Agency[]>;
}
