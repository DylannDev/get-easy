import type { DocumentRepository } from "@/domain/document";

interface Deps {
  documentRepository: DocumentRepository;
}

export const createGetDocumentSignedUrlUseCase = (deps: Deps) => {
  const execute = (
    id: string,
    options?: { forceDownload?: boolean }
  ): Promise<string | null> =>
    deps.documentRepository.getSignedUrl(id, options);
  return { execute };
};

export type GetDocumentSignedUrlUseCase = ReturnType<
  typeof createGetDocumentSignedUrlUseCase
>;
