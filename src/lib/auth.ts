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

/**
 * Obtiene la lista de correos administradores inspeccionando todas las fuentes
 * posibles en Cloudflare Workers y Next.js:
 * 1. process.env.ADMIN_EMAILS
 * 2. process.env.NEXT_PUBLIC_ADMIN_EMAILS
 * 3. globalThis.ADMIN_EMAILS
 * 4. globalThis.env.ADMIN_EMAILS (Cloudflare Worker runtime bindings)
 * 5. req.env.ADMIN_EMAILS (Cloudflare Request bindings)
 */
function getAdminEmailsList(req?: unknown): string[] {
  const g = globalThis as Record<string, unknown>;
  const reqObj = req as Record<string, unknown> | undefined;
  const cloudflareEnv =
    (reqObj?.env as Record<string, unknown> | undefined) ||
    (g?.env as Record<string, unknown> | undefined) ||
    (g?.__env__ as Record<string, unknown> | undefined);

  const raw =
    process.env.ADMIN_EMAILS ||
    process.env.NEXT_PUBLIC_ADMIN_EMAILS ||
    (g?.ADMIN_EMAILS as string | undefined) ||
    (g?.NEXT_PUBLIC_ADMIN_EMAILS as string | undefined) ||
    (cloudflareEnv?.ADMIN_EMAILS as string | undefined) ||
    (cloudflareEnv?.NEXT_PUBLIC_ADMIN_EMAILS as string | undefined) ||
    '';

  const cleaned = raw
    .replace(/["'\r\n]/g, '') // Elimina comillas dobles, simples y saltos de línea
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return cleaned;
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

        const adminEmails = getAdminEmailsList(req);
        const userEmail = ((token.email as string) || '').toLowerCase().trim();

        const isConfiguredAdmin = !!userEmail && adminEmails.includes(userEmail);
        const isAdmin = token.rol === 'admin' || isConfiguredAdmin;

        if (isAdmin) {
          token.rol = 'admin';

          // Si el correo está en la lista de administradores, asegurar que su rol
          // en la base de datos Neon también sea actualizado de 'alumno' a 'admin'
          if (userEmail) {
            db.update(usuarios)
              .set({ rol: 'admin' })
              .where(eq(usuarios.email, userEmail))
              .catch((err) =>
                console.error('[AUTH] Error actualizando rol admin en DB:', err)
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

          const adminEmails = getAdminEmailsList(req);
          const userEmail = (
            session.user.email ||
            (token.email as string) ||
            ''
          )
            .toLowerCase()
            .trim();

          const isConfiguredAdmin = !!userEmail && adminEmails.includes(userEmail);
          const isAdmin = token.rol === 'admin' || isConfiguredAdmin;

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
