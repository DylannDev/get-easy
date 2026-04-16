import type {
  CreateOptionInput,
  Option,
  OptionRepository,
} from "@/domain/option";

interface Deps {
  optionRepository: OptionRepository;
}

export const createCreateOptionUseCase = (deps: Deps) => {
  const execute = (input: CreateOptionInput): Promise<Option> =>
    deps.optionRepository.create(input);
  return { execute };
};

export type CreateOptionUseCase = ReturnType<typeof createCreateOptionUseCase>;
