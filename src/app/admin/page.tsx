import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { obtenerReclamosPendientes } from '@/actions/reclamos';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { ClipboardList, ArrowRight, Package, CheckCircle2, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await auth();
  const rol = (session?.user as { rol?: string })?.rol;

  if (!session?.user || rol !== 'admin') {
    redirect('/');
  }

  let reclamosPendientes: Awaited<ReturnType<typeof obtenerReclamosPendientes>> = [];
  let todosObjetos: (typeof schema.objetos.$inferSelect)[] = [];

  try {
    reclamosPendientes = await obtenerReclamosPendientes();
    todosObjetos = await db.query.objetos.findMany();
  } catch (error) {
    console.error('Error cargando datos de admin:', error);
  }

  const disponibles = todosObjetos.filter((o) => o.estado === 'disponible').length;
  const reclamados = todosObjetos.filter((o) => o.estado === 'reclamado').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-1">
          Supervisa los objetos encontrados y valida los reclamos de los alumnos
        </p>
      </div>

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

        {/* Objetos Entregados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
              <span>Entregados / Reclamados</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reclamados}</p>
            <p className="text-xs text-muted-foreground mt-1">Devueltos a su dueño</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
