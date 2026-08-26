'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';

export async function crearReclamo(objetoId: string, notas: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const [nuevoReclamo] = await db
    .insert(schema.reclamos)
    .values({
      objetoId,
      reclamadoPor: session.user.id,
      notas: notas || null,
      estado: 'pendiente',
    })
    .returning();

  revalidatePath(`/objetos/${objetoId}`);

  return nuevoReclamo;
}

export async function aprobarReclamo(reclamoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const rol = (session.user as { rol?: string })?.rol;
  if (rol !== 'admin') {
    throw new Error('No tienes permisos de administrador');
  }

  const reclamo = await db.query.reclamos.findFirst({
    where: eq(schema.reclamos.id, reclamoId),
  });

  if (!reclamo) {
    throw new Error('Reclamo no encontrado');
  }

  const [reclamoActualizado] = await db
    .update(schema.reclamos)
    .set({
      estado: 'aprobado',
    })
    .where(eq(schema.reclamos.id, reclamoId))
    .returning();

  await db
    .update(schema.objetos)
    .set({
      estado: 'reclamado',
      updatedAt: new Date(),
    })
    .where(eq(schema.objetos.id, reclamo.objetoId));

  revalidatePath('/admin/reclamos');
  revalidatePath('/objetos');
  revalidatePath(`/objetos/${reclamo.objetoId}`);

  return reclamoActualizado;
}

export async function rechazarReclamo(reclamoId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const rol = (session.user as { rol?: string })?.rol;
  if (rol !== 'admin') {
    throw new Error('No tienes permisos de administrador');
  }

  const [reclamoActualizado] = await db
    .update(schema.reclamos)
    .set({
      estado: 'rechazado',
    })
    .where(eq(schema.reclamos.id, reclamoId))
    .returning();

  revalidatePath('/admin/reclamos');

  return reclamoActualizado;
}

export async function obtenerReclamosPendientes() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const rol = (session.user as { rol?: string })?.rol;
  if (rol !== 'admin') {
    throw new Error('No tienes permisos de administrador');
  }

  const reclamosPendientes = await db.query.reclamos.findMany({
    where: eq(schema.reclamos.estado, 'pendiente'),
    orderBy: [desc(schema.reclamos.createdAt)],
    with: {
      objeto: {
        columns: {
          id: true,
          titulo: true,
          categoria: true,
          ubicacion: true,
          estado: true,
        },
      },
      usuario: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return reclamosPendientes;
}
