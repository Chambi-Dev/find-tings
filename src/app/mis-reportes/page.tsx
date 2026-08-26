import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { obtenerMisReportes } from '@/actions/objetos';
import { MisReportesItem } from '@/components/mis-reportes-item';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Package } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MisReportesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  let misObjetos: Awaited<ReturnType<typeof obtenerMisReportes>> = [];
  try {
    misObjetos = await obtenerMisReportes();
  } catch (error) {
    console.error('Error cargando mis reportes:', error);
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mis Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los objetos que has encontrado y revisa los reclamos recibidos
          </p>
        </div>
        <Link href="/objetos/nuevo" className={cn(buttonVariants(), 'shrink-0')}>
          <Plus className="mr-2 h-4 w-4" />
          Reportar Objeto
        </Link>
      </div>

      {misObjetos.length > 0 ? (
        <div className="space-y-4">
          {misObjetos.map((objeto) => (
            <MisReportesItem key={objeto.id} objeto={objeto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border rounded-2xl bg-muted/20">
          <Package className="h-12 w-12 text-muted-foreground mx-auto stroke-1" />
          <p className="text-lg font-semibold mt-3">No has reportado ningún objeto</p>
          <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
            ¿Encontraste algo en el salón, cafetería o patio? Publícalo para ayudar a tu compañero a recuperarlo.
          </p>
          <Link href="/objetos/nuevo" className={cn(buttonVariants(), 'mt-5')}>
            <Plus className="mr-2 h-4 w-4" />
            Reportar Objeto Encontrado
          </Link>
        </div>
      )}
    </div>
  );
}
