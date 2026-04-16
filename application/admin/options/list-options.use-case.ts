import type { Option, OptionRepository } from "@/domain/option";

interface Deps {
  optionRepository: OptionRepository;
}

export const createListOptionsUseCase = (deps: Deps) => {
  const execute = (agencyId: string): Promise<Option[]> =>
    deps.optionRepository.listByAgency(agencyId);
  return { execute };
};

export type ListOptionsUseCase = ReturnType<typeof createListOptionsUseCase>;
