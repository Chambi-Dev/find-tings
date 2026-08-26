'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FotoUpload } from '@/components/foto-upload';
import { crearObjeto } from '@/actions/objetos';
import { CATEGORIAS } from '@/lib/categories';
import { formatPhoneDisplay } from '@/lib/phone';
import {
  Loader2,
  Building2,
  UserCheck,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function ObjetoForm() {
  const [fotos, setFotos] = useState<string[]>([]);
  const [custodia, setCustodia] = useState<'prefectura' | 'reportador'>('prefectura');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    if (custodia === 'reportador' && !telefono.trim()) {
      toast.error('Por favor ingresa tu número de WhatsApp para que el dueño pueda contactarte');
      return;
    }

    setSubmitting(true);
    try {
      // Add fotos as JSON string
      formData.set('fotos', JSON.stringify(fotos));
      formData.set('custodia', custodia);
      if (custodia === 'reportador') {
        formData.set('telefonoContacto', telefono.trim());
      }
      const res = await crearObjeto(formData);
      if (res?.success) {
        toast.success('¡Objeto reportado exitosamente!');
        router.push('/objetos');
        router.refresh();
      }
    } catch (error) {
      console.error('Error creando objeto:', error);
      toast.error('Error al crear el reporte. Intenta de nuevo.');
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo" className="font-semibold">
          Título del objeto *
        </Label>
        <Input
          id="titulo"
          name="titulo"
          placeholder="Ej: Audífonos inalámbricos Sony negros"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descripcion" className="font-semibold">
          Descripción
        </Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          placeholder="Describe características visibles (color, marca, estado, detalles que no comprometan la verificación)..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="categoria" className="font-semibold">
            Categoría *
          </Label>
          <Select name="categoria" required>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar categoría" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS.map((cat) => {
                const Icon = cat.icon;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ubicacion" className="font-semibold flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            Lugar donde lo encontraste
          </Label>
          <Input
            id="ubicacion"
            name="ubicacion"
            placeholder="Ej: Salón 302, Cafetería, Biblioteca..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fechaEncontrado" className="font-semibold flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          Fecha en que se encontró *
        </Label>
        <Input
          id="fechaEncontrado"
          name="fechaEncontrado"
          type="date"
          defaultValue={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {/* Custodia del objeto */}
      <div className="space-y-3 p-4 bg-muted/40 rounded-xl border">
        <Label className="font-semibold text-base block">
          ¿Dónde está el objeto ahora mismo? *
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCustodia('prefectura')}
            className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
              custodia === 'prefectura'
                ? 'border-primary bg-primary/10 text-foreground ring-2 ring-primary/20'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <Building2
              className={`h-5 w-5 mt-0.5 shrink-0 ${
                custodia === 'prefectura' ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <div>
              <p className="font-medium text-sm text-foreground">
                En Prefectura / Portería
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lo entregué para que el dueño lo recoja con su carnet.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCustodia('reportador')}
            className={`p-3 rounded-lg border text-left transition-all flex items-start gap-3 cursor-pointer ${
              custodia === 'reportador'
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 text-foreground ring-2 ring-blue-500/20'
                : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <UserCheck
              className={`h-5 w-5 mt-0.5 shrink-0 ${
                custodia === 'reportador' ? 'text-blue-600' : 'text-muted-foreground'
              }`}
            />
            <div>
              <p className="font-medium text-sm text-foreground">
                Lo tengo yo
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Lo guardo yo y el dueño me contactará por WhatsApp para la entrega.
              </p>
            </div>
          </button>
        </div>

        {custodia === 'reportador' && (
          <div className="mt-3 pt-3 border-t space-y-2 animate-in fade-in duration-200">
            <Label htmlFor="telefonoContacto" className="font-medium text-sm flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
              <MessageCircle className="h-4 w-4" />
              Tu número de WhatsApp para contacto *
            </Label>
            <Input
              id="telefonoContacto"
              placeholder="Ej: 987654321 o +51 987 654 321"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              required={custodia === 'reportador'}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {telefono.trim() ? (
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Se vinculará como: {formatPhoneDisplay(telefono)}
                  </span>
                ) : (
                  'Puedes escribir solo tus 9 dígitos (la app le añade el +51 de Perú automáticamente).'
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="font-semibold">Fotos del objeto</Label>
        <p className="text-sm text-muted-foreground">
          Sube hasta 5 fotos claras. La primera será la foto de portada.
        </p>
        <FotoUpload fotos={fotos} onFotosChange={setFotos} maxFotos={5} />
      </div>

      <Button type="submit" className="w-full" disabled={submitting} size="lg">
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Publicando...
          </>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Publicar Objeto Encontrado
          </span>
        )}
      </Button>
    </form>
  );
}
