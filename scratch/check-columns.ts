import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const columns = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name IN ('accounts', 'usuarios', 'sessions')
    ORDER BY table_name, ordinal_position;
  `;
  console.log('COLUMNS IN NEON DB:');
  console.log(JSON.stringify(columns, null, 2));
}

main().catch(console.error);
