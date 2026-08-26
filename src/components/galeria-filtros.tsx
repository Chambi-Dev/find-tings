'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

import { CATEGORIAS } from '@/lib/categories';
import { Layers } from 'lucide-react';

export function GaleriaFiltros() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState(searchParams.get('busqueda') || '');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateFilters = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'todas') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/objetos?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  // Debounce search
  const handleSearch = (value: string) => {
    setBusqueda(value);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      updateFilters('busqueda', value);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar objetos..."
          value={busqueda}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select
        value={searchParams.get('categoria') ?? 'todas'}
        onValueChange={(value) => updateFilters('categoria', value)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span>Todas las categorías</span>
            </span>
          </SelectItem>
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
  );
}
