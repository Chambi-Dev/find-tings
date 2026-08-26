import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/db/schema';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  const usrs = await db.query.usuarios.findMany();
  const objs = await db.query.objetos.findMany({ with: { fotos: true, reclamos: true } });
  const recs = await db.query.reclamos.findMany({ with: { objeto: true, usuario: true } });

  console.log('=== USUARIOS (' + usrs.length + ') ===');
  console.log(JSON.stringify(usrs, null, 2));

  console.log('=== OBJETOS (' + objs.length + ') ===');
  console.log(JSON.stringify(objs, null, 2));

  console.log('=== RECLAMOS (' + recs.length + ') ===');
  console.log(JSON.stringify(recs, null, 2));
}

main().catch(console.error);
