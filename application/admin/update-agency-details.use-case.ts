import type {
  AgencyRepository,
  UpdateAgencyLegalInput,
} from "@/domain/agency";

interface Deps {
  agencyRepository: AgencyRepository;
}

export const createUpdateAgencyDetailsUseCase = (deps: Deps) => {
  const execute = (
    agencyId: string,
    input: UpdateAgencyLegalInput
  ): Promise<void> => deps.agencyRepository.updateLegalDetails(agencyId, input);
  return { execute };
};

export type UpdateAgencyDetailsUseCase = ReturnType<
  typeof createUpdateAgencyDetailsUseCase
>;
