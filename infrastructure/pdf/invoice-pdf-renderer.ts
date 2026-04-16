import "server-only";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InvoicePDFDocument } from "@/lib/pdf/invoice-template";
import type {
  InvoicePdfData,
  InvoicePdfRenderer,
} from "@/application/admin/documents/generate-invoice.use-case";

export const createReactPdfInvoiceRenderer = (): InvoicePdfRenderer => ({
  async render(data: InvoicePdfData): Promise<Buffer> {
    // `InvoicePDFDocument` renders `<PDFDocument>` at the root; we cast to
    // satisfy the strict typing of `renderToBuffer` which expects precisely
    // a ReactElement<DocumentProps>.
    const element = React.createElement(InvoicePDFDocument, {
      data,
    }) as unknown as React.ReactElement<DocumentProps>;
    return renderToBuffer(element);
  },
});
