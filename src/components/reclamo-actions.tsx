'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { aprobarReclamo, rechazarReclamo } from '@/actions/reclamos';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReclamoActionsProps {
  reclamoId: string;
}

export function ReclamoActions({ reclamoId }: ReclamoActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleAprobar() {
    startTransition(async () => {
      try {
        await aprobarReclamo(reclamoId);
        toast.success('Reclamo aprobado. El objeto ha sido marcado como reclamado.');
      } catch (error) {
        toast.error('Error al aprobar el reclamo');
      }
    });
  }

  function handleRechazar() {
    startTransition(async () => {
      try {
        await rechazarReclamo(reclamoId);
        toast.success('Reclamo rechazado');
      } catch (error) {
        toast.error('Error al rechazar el reclamo');
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={handleAprobar}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
        Aprobar
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleRechazar}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
        Rechazar
      </Button>
    </div>
  );
}
