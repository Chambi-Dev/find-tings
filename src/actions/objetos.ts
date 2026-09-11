'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { eq, desc, asc, ilike, or, and } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';
import { normalizeWhatsappNumber } from '@/lib/phone';

export async function crearObjeto(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const titulo = formData.get('titulo') as string;
  const descripcion = (formData.get('descripcion') as string) || null;
  const categoria = formData.get('categoria') as (typeof schema.categoriaEnum.enumValues)[number];
  const ubicacion = (formData.get('ubicacion') as string) || null;
  const custodia = (formData.get('custodia') as (typeof schema.custodiaEnum.enumValues)[number]) || 'prefectura';
  const rawTelefono = (formData.get('telefonoContacto') as string) || null;
  const telefonoContacto = rawTelefono ? normalizeWhatsappNumber(rawTelefono) : null;
  const fechaEncontradoRaw = formData.get('fechaEncontrado') as string;
  const fechaEncontrado = fechaEncontradoRaw
    ? new Date(fechaEncontradoRaw)
    : new Date();

  if (!titulo || !categoria) {
    throw new Error('El título y la categoría son obligatorios');
  }

  // Update user's phone in profile if provided
  if (telefonoContacto) {
    await db
      .update(schema.usuarios)
      .set({ telefono: telefonoContacto })
      .where(eq(schema.usuarios.id, session.user.id));
  }

  const fotosRaw = formData.get('fotos') as string | null;
  let fotosUrls: string[] = [];
  if (fotosRaw) {
    try {
      const parsed = JSON.parse(fotosRaw);
      if (Array.isArray(parsed)) {
        fotosUrls = parsed;
      }
    } catch {
      // Ignorar error de parsing si viene en formato no JSON
    }
  }

  const [nuevoObjeto] = await db
    .insert(schema.objetos)
    .values({
      titulo,
      descripcion,
      categoria,
      ubicacion,
      custodia,
      telefonoContacto,
      fechaEncontrado,
      reportadoPor: session.user.id,
    })
    .returning();

  const validFotosUrls = fotosUrls.filter(
    (url): url is string => typeof url === 'string' && url.trim().length > 0
  );

  if (validFotosUrls.length > 0) {
    await db.insert(schema.fotos).values(
      validFotosUrls.map((url, index) => ({
        objetoId: nuevoObjeto.id,
        url,
        orden: index,
      }))
    );
  }

  revalidatePath('/objetos');
  return { success: true, id: nuevoObjeto.id };
}

export async function obtenerObjetos(filtros?: {
  categoria?: string;
  busqueda?: string;
}) {
  const conditions = [eq(schema.objetos.estado, 'disponible')];

  if (
    filtros?.categoria &&
    filtros.categoria !== 'todas' &&
    filtros.categoria !== 'todos' &&
    filtros.categoria.trim() !== ''
  ) {
    conditions.push(
      eq(
        schema.objetos.categoria,
        filtros.categoria as (typeof schema.categoriaEnum.enumValues)[number]
      )
    );
  }

  if (filtros?.busqueda && filtros.busqueda.trim() !== '') {
    const busquedaTerm = `%${filtros.busqueda.trim()}%`;
    conditions.push(
      or(
        ilike(schema.objetos.titulo, busquedaTerm),
        ilike(schema.objetos.descripcion, busquedaTerm)
      )!
    );
  }

  const resultados = await db.query.objetos.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.objetos.createdAt)],
    with: {
      fotos: {
        orderBy: (fotos, { asc }) => [asc(fotos.orden)],
      },
      reportadoPor: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return resultados;
}

export async function obtenerObjeto(id: string) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || typeof id !== 'string' || !uuidRegex.test(id)) {
    return null;
  }

  const objeto = await db.query.objetos.findFirst({
    where: eq(schema.objetos.id, id),
    with: {
      fotos: {
        orderBy: (fotos, { asc }) => [asc(fotos.orden)],
      },
      reportadoPor: {
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      reclamos: {
        orderBy: (reclamos, { desc }) => [desc(reclamos.createdAt)],
        with: {
          usuario: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
      entregador: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return objeto ?? null;
}

export interface DatosEntrega {
  nombre: string;
  documento?: string;
  notas?: string;
}

export async function marcarRecogido(id: string, datosEntrega: DatosEntrega) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const objeto = await db.query.objetos.findFirst({
    where: eq(schema.objetos.id, id),
  });

  if (!objeto) {
    throw new Error('Objeto no encontrado');
  }

  const rol = (session.user as { rol?: string })?.rol;
  const esAdmin = rol === 'admin';
  const esReportador = objeto.reportadoPor === session.user.id;

  if (!esAdmin && !esReportador) {
    throw new Error('No tienes permisos para realizar esta acción');
  }

  const nombreReceptor = datosEntrega?.nombre?.trim();
  if (!nombreReceptor) {
    throw new Error('El nombre de la persona a quien se le entrega el objeto es obligatorio');
  }

  const [objetoActualizado] = await db
    .update(schema.objetos)
    .set({
      estado: 'reclamado',
      entregadoANombre: nombreReceptor,
      entregadoADocumento: datosEntrega.documento?.trim() || null,
      entregadoNotas: datosEntrega.notas?.trim() || null,
      fechaEntrega: new Date(),
      entregadoPor: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.objetos.id, id))
    .returning();

  revalidatePath('/objetos');
  revalidatePath(`/objetos/${id}`);
  revalidatePath('/mis-reportes');
  revalidatePath('/admin');

  return objetoActualizado;
}

export async function obtenerObjetosEntregados() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const rol = (session.user as { rol?: string })?.rol;
  if (rol !== 'admin') {
    throw new Error('No tienes permisos de administrador');
  }

  const entregados = await db.query.objetos.findMany({
    where: eq(schema.objetos.estado, 'reclamado'),
    orderBy: [desc(schema.objetos.fechaEntrega), desc(schema.objetos.updatedAt)],
    with: {
      reportadoPor: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      entregador: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      fotos: {
        limit: 1,
        orderBy: (fotos, { asc }) => [asc(fotos.orden)],
      },
    },
  });

  return entregados;
}

export async function obtenerMisReportes() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autorizado');
  }

  const misObjetos = await db.query.objetos.findMany({
    where: eq(schema.objetos.reportadoPor, session.user.id),
    orderBy: [desc(schema.objetos.createdAt)],
    with: {
      fotos: {
        orderBy: (fotos, { asc }) => [asc(fotos.orden)],
      },
      reclamos: {
        orderBy: (reclamos, { desc }) => [desc(reclamos.createdAt)],
        with: {
          usuario: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              telefono: true,
            },
          },
        },
      },
    },
  });

  return misObjetos.map((obj) => ({
    ...obj,
    reclamosCount: obj.reclamos.length,
  }));
}
