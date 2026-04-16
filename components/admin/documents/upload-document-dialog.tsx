"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadDocument } from "@/actions/admin/documents";
import { PiFileText } from "react-icons/pi";
import type { DocumentType } from "@/domain/document";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  /** If provided, the document will be attached to this booking. */
  bookingId?: string;
}

export function UploadDocumentDialog({
  open,
  onClose,
  onUploaded,
  bookingId,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<DocumentType>("other");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setType("other");
    setError(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      if (bookingId) fd.append("bookingId", bookingId);
      await uploadDocument(fd);
      reset();
      onUploaded();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec du téléversement.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Téléverser un document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
            >
              <option value="invoice">Facture</option>
              <option value="contract">Contrat</option>
              <option value="other">Autre</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Fichier</Label>
            <label className="flex items-center gap-3 border border-gray-300 rounded-md p-3 cursor-pointer hover:bg-gray-50 transition-colors">
              <PiFileText className="size-5 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">
                {file ? file.name : "Choisir un fichier (PDF ou image)"}
              </span>
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              PDF, PNG, JPG ou WEBP — max 10 Mo.
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={uploading}
            >
              {uploading ? "Envoi…" : "Téléverser"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
