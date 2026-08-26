import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { obtenerObjetos } from '@/actions/objetos';
import { ObjetoCard } from '@/components/objeto-card';
import { Search, Plus, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let objetosRecientes: Awaited<ReturnType<typeof obtenerObjetos>> = [];
  try {
    objetosRecientes = await obtenerObjetos();
  } catch (error) {
    console.error('Error cargando objetos en inicio:', error);
  }
  const recientes = objetosRecientes.slice(0, 6);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          ¿Encontraste algo?{' '}
          <span className="text-primary">¿Perdiste algo?</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find Tings conecta a la comunidad del instituto. Reporta objetos
          encontrados o busca lo que perdiste. Simple, rápido y gratis.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/objetos/nuevo"
            className={cn(buttonVariants({ size: 'lg' }))}
          >
            <Plus className="mr-2 h-5 w-5" />
            Reportar Objeto
          </Link>
          <Link
            href="/objetos"
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
          >
            <Search className="mr-2 h-5 w-5" />
            Buscar Objetos
          </Link>
        </div>
      </section>

      {/* Recent objects */}
      {recientes.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Objetos Recientes</h2>
            <Link
              href="/objetos"
              className={cn(buttonVariants({ variant: 'ghost' }))}
            >
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recientes.map((objeto) => (
              <ObjetoCard key={objeto.id} objeto={objeto} />
            ))}
          </div>
        </section>
      )}

      {recientes.length === 0 && (
        <section className="text-center py-12">
          <p className="text-xl text-muted-foreground">No hay objetos reportados aún.</p>
          <p className="text-muted-foreground mt-2">¡Sé el primero en reportar un objeto encontrado!</p>
        </section>
      )}
    </div>
  );
}
