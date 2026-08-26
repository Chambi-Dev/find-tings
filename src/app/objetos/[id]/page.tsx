import { notFound } from 'next/navigation';
import Image from 'next/image';
import { obtenerObjeto } from '@/actions/objetos';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ReclamarDialog } from '@/components/reclamar-dialog';
import {
  MapPin,
  Calendar,
  Clock,
  Building2,
  UserCheck,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { getCategoryInfo } from '@/lib/categories';
import { formatPhoneDisplay, getWhatsappLink } from '@/lib/phone';

const estadoLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  disponible: { label: 'Disponible', variant: 'default' },
  reclamado: { label: 'Reclamado / Entregado', variant: 'secondary' },
  archivado: { label: 'Archivado', variant: 'outline' },
};

export const dynamic = 'force-dynamic';

export default async function ObjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const objeto = await obtenerObjeto(id);
  const session = await auth();

  if (!objeto) {
    notFound();
  }

  const catInfo = getCategoryInfo(objeto.categoria);
  const CatIcon = catInfo.icon;
  const estado = estadoLabels[objeto.estado] || estadoLabels.disponible;
  const canClaim =
    session?.user &&
    objeto.estado === 'disponible' &&
    objeto.reportadoPor?.id !== session.user.id;

  const formattedPhone = objeto.telefonoContacto
    ? formatPhoneDisplay(objeto.telefonoContacto)
    : '';

  const whatsappUrl = objeto.telefonoContacto
    ? getWhatsappLink(
        objeto.telefonoContacto,
        `Hola, vi tu publicación en Find Tings sobre "${objeto.titulo}". Creo que me pertenece.`
      )
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Photo gallery */}
      {objeto.fotos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objeto.fotos.map((foto, index) => (
            <div
              key={foto.id}
              className={`relative rounded-lg overflow-hidden bg-muted ${
                index === 0 && objeto.fotos.length > 1 ? 'md:col-span-2 aspect-video' : 'aspect-square'
              }`}
            >
              <Image
                src={foto.url}
                alt={`${objeto.titulo} - foto ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="md:col-span-2 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{objeto.titulo}</h1>
              <div className="flex items-center gap-1.5 text-muted-foreground mt-1 font-medium">
                <CatIcon className="h-4 w-4 text-primary" />
                <span>{catInfo.label}</span>
              </div>
            </div>
            <Badge variant={estado.variant}>{estado.label}</Badge>
          </div>

          {objeto.descripcion && (
            <div className="space-y-2">
              <h3 className="font-semibold text-base">Descripción</h3>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {objeto.descripcion}
              </p>
            </div>
          )}

          {/* Dónde está el objeto (Custodia) */}
          <div className="p-4 rounded-xl border bg-muted/30 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              ¿Dónde se encuentra este objeto?
            </h3>
            {objeto.custodia === 'reportador' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-blue-700 dark:text-blue-300">
                  <UserCheck className="h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">En posesión del alumno que lo encontró</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Puedes coordinar directamente la entrega a través de WhatsApp o enviar tu reclamo.
                    </p>
                  </div>
                </div>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contactar por WhatsApp ({formattedPhone})
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-2.5 text-sm text-amber-700 dark:text-amber-300">
                <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Entregado en Prefectura / Portería</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Este objeto está resguardado en la oficina. Si es tuyo, envía tu reclamo y acércate con tu identificación escolar.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-1">
            {objeto.ubicacion && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Hallado en: {objeto.ubicacion}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              Encontrado el{' '}
              {new Date(objeto.fechaEncontrado).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Publicado el{' '}
              {new Date(objeto.createdAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>

          {canClaim && (
            <>
              <Separator />
              <div className="pt-2">
                <ReclamarDialog objetoId={objeto.id} objetoTitulo={objeto.titulo} />
              </div>
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Reporter info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reportado por
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={objeto.reportadoPor?.image ?? ''} />
                <AvatarFallback>
                  {objeto.reportadoPor?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{objeto.reportadoPor?.name ?? 'Alumno'}</p>
                <p className="text-xs text-muted-foreground truncate">{objeto.reportadoPor?.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Claims */}
          {objeto.reclamos && objeto.reclamos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Reclamos ({objeto.reclamos.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {objeto.reclamos.map((reclamo) => (
                  <div key={reclamo.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={reclamo.usuario?.image ?? ''} />
                      <AvatarFallback>{reclamo.usuario?.name?.charAt(0) ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{reclamo.usuario?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{reclamo.notas}</p>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {reclamo.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
