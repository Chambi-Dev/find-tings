import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Neon 1.x query client wrapper for Cloudflare Workers / Serverless edge runtimes
const dynamicClient = {
  query: (query: string, params: any[], options?: any) => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL no está configurada en las variables de entorno.');
    }
    const client = neon(url);
    return (client as any).query(query, params, options);
  },
};

export const db = drizzle(dynamicClient as any, { schema });
