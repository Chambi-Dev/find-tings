import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy neon client wrapper to support Cloudflare Workers / Edge runtime
const dynamicNeon = (query: string, params: any[]) => {
  const url =
    process.env.DATABASE_URL ||
    'postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb';
  const client = neon(url);
  return (client as any)(query, params);
};

export const db = drizzle(dynamicNeon as any, { schema });
