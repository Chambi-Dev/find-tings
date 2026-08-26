import { config } from 'dotenv';
config({ path: '.env.local' });
import { uploadBufferToR2 } from '../src/lib/r2';

async function test() {
  console.log('Testing R2 upload...');
  const testBuffer = Buffer.from('test image content 123');
  const testKey = `test-${Date.now()}.txt`;
  try {
    const url = await uploadBufferToR2(testBuffer, testKey, 'text/plain');
    console.log('Upload success! Public URL:', url);
    const res = await fetch(url);
    console.log('Fetch status:', res.status);
    const text = await res.text();
    console.log('Fetched content:', text);
  } catch (err) {
    console.error('Upload error:', err);
  }
}

test();
