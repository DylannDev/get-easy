import type { OptionRepository } from "@/domain/option";

interface Deps {
  optionRepository: OptionRepository;
}

export const createDeleteOptionUseCase = (deps: Deps) => {
  const execute = (id: string): Promise<void> =>
    deps.optionRepository.delete(id);
  return { execute };
};

export type DeleteOptionUseCase = ReturnType<typeof createDeleteOptionUseCase>;
