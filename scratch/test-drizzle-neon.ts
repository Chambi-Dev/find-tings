import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';

// Test 1: what does drizzle(client) accept?
// neon returns a function: (sql, params) => Promise<any>
// If we pass a wrapper function that lazily calls neon:
const dynamicNeon = (query: string, params: any[]) => {
  const url = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@ep-placeholder.us-east-2.aws.neon.tech/neondb';
  const client = neon(url);
  return (client as any)(query, params);
};

const db = drizzle(dynamicNeon as any, { schema });
console.log('Successfully created db with dynamicNeon!');
console.log('db query keys:', Object.keys(db.query));
