import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { obtenerReclamosPendientes } from '@/actions/reclamos';
import { obtenerObjetosEntregados } from '@/actions/objetos';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  ClipboardList,
  ArrowRight,
  Package,
  CheckCircle2,
  Search,
  UserCheck,
  Calendar,
  IdCard,
  Building2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { getCategoryInfo } from '@/lib/categories';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  const rol = (session?.user as { rol?: string })?.rol;

  if (!session?.user || rol !== 'admin') {
    redirect('/');
  }

  let reclamosPendientes: Awaited<ReturnType<typeof obtenerReclamosPendientes>> = [];
  let todosObjetos: (typeof schema.objetos.$inferSelect)[] = [];
  let entregadosRecientes: Awaited<ReturnType<typeof obtenerObjetosEntregados>> = [];

  try {
    reclamosPendientes = await obtenerReclamosPendientes();
    todosObjetos = await db.query.objetos.findMany();
    entregadosRecientes = await obtenerObjetosEntregados();
  } catch (error) {
    console.error('Error cargando datos de admin:', error);
  }

  const disponibles = todosObjetos.filter((o) => o.estado === 'disponible').length;
  const reclamados = todosObjetos.filter((o) => o.estado === 'reclamado').length;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Supervisa los objetos encontrados, valida reclamos y audita el historial de entregas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Reclamos pendientes */}
        <Card className="border-orange-200 dark:border-orange-900">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Reclamos Pendientes</span>
              <ClipboardList className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {reclamosPendientes.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Requieren tu aprobación</p>
            <Link
              href="/admin/reclamos"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}
            >
              Revisar Reclamos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Total Objetos */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Total Objetos</span>
              <Package className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todosObjetos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Reportados en el instituto</p>
            <Link
              href="/objetos"
              className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-4 w-full')}
            >
              Ver Galería
              <Search className="ml-2 h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* Objetos Disponibles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Sin Reclamar</span>
              <Search className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{disponibles}</p>
            <p className="text-xs text-muted-foreground mt-1">Esperando a su dueño</p>
          </CardContent>
        </Card>

        {/* Objetos Entregados (KPI con Auditoría) */}
        <Card className="border-green-200 dark:border-green-900 bg-green-50/30 dark:bg-green-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Entregados a su Dueño</span>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reclamados}</p>
            <p className="text-xs text-muted-foreground mt-1">Objetos devueltos con éxito</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Entregas Realizadas (Auditoría) */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Historial de Objetos Entregados (Auditoría)
            </CardTitle>
            <CardDescription className="mt-1">
              Registro completo de personas que han retirado objetos del instituto con su respectivo responsable.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-semibold text-xs self-start sm:self-auto">
            {entregadosRecientes.length} {entregadosRecientes.length === 1 ? 'entrega registrada' : 'entregas registradas'}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {entregadosRecientes.length > 0 ? (
            <div className="divide-y">
              {entregadosRecientes.map((item) => {
                const catInfo = getCategoryInfo(item.categoria);
                const CatIcon = catInfo.icon;
                const fotoPortada = item.fotos?.[0]?.url;

                return (
                  <div
                    key={item.id}
                    className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Foto miniatura */}
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted border shrink-0">
                        {fotoPortada ? (
                          <Image
                            src={fotoPortada}
                            alt={item.titulo}
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Package className="h-6 w-6 stroke-1" />
                          </div>
                        )}
                      </div>

                      {/* Detalles del objeto */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/objetos/${item.id}`}
                            className="font-bold text-base hover:text-primary hover:underline transition-colors flex items-center gap-1.5"
                          >
                            <span>{item.titulo}</span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </Link>
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <CatIcon className="h-3 w-3" />
                            <span>{catInfo.label}</span>
                          </Badge>
                        </div>

                        {/* Datos de entrega a la persona */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground pt-0.5">
                          <span className="flex items-center gap-1.5 font-semibold text-green-700 dark:text-green-400">
                            <UserCheck className="h-4 w-4 shrink-0" />
                            Entregado a: {item.entregadoANombre || 'No especificado'}
                          </span>

                          {item.entregadoADocumento && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md border">
                              <IdCard className="h-3.5 w-3.5" />
                              Doc: {item.entregadoADocumento}
                            </span>
                          )}
                        </div>

                        {/* Notas adicionales si existen */}
                        {item.entregadoNotas && (
                          <p className="text-xs text-muted-foreground italic pt-1">
                            &ldquo;{item.entregadoNotas}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadatos de auditoría: fecha y entregador */}
                    <div className="flex flex-col sm:items-end gap-1 text-xs text-muted-foreground border-t md:border-t-0 pt-3 md:pt-0 shrink-0">
                      {item.fechaEntrega && (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          Entregado el{' '}
                          {new Date(item.fechaEntrega).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}

                      <span className="text-[11px]">
                        Registrado por:{' '}
                        <span className="font-semibold text-foreground">
                          {item.entregador?.name || item.reportadoPor?.name || 'Administración'}
                        </span>
                      </span>

                      {item.custodia === 'reportador' ? (
                        <span className="text-[11px] text-blue-600 dark:text-blue-400">
                          (Custodia: Alumno que lo encontró)
                        </span>
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                          (Custodia: Coordinación / Área de Limpieza)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto stroke-1 mb-2 opacity-60" />
              <p className="font-medium text-sm">Aún no hay objetos marcados como entregados</p>
              <p className="text-xs mt-0.5">
                Cuando un alumno o la coordinación entregue un objeto a su dueño, el registro aparecerá aquí.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
