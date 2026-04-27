"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PiImages, PiUpload } from "react-icons/pi";
import { useVehicleImageUpload } from "./use-vehicle-image-upload";

interface Props {
  imgValue: string;
  onChangeImg: (url: string) => void;
  uniqueImages: string[];
  imgError?: string;
}

/** Card "Photo du véhicule" : upload local (max 2 Mo) + sélection depuis
 *  la bibliothèque des images déjà téléversées par l'utilisateur. */
export function VehicleImageCard({
  imgValue,
  onChangeImg,
  uniqueImages,
  imgError,
}: Props) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const {
    fileInputRef,
    uploading,
    uploadError,
    handleImageUpload,
    triggerPicker,
  } = useVehicleImageUpload(onChangeImg);

  const selectExisting = (url: string) => {
    onChangeImg(url);
    setImageDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Photo du véhicule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {imgValue && (
            <div className="relative h-24 w-36 rounded-lg overflow-hidden bg-gray-50 shrink-0">
              <Image
                src={imgValue}
                alt="Aperçu"
                fill
                className="object-contain p-2"
              />
            </div>
          )}
          <div className="space-y-2 w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={triggerPicker}
                disabled={uploading}
              >
                <PiUpload className="size-4" />
                {uploading ? "Import..." : imgValue ? "Changer" : "Importer"}
              </Button>
              {uniqueImages.length > 0 && (
                <Dialog
                  open={imageDialogOpen}
                  onOpenChange={setImageDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <PiImages className="size-4" />
                      Bibliothèque
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>
                        Sélectionner une image existante
                      </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto py-2">
                      {uniqueImages.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectExisting(url)}
                          className={`relative h-40 rounded-lg overflow-hidden bg-gray-50 border-2 cursor-pointer transition-colors ${
                            imgValue === url
                              ? "border-green"
                              : "border-transparent hover:border-gray-300"
                          }`}
                        >
                          <Image
                            src={url}
                            alt=""
                            fill
                            className="object-contain p-2"
                          />
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG ou WebP. 2 Mo maximum.
            </p>
            {uploadError && (
              <p className="text-xs text-red-500">{uploadError}</p>
            )}
            {imgError && !uploadError && (
              <p className="text-xs text-red-500">{imgError}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
