import type { Document, DocumentRepository } from "@/domain/document";

interface Deps {
  documentRepository: DocumentRepository;
}

export const createListDocumentsUseCase = (deps: Deps) => {
  const byAgency = (agencyId: string): Promise<Document[]> =>
    deps.documentRepository.listByAgency(agencyId);
  const byBooking = (bookingId: string): Promise<Document[]> =>
    deps.documentRepository.listByBooking(bookingId);
  return { byAgency, byBooking };
};

export type ListDocumentsUseCase = ReturnType<
  typeof createListDocumentsUseCase
>;
