import type {
  CreateDocumentInput,
  Document,
  DocumentRepository,
} from "@/domain/document";

interface Deps {
  documentRepository: DocumentRepository;
}

export const createUploadDocumentUseCase = (deps: Deps) => {
  const execute = (input: CreateDocumentInput): Promise<Document> =>
    deps.documentRepository.create(input);
  return { execute };
};

export type UploadDocumentUseCase = ReturnType<
  typeof createUploadDocumentUseCase
>;
