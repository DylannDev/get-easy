import "server-only";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ContractPDFDocument } from "@/lib/pdf/contract-template";
import type {
  ContractPdfData,
  ContractPdfRenderer,
} from "@/application/admin/documents/generate-contract.use-case";

export const createReactPdfContractRenderer = (): ContractPdfRenderer => ({
  async render(data: ContractPdfData): Promise<Buffer> {
    const element = React.createElement(ContractPDFDocument, {
      data,
    }) as unknown as React.ReactElement<DocumentProps>;
    return renderToBuffer(element);
  },
});
