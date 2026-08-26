'use client';

import { useState, useTransition } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { crearReclamo } from '@/actions/reclamos';
import { Loader2, Hand } from 'lucide-react';
import { toast } from 'sonner';

interface ReclamarDialogProps {
  objetoId: string;
  objetoTitulo: string;
}

export function ReclamarDialog({ objetoId, objetoTitulo }: ReclamarDialogProps) {
  const [open, setOpen] = useState(false);
  const [notas, setNotas] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    startTransition(async () => {
      try {
        await crearReclamo(objetoId, notas);
        toast.success('Reclamo enviado correctamente');
        setOpen(false);
        setNotas('');
      } catch (error) {
        toast.error('Error al enviar el reclamo');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(buttonVariants({ size: 'lg' }), 'w-full sm:w-auto cursor-pointer')}
      >
        <Hand className="mr-2 h-5 w-5" />
        Es mío, reclamar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reclamar: {objetoTitulo}</DialogTitle>
          <DialogDescription>
            Describe algo que solo el dueño sabría sobre este objeto (color exacto, marca, contenido, etc.) para que el administrador pueda verificar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="notas">Descripción de identificación</Label>
            <Textarea
              id="notas"
              placeholder="Ej: Son audífonos Sony WH-1000XM4, tienen un sticker de gato en el lado derecho..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isPending || !notas.trim()}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
            ) : (
              'Enviar Reclamo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
