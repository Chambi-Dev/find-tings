import { config } from 'dotenv';
config({ path: '.env.local' });
import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    const res = await sql`
      select "accounts"."userId", "accounts"."type", "accounts"."provider", "accounts"."providerAccountId", "accounts"."refresh_token", "accounts"."access_token", "accounts"."expires_at", "accounts"."token_type", "accounts"."scope", "accounts"."id_token", "accounts"."session_state", "usuarios"."id", "usuarios"."nombre", "usuarios"."email", "usuarios"."email_verified", "usuarios"."imagen", "usuarios"."telefono", "usuarios"."rol", "usuarios"."created_at" 
      from "accounts" 
      inner join "usuarios" on "accounts"."userId" = "usuarios"."id" 
      where ("accounts"."provider" = ${'google'} and "accounts"."providerAccountId" = ${'114930710053101787981'})
    `;
    console.log('Query result:', res);
  } catch (err) {
    console.error('SQL Error:', err);
  }
}

main().catch(console.error);
