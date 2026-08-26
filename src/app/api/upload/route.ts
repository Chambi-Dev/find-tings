import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { uploadBufferToR2 } from '@/lib/r2';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let fileType: string = 'image/jpeg';
    let ext: string = 'jpg';

    if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No se envió ningún archivo' },
          { status: 400 }
        );
      }
      fileType = file.type || 'image/jpeg';
      ext = file.name.split('.').pop() || 'jpg';
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else {
      // Raw binary upload
      fileType = contentType || 'image/jpeg';
      const filename = request.headers.get('x-filename') || 'foto.jpg';
      ext = filename.split('.').pop() || 'jpg';
      const bytes = await request.arrayBuffer();
      buffer = Buffer.from(bytes);
    }

    if (!buffer || buffer.length === 0) {
      return NextResponse.json(
        { error: 'El archivo está vacío' },
        { status: 400 }
      );
    }

    const key = `objetos/${crypto.randomUUID()}.${ext}`;
    const publicUrl = await uploadBufferToR2(buffer, key, fileType);

    return NextResponse.json({ url: publicUrl, publicUrl, key });
  } catch (error) {
    console.error('Error subiendo imagen a R2:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen a R2' },
      { status: 500 }
    );
  }
}
