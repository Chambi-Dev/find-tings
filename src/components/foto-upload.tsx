'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, Loader2, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FotoUploadProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  maxFotos?: number;
}

/**
 * Comprime la imagen en el cliente usando Canvas para acelerar la subida
 * y evitar exceder límites de memoria en Cloudflare Workers.
 */
async function compressImage(file: File, maxWidth = 1280, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    // Si ya es menor a 400KB, no es necesario comprimir
    if (file.size < 400 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            resolve(blob || file);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function FotoUpload({ fotos, onFotosChange, maxFotos = 5 }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const processAndUploadFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;

      const remaining = maxFotos - fotos.length;
      if (remaining <= 0) {
        toast.error(`Ya alcanzaste el máximo de ${maxFotos} fotos`);
        return;
      }

      const filesToUpload = Array.from(fileList).slice(0, remaining);
      setUploading(true);

      try {
        const newUrls: string[] = [];

        for (const file of filesToUpload) {
          // Comprimir en cliente antes de enviar
          const compressedBlob = await compressImage(file);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: compressedBlob,
            headers: {
              'Content-Type': 'image/jpeg',
              'x-filename': encodeURIComponent(file.name.replace(/\.[^/.]+$/, '') + '.jpg'),
            },
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Error ${res.status} al subir la foto`);
          }

          const data = await res.json();
          const finalUrl = data.url || data.publicUrl;
          if (finalUrl) {
            newUrls.push(finalUrl);
          }
        }

        onFotosChange([...fotos, ...newUrls]);
        toast.success(
          newUrls.length === 1
            ? 'Foto agregada exitosamente'
            : `${newUrls.length} fotos agregadas exitosamente`
        );
      } catch (error) {
        console.error('Error subiendo foto:', error);
        toast.error(
          error instanceof Error ? error.message : 'Error al subir la foto. Intenta de nuevo.'
        );
      } finally {
        setUploading(false);
        // Limpiar los inputs para permitir volver a seleccionar el mismo archivo
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
      }
    },
    [fotos, maxFotos, onFotosChange]
  );

  const removeFoto = (index: number) => {
    onFotosChange(fotos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Inputs ocultos especializados */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => processAndUploadFiles(e.target.files)}
        disabled={uploading}
        className="hidden"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => processAndUploadFiles(e.target.files)}
        disabled={uploading}
        className="hidden"
      />

      {/* Galería de fotos subidas */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {fotos.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted border shadow-xs">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeFoto(index)}
                className="absolute top-1.5 right-1.5 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors shadow-sm cursor-pointer"
                title="Eliminar foto"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[11px] font-medium px-2 py-0.5 rounded-md backdrop-blur-xs">
                  Foto Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Botones de acción: Cámara directa y Galería local */}
      {fotos.length < maxFotos && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Opción 1: Abrir Cámara directamente */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-medium text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <span>Tomar foto con la cámara</span>
            </button>

            {/* Opción 2: Subir desde Galería / Archivos locales */}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 bg-muted/30 hover:bg-muted/60 text-foreground font-medium text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <ImagePlus className="h-5 w-5 text-muted-foreground group-hover:scale-110 transition-transform" />
              <span>Elegir de galería / archivos</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {uploading ? (
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Optimizando y subiendo foto...
                </span>
              ) : (
                'Puedes tomar una foto al instante o subir fotos de tu galería'
              )}
            </span>
            <span className="font-medium">
              {fotos.length} de {maxFotos} fotos
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
