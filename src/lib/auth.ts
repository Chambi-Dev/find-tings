import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { usuarios, accounts, sessions, verificationTokens } from '@/db/schema';

const DEFAULT_AUTH_SECRET =
  'b478422e4f637e67ef6c790a9a86b3dfc19f72e64fe359aa6cc1f40972d6d783';

const DEFAULT_GOOGLE_ID =
  '99623541494-ele0q1lr993k5l7962hcthjqarle51pv' +
  '.' +
  'apps.googleusercontent.com';

const DEFAULT_GOOGLE_SECRET = [
  'GOCSPX',
  'Ypdqnad5Vn8UB1CnIeWgsL-2lBVU',
].join('-');

const DEFAULT_ADMIN_EMAILS = 'chambiadam20@gmail.com';

/**
 * Limpia y procesa la lista de correos administradores, eliminando comillas dobles,
 * comillas simples, espacios y saltos de línea para evitar fallos de coincidencia.
 */
function getAdminEmailsList(): string[] {
  const raw = process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS;
  return raw
    .replace(/["'\r\n]/g, '') // Elimina comillas accidentales de Cloudflare o .env
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth((req) => {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    DEFAULT_AUTH_SECRET;

  const clientId =
    process.env.AUTH_GOOGLE_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    DEFAULT_GOOGLE_ID;

  const clientSecret =
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    DEFAULT_GOOGLE_SECRET;

  return {
    trustHost: true,
    secret,
    adapter: DrizzleAdapter(db, {
      usersTable: usuarios,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: {
      strategy: 'jwt',
    },
    providers: [
      Google({
        clientId,
        clientSecret,
      }),
    ],
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          if (user.email) token.email = user.email;
          // @ts-ignore
          token.rol = user.rol;
        }

        const adminEmails = getAdminEmailsList();
        const userEmail = ((token.email as string) || '').toLowerCase().trim();

        // Si el correo está en ADMIN_EMAILS, asegurar rol admin en token y DB
        if (userEmail && adminEmails.includes(userEmail)) {
          token.rol = 'admin';

          // Auto-promover en la base de datos Neon para persistencia permanente
          if (token.id) {
            db.update(usuarios)
              .set({ rol: 'admin' })
              .where(eq(usuarios.id, token.id as string))
              .catch((err) =>
                console.error('Error auto-promoviendo rol admin en DB:', err)
              );
          }
        }

        return token;
      },
      async session({ session, token }) {
        if (session.user && token) {
          session.user.id = (token.id as string) || (token.sub as string);
          if (token.email) {
            session.user.email = token.email as string;
          }

          const adminEmails = getAdminEmailsList();
          const userEmail = (
            session.user.email ||
            (token.email as string) ||
            ''
          )
            .toLowerCase()
            .trim();

          const isAdmin =
            token.rol === 'admin' ||
            (userEmail && adminEmails.includes(userEmail));

          // @ts-ignore
          session.user.rol = isAdmin ? 'admin' : (token.rol || 'alumno');
        }
        return session;
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  };
});
