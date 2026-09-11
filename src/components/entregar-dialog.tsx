'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Loader2, UserCheck, IdCard, FileText } from 'lucide-react';
import { marcarRecogido } from '@/actions/objetos';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReclamanteInfo {
  id: string;
  name: string | null;
  email: string | null;
  telefono?: string | null;
}

interface EntregarDialogProps {
  objetoId: string;
  objetoTitulo: string;
  reclamantes?: ReclamanteInfo[];
  buttonVariant?: 'default' | 'outline' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg';
  className?: string;
  onSuccess?: () => void;
}

export function EntregarDialog({
  objetoId,
  objetoTitulo,
  reclamantes = [],
  buttonVariant = 'outline',
  buttonSize = 'sm',
  className,
  onSuccess,
}: EntregarDialogProps) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [notas, setNotas] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Por favor ingresa el nombre de la persona que recibe el objeto');
      return;
    }

    startTransition(async () => {
      try {
        await marcarRecogido(objetoId, {
          nombre: nombre.trim(),
          documento: documento.trim() || undefined,
          notas: notas.trim() || undefined,
        });

        toast.success(`¡Objeto marcado como entregado a ${nombre.trim()}!`);
        setOpen(false);
        setNombre('');
        setDocumento('');
        setNotas('');
        onSuccess?.();
      } catch (error) {
        console.error('Error registrando entrega:', error);
        toast.error(
          error instanceof Error ? error.message : 'Error al registrar la entrega. Intenta de nuevo.'
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: buttonVariant, size: buttonSize }),
          'cursor-pointer',
          className
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mr-1.5" />
        Marcar como entregado a su dueño
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            Registrar Entrega de Objeto
          </DialogTitle>
          <DialogDescription>
            Indica los datos de la persona a quien le estás entregando{' '}
            <span className="font-medium text-foreground">&ldquo;{objetoTitulo}&rdquo;</span>.
            Esta información quedará registrada en el historial del instituto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Autocompletado rápido si hay alumnos que reclamaron */}
          {reclamantes.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-lg border space-y-1.5">
              <span className="text-xs font-semibold text-muted-foreground block">
                Seleccionar alumno de los reclamos recibidos:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reclamantes
                  .filter((r) => r.name)
                  .map((rec) => (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => setNombre(rec.name || '')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-background hover:bg-primary/10 hover:text-primary border transition-colors cursor-pointer"
                    >
                      <UserCheck className="h-3 w-3 text-primary" />
                      {rec.name}
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Nombre de quien recibe */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-sm font-semibold flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              Nombre completo de quien recibe *
            </Label>
            <Input
              id="nombre"
              placeholder="Ej: Juan Carlos Pérez Ramos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* DNI o Carnet */}
          <div className="space-y-2">
            <Label htmlFor="documento" className="text-sm font-semibold flex items-center gap-1.5">
              <IdCard className="h-4 w-4 text-muted-foreground" />
              DNI o Carnet de estudiante (Opcional)
            </Label>
            <Input
              id="documento"
              placeholder="Ej: 72345678 o Carnet 2024-EST-12"
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
            />
          </div>

          {/* Notas de la entrega */}
          <div className="space-y-2">
            <Label htmlFor="notas" className="text-sm font-semibold flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Observaciones / Notas (Opcional)
            </Label>
            <Textarea
              id="notas"
              placeholder="Ej: Se comprobó su carnet institucional y desbloqueó el teléfono frente a mí..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || !nombre.trim()}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Registrando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
