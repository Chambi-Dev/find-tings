import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { obtenerReclamosPendientes } from '@/actions/reclamos';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ReclamoActions } from '@/components/reclamo-actions';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, MessageCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export default async function AdminReclamosPage() {
  const session = await auth();
  const rol = (session?.user as { rol?: string })?.rol;

  if (!session?.user || rol !== 'admin') {
    redirect('/');
  }

  let reclamos: Awaited<ReturnType<typeof obtenerReclamosPendientes>> = [];
  try {
    reclamos = await obtenerReclamosPendientes();
  } catch {
    reclamos = [];
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver al panel
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Reclamos Pendientes</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {reclamos.length} {reclamos.length === 1 ? 'reclamo por verificar' : 'reclamos por verificar'}
          </p>
        </div>
      </div>

      {reclamos.length > 0 ? (
        <div className="space-y-4">
          {reclamos.map((reclamo) => {
            const catInfo = getCategoryInfo(reclamo.objeto?.categoria ?? '');
            const CatIcon = catInfo.icon;

            return (
              <Card key={reclamo.id} className="border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={reclamo.usuario?.image ?? ''} />
                        <AvatarFallback>
                          {reclamo.usuario?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1.5 flex-1">
                        <div>
                          <p className="font-semibold text-base leading-tight">{reclamo.usuario?.name}</p>
                          <p className="text-xs text-muted-foreground">{reclamo.usuario?.email}</p>
                        </div>

                        <div className="flex items-center gap-2 mt-2 pt-1">
                          <span className="text-xs text-muted-foreground">Reclama:</span>
                          <Link
                            href={`/objetos/${reclamo.objeto?.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            {reclamo.objeto?.titulo}
                          </Link>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <CatIcon className="h-3 w-3" />
                            <span>{catInfo.label}</span>
                          </Badge>
                        </div>

                        {reclamo.notas && (
                          <div className="text-xs text-muted-foreground mt-2 bg-muted/60 p-3 rounded-lg border">
                            <span className="font-semibold text-foreground block mb-1">
                              Prueba de propiedad / descripción del alumno:
                            </span>
                            &ldquo;{reclamo.notas}&rdquo;
                          </div>
                        )}

                        <p className="text-[11px] text-muted-foreground pt-1">
                          Enviado el{' '}
                          {new Date(reclamo.createdAt).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="sm:self-center shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                      <ReclamoActions reclamoId={reclamo.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/20">
          <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto stroke-1" />
          <p className="text-lg font-semibold mt-3">No hay reclamos pendientes</p>
          <p className="text-muted-foreground text-sm mt-1">Todos los reclamos han sido atendidos.</p>
        </div>
      )}
    </div>
  );
}
