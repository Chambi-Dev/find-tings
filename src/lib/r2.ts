import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint:
        process.env.R2_ENDPOINT ||
        `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return client;
}

export async function getUploadUrl(key: string, contentType: string) {
  const r2 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
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
  const r2 = getR2Client();
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await r2.send(command);
  return getPublicUrl(key);
}

export function getPublicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
