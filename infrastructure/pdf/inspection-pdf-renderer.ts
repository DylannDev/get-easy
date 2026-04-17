import "server-only";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { InspectionPDFDocument } from "@/lib/pdf/inspection-template";
import type {
  InspectionPdfData,
  InspectionPdfRenderer,
} from "@/application/admin/documents/generate-inspection.use-case";

export const createReactPdfInspectionRenderer =
  (): InspectionPdfRenderer => ({
    async render(data: InspectionPdfData): Promise<Buffer> {
      const element = React.createElement(InspectionPDFDocument, {
        data,
      }) as unknown as React.ReactElement<DocumentProps>;
      return renderToBuffer(element);
    },
  });
