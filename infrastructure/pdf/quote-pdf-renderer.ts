import "server-only";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { QuotePDFDocument } from "@/lib/pdf/quote-template";
import type {
  QuotePdfData,
  QuotePdfRenderer,
} from "@/application/admin/documents/generate-quote.use-case";

export const createReactPdfQuoteRenderer = (): QuotePdfRenderer => ({
  async render(data: QuotePdfData): Promise<Buffer> {
    const element = React.createElement(QuotePDFDocument, {
      data,
    }) as unknown as React.ReactElement<DocumentProps>;
    return renderToBuffer(element);
  },
});
