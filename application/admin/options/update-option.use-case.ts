import type {
  Option,
  OptionRepository,
  UpdateOptionInput,
} from "@/domain/option";

interface Deps {
  optionRepository: OptionRepository;
}

export const createUpdateOptionUseCase = (deps: Deps) => {
  const execute = (
    id: string,
    input: UpdateOptionInput
  ): Promise<Option | null> => deps.optionRepository.update(id, input);
  return { execute };
};

export type UpdateOptionUseCase = ReturnType<typeof createUpdateOptionUseCase>;
