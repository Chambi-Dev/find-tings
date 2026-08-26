'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FotoUploadProps {
  fotos: string[];
  onFotosChange: (fotos: string[]) => void;
  maxFotos?: number;
}

export function FotoUpload({ fotos, onFotosChange, maxFotos = 5 }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const remaining = maxFotos - fotos.length;
      const filesToUpload = Array.from(files).slice(0, remaining);

      setUploading(true);
      try {
        const newUrls: string[] = [];

        for (const file of filesToUpload) {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: file,
            headers: {
              'Content-Type': file.type || 'image/jpeg',
              'x-filename': encodeURIComponent(file.name),
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
      } catch (error) {
        console.error('Error subiendo foto:', error);
        toast.error(
          error instanceof Error ? error.message : 'Error al subir la foto. Intenta de nuevo.'
        );
      } finally {
        setUploading(false);
        // Reset input
        e.target.value = '';
      }
    },
    [fotos, maxFotos, onFotosChange]
  );

  const removeFoto = (index: number) => {
    onFotosChange(fotos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {fotos.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <img
              src={url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeFoto(index)}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
            {index === 0 && (
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                Principal
              </span>
            )}
          </div>
        ))}

        {fotos.length < maxFotos && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-xs text-muted-foreground mt-2">Subiendo...</span>
              </>
            ) : (
              <>
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-2">
                  Agregar foto
                </span>
                <span className="text-xs text-muted-foreground">
                  ({fotos.length}/{maxFotos})
                </span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}
