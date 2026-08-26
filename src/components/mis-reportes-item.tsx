'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { marcarRecogido } from '@/actions/objetos';
import { getCategoryInfo } from '@/lib/categories';
import { formatPhoneDisplay, getWhatsappLink } from '@/lib/phone';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Calendar,
  Building2,
  UserCheck,
  CheckCircle2,
  Clock,
  MessageCircle,
  Mail,
  Loader2,
  Package,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReclamoItem {
  id: string;
  estado: string;
  notas: string | null;
  createdAt: Date;
  usuario: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    telefono?: string | null;
  } | null;
}

interface MisReportesItemProps {
  objeto: {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: string;
    ubicacion: string | null;
    custodia: string;
    telefonoContacto: string | null;
    fechaEncontrado: Date;
    estado: string;
    createdAt: Date;
    fotos: { id: string; url: string; orden: number }[];
    reclamos: ReclamoItem[];
    reclamosCount: number;
  };
}

export function MisReportesItem({ objeto }: MisReportesItemProps) {
  const [showClaims, setShowClaims] = useState(false);
  const [isPending, startTransition] = useTransition();
  const primeraFoto = objeto.fotos?.[0];
  const catInfo = getCategoryInfo(objeto.categoria);
  const CatIcon = catInfo.icon;

  function handleMarcarEntregado() {
    startTransition(async () => {
      try {
        await marcarRecogido(objeto.id);
        toast.success('¡Objeto marcado como entregado/reclamado!');
      } catch (error) {
        toast.error('Error al actualizar el estado');
      }
    });
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <div className="flex flex-col md:flex-row">
        {/* Foto de portada */}
        <div className="relative md:w-56 h-48 md:h-auto bg-muted shrink-0">
          {primeraFoto ? (
            <Image
              src={primeraFoto.url}
              alt={objeto.titulo}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 224px"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40">
              <Package className="h-12 w-12 stroke-1" />
              <span className="text-xs mt-1">Sin foto</span>
            </div>
          )}
          <Badge
            className={`absolute top-2 left-2 ${
              objeto.estado === 'disponible'
                ? 'bg-green-600 text-white'
                : 'bg-yellow-600 text-white'
            }`}
          >
            {objeto.estado === 'disponible' ? 'Disponible' : 'Entregado'}
          </Badge>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg">{objeto.titulo}</h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <CatIcon className="h-3.5 w-3.5 text-primary" />
                  <span>{catInfo.label}</span>
                </div>
              </div>
              <Link
                href={`/objetos/${objeto.id}`}
                className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'text-xs')}
              >
                Ver publicación
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </div>

            {objeto.descripcion && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {objeto.descripcion}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              {objeto.custodia === 'reportador' ? (
                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
                  <UserCheck className="h-3.5 w-3.5" />
                  Lo tienes tú ({objeto.telefonoContacto ? formatPhoneDisplay(objeto.telefonoContacto) : 'Sin WhatsApp'})
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                  <Building2 className="h-3.5 w-3.5" />
                  Entregado en Prefectura
                </span>
              )}
              {objeto.ubicacion && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {objeto.ubicacion}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(objeto.fechaEncontrado).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          </div>

          {/* Barra de acciones inferiores */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t mt-4">
            <button
              type="button"
              onClick={() => setShowClaims(!showClaims)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
            >
              <span>
                {objeto.reclamosCount}{' '}
                {objeto.reclamosCount === 1 ? 'reclamo recibido' : 'reclamos recibidos'}
              </span>
              {showClaims ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            {objeto.estado === 'disponible' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarcarEntregado}
                disabled={isPending}
                className="text-xs"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 mr-1" />
                )}
                Marcar como entregado a su dueño
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lista expandible de reclamos recibidos */}
      {showClaims && (
        <div className="bg-muted/30 p-5 border-t space-y-4 animate-in fade-in duration-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Alumnos que han reclamado este objeto:
          </h4>

          {objeto.reclamos.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              Aún ningún alumno ha reclamado este objeto.
            </p>
          ) : (
            <div className="space-y-3">
              {objeto.reclamos.map((rec) => {
                const cleanPhone = (rec.usuario?.telefono || '').replace(/[^0-9+]/g, '');
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(
                      `Hola ${rec.usuario?.name || ''}, vi tu reclamo sobre "${objeto.titulo}" en Find Tings.`
                    )}`
                  : null;

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-lg border bg-background space-y-2.5 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={rec.usuario?.image ?? ''} />
                          <AvatarFallback>{rec.usuario?.name?.charAt(0) ?? '?'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-xs leading-none">{rec.usuario?.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{rec.usuario?.email}</p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          rec.estado === 'aprobado'
                            ? 'default'
                            : rec.estado === 'rechazado'
                            ? 'destructive'
                            : 'outline'
                        }
                        className="text-[11px]"
                      >
                        {rec.estado === 'aprobado'
                          ? 'Aprobado'
                          : rec.estado === 'rechazado'
                          ? 'Rechazado'
                          : 'Pendiente de verificación'}
                      </Badge>
                    </div>

                    {rec.notas && (
                      <div className="p-2.5 rounded-md bg-muted/60 text-xs">
                        <p className="font-medium text-muted-foreground text-[11px] mb-1">
                          Detalles de identificación proporcionados por el alumno:
                        </p>
                        <p className="text-foreground italic">&ldquo;{rec.notas}&rdquo;</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>
                        Reclamado el{' '}
                        {new Date(rec.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>

                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium text-xs"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Contactar por WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
