import type { Agency, RichTextDocument } from "./agency.entity";

/**
 * Port — implemented by infrastructure.
 *
 * Notes on the Agency aggregate:
 *  - The Agency entity (`/domain/agency/agency.entity.ts`) carries a list of
 *    Vehicle children, but in practice we often need a "lightweight" version
 *    without vehicles (listing screens, dropdowns, etc.). Two methods are
 *    exposed for that reason.
 */
export interface UpdateAgencyLegalInput {
  legalForm?: string | null;
  capitalSocial?: string | null;
  rcsCity?: string | null;
  rcsNumber?: string | null;
  siret?: string | null;
  tvaIntracom?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  vatEnabled?: boolean;
}

export interface AgencyRepository {
  findById(agencyId: string): Promise<Agency | null>;
  findAll(): Promise<Agency[]>;
  updateRentalTerms(
    agencyId: string,
    rentalTerms: RichTextDocument | null
  ): Promise<void>;
  updateLegalDetails(
    agencyId: string,
    input: UpdateAgencyLegalInput
  ): Promise<void>;
}
