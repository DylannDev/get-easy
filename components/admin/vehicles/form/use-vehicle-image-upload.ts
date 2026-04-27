"use client";

import { useRef, useState } from "react";
import { uploadVehicleImage } from "@/actions/admin/upload-image";

const MAX_SIZE = 2 * 1024 * 1024; // 2 Mo

/** Encapsule l'upload d'une image véhicule (fichier ref + état uploading +
 *  message d'erreur) et notifie le caller via `onUploaded(url)` quand
 *  Supabase Storage a renvoyé l'URL signée. */
export function useVehicleImageUpload(onUploaded: (url: string) => void) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE) {
      setUploadError("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadVehicleImage(formData);
    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      onUploaded(result.url);
    }
    setUploading(false);
  };

  const triggerPicker = () => fileInputRef.current?.click();

  return {
    fileInputRef,
    uploading,
    uploadError,
    handleImageUpload,
    triggerPicker,
  };
}
