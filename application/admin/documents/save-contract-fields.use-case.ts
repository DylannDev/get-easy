import type {
  ContractEditableFields,
  ContractFieldsRepository,
  BookingContractFields,
} from "@/domain/contract";
import type { GenerateContractUseCase } from "./generate-contract.use-case";

interface Deps {
  contractFieldsRepository: ContractFieldsRepository;
  generateContractUseCase: GenerateContractUseCase;
}

export interface SaveContractFieldsInput {
  bookingId: string;
  fields: ContractEditableFields;
  customerSignature?: string | null;
  loueurSignature?: string | null;
}

export type SaveContractFieldsOutcome =
  | { kind: "saved"; contract: BookingContractFields }
  | { kind: "error"; message: string };

/**
 * Sauvegarde les valeurs saisies par la gérante puis déclenche la
 * régénération du PDF du contrat pour refléter les changements.
 */
export const createSaveContractFieldsUseCase = (deps: Deps) => {
  const execute = async (
    input: SaveContractFieldsInput
  ): Promise<SaveContractFieldsOutcome> => {
    try {
      const saved = await deps.contractFieldsRepository.save({
        bookingId: input.bookingId,
        fields: input.fields,
        customerSignature: input.customerSignature,
        loueurSignature: input.loueurSignature,
      });

      // Régénération du PDF — les erreurs sont propagées pour que l'UI
      // puisse les afficher (le save en BDD reste acquis même si le PDF
      // échoue, c'est volontaire : la gérante peut réessayer sans perdre
      // ses données).
      const pdfResult = await deps.generateContractUseCase.execute(
        input.bookingId
      );
      if (pdfResult.kind === "error") {
        return {
          kind: "error",
          message: `Sauvegardé, mais échec de la génération du PDF : ${pdfResult.message}`,
        };
      }

      return { kind: "saved", contract: saved };
    } catch (e) {
      return {
        kind: "error",
        message: e instanceof Error ? e.message : "Erreur inconnue",
      };
    }
  };
  return { execute };
};

export type SaveContractFieldsUseCase = ReturnType<
  typeof createSaveContractFieldsUseCase
>;
