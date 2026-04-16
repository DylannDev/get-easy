import type { AgencyRepository, RichTextDocument } from "@/domain/agency";

interface Deps {
  agencyRepository: AgencyRepository;
}

export const createUpdateAgencyTermsUseCase = (deps: Deps) => {
  const execute = async (
    agencyId: string,
    rentalTerms: RichTextDocument | null
  ): Promise<void> => {
    await deps.agencyRepository.updateRentalTerms(agencyId, rentalTerms);
  };
  return { execute };
};

export type UpdateAgencyTermsUseCase = ReturnType<
  typeof createUpdateAgencyTermsUseCase
>;
