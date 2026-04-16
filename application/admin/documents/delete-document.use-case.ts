import type { DocumentRepository } from "@/domain/document";

interface Deps {
  documentRepository: DocumentRepository;
}

export const createDeleteDocumentUseCase = (deps: Deps) => {
  const execute = (id: string): Promise<void> =>
    deps.documentRepository.delete(id);
  return { execute };
};

export type DeleteDocumentUseCase = ReturnType<
  typeof createDeleteDocumentUseCase
>;
