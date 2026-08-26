import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MapPin, Calendar, Building2, UserCheck, Package } from 'lucide-react';
import { getCategoryInfo } from '@/lib/categories';

const estadoColors: Record<string, string> = {
  disponible: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  reclamado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  archivado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

interface ObjetoCardProps {
  objeto: {
    id: string;
    titulo: string;
    descripcion: string | null;
    categoria: string;
    ubicacion: string | null;
    custodia?: string | null;
    fechaEncontrado: Date;
    estado: string;
    fotos: { id: string; url: string; orden: number }[];
    reportadoPor?: { name: string | null; image: string | null } | null;
  };
}

export function ObjetoCard({ objeto }: ObjetoCardProps) {
  const primeraFoto = objeto.fotos?.[0];
  const catInfo = getCategoryInfo(objeto.categoria);
  const CatIcon = catInfo.icon;

  return (
    <Link href={`/objetos/${objeto.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
        <div className="relative aspect-square bg-muted">
          {primeraFoto ? (
            <Image
              src={primeraFoto.url}
              alt={objeto.titulo}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
              <Package className="h-16 w-16 stroke-1" />
              <span className="text-xs mt-2 font-medium">Sin foto</span>
            </div>
          )}
          {objeto.fotos.length > 1 && (
            <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{objeto.fotos.length - 1} fotos
            </span>
          )}
          <Badge
            className={`absolute top-2 left-2 ${estadoColors[objeto.estado] ?? ''}`}
            variant="secondary"
          >
            {objeto.estado === 'disponible'
              ? 'Disponible'
              : objeto.estado === 'reclamado'
              ? 'Reclamado / Entregado'
              : objeto.estado}
          </Badge>
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-lg truncate">{objeto.titulo}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <CatIcon className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{catInfo.label}</span>
          </div>
          {objeto.descripcion && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {objeto.descripcion}
            </p>
          )}
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex flex-col items-start gap-1 text-xs text-muted-foreground border-t pt-3">
          {objeto.custodia === 'reportador' ? (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
              <UserCheck className="h-3.5 w-3.5" />
              Lo tiene el alumno que lo encontró
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <Building2 className="h-3.5 w-3.5" />
              En Prefectura / Portería
            </span>
          )}
          {objeto.ubicacion && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Hallado en: {objeto.ubicacion}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {new Date(objeto.fechaEncontrado).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
