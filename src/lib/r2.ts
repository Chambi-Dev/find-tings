import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const DEFAULT_ACCOUNT_ID = '72cadfbbc1b16dca27d5484049f37261';
const DEFAULT_ENDPOINT = `https://${DEFAULT_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const DEFAULT_BUCKET = 'aynia-assets';
const DEFAULT_ACCESS_KEY = '0d93254a77893f6b1d98d6d6e57d4b2f';
const DEFAULT_SECRET_KEY = 'e9fbd8b21aa8b8b3223178db0c7b71bb5f43013a9eefba695b2c81457f653cc0';
const DEFAULT_PUBLIC_URL = 'https://pub-c41d04b30ab94b6a9eba8cb08a80f26c.r2.dev';

export function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint:
      process.env.R2_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : DEFAULT_ENDPOINT),
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || DEFAULT_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || DEFAULT_SECRET_KEY,
    },
  });
}

export async function getUploadUrl(key: string, contentType: string) {
  const r2 = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || DEFAULT_BUCKET;
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
  const r2 = getR2Client();
  const bucket = process.env.R2_BUCKET_NAME || DEFAULT_BUCKET;
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
  const base = process.env.R2_PUBLIC_URL || DEFAULT_PUBLIC_URL;
  return `${base}/${key}`;
}
