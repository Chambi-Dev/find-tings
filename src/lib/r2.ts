import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function getR2Client(): S3Client {
  const endpoint =
    process.env.R2_ENDPOINT ||
    (process.env.R2_ACCOUNT_ID
      ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : undefined);

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('Las credenciales de Cloudflare R2 no están configuradas en las variables de entorno.');
  }

  return new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function getUploadUrl(key: string, contentType: string) {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME no está configurado.');
  }

  const r2 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  return signedUrl;
}

export async function uploadBufferToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
) {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('R2_BUCKET_NAME no está configurado.');
  }

  const r2 = getR2Client();
  const uint8Data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: uint8Data,
    ContentType: contentType,
    ContentLength: uint8Data.byteLength,
  });

  await r2.send(command);
  return getPublicUrl(key);
}

export function getPublicUrl(key: string) {
  const base = process.env.R2_PUBLIC_URL;
  if (!base) {
    throw new Error('R2_PUBLIC_URL no está configurado.');
  }
  return `${base}/${key}`;
}
