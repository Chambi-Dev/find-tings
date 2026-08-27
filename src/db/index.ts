import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const DEFAULT_DB_URL =
  'postgresql://neondb_owner:npg_7MpBzIDwt6Kl@ep-gentle-lake-axskd67y-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Neon 1.x query client wrapper for Cloudflare Workers / Serverless edge runtimes
const dynamicClient = {
  query: (query: string, params: any[], options?: any) => {
    const url = process.env.DATABASE_URL || DEFAULT_DB_URL;
    const client = neon(url);
    return (client as any).query(query, params, options);
  },
};

export const db = drizzle(dynamicClient as any, { schema });
