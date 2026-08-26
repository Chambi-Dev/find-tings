import { Suspense } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { obtenerObjetos } from '@/actions/objetos';
import { ObjetoCard } from '@/components/objeto-card';
import { GaleriaFiltros } from '@/components/galeria-filtros';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ObjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; busqueda?: string }>;
}) {
  const params = await searchParams;
  let objetos: Awaited<ReturnType<typeof obtenerObjetos>> = [];
  try {
    objetos = await obtenerObjetos({
      categoria: params.categoria,
      busqueda: params.busqueda,
    });
  } catch (error) {
    console.error('Error cargando objetos:', error);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Objetos Encontrados</h1>
        <Link href="/objetos/nuevo" className={cn(buttonVariants())}>
          <Plus className="mr-2 h-4 w-4" />
          Reportar
        </Link>
      </div>

      <Suspense fallback={<div>Cargando filtros...</div>}>
        <GaleriaFiltros />
      </Suspense>

      {objetos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {objetos.map((objeto) => (
            <ObjetoCard key={objeto.id} objeto={objeto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No se encontraron objetos</p>
          <p className="text-muted-foreground mt-2">
            {params.busqueda || params.categoria
              ? 'Intenta con otros filtros'
              : 'Aún no hay objetos reportados'}
          </p>
        </div>
      )}
    </div>
  );
}
