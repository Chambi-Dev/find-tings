import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

const dynamicNeon = (query: string, params: any[], options?: any) => {
  const url = 'postgresql://neondb_owner:npg_7MpBzIDwt6Kl@ep-gentle-lake-axskd67y-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
  const client = neon(url);
  return (client as any).query(query, params, options);
};

// Or better: dynamicNeon object with query property
const dynamicClient = {
  query: (query: string, params: any[], options?: any) => {
    const url = 'postgresql://neondb_owner:npg_7MpBzIDwt6Kl@ep-gentle-lake-axskd67y-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    const client = neon(url);
    return (client as any).query(query, params, options);
  }
};

const db = drizzle(dynamicClient as any, { schema });

async function main() {
  const res = await db.select().from(schema.accounts).innerJoin(schema.usuarios, eq(schema.accounts.userId, schema.usuarios.id)).where(and(eq(schema.accounts.provider, 'google'), eq(schema.accounts.providerAccountId, '114930710053101787981')));
  console.log('SUCCESS! Query executed perfectly:', res);
}

main().catch(console.error);
