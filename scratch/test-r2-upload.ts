import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const DEFAULT_ENDPOINT = 'https://72cadfbbc1b16dca27d5484049f37261.r2.cloudflarestorage.com';
const DEFAULT_BUCKET = 'aynia-assets';
const DEFAULT_ACCESS_KEY = '0d93254a77893f6b1d98d6d6e57d4b2f';
const DEFAULT_SECRET_KEY = 'e9fbd8b21aa8b8b3223178db0c7b71bb5f43013a9eefba695b2c81457f653cc0';

async function main() {
  const r2 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || DEFAULT_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || DEFAULT_ACCESS_KEY,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || DEFAULT_SECRET_KEY,
    },
  });

  const dummyData = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]);
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || DEFAULT_BUCKET,
    Key: 'test/test-upload.jpg',
    Body: dummyData,
    ContentType: 'image/jpeg',
    ContentLength: dummyData.byteLength,
  });

  const res = await r2.send(command);
  console.log('R2 Upload result:', res);
}

main().catch(console.error);
