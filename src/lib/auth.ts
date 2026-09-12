import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { usuarios, accounts, sessions, verificationTokens } from '@/db/schema';

/**
 * Obtiene la lista de correos administradores desde la variable de entorno ADMIN_EMAILS.
 * Limpia comillas, saltos de línea y espacios para garantizar coincidencia exacta.
 */
function getAdminEmailsList(): string[] {
  const raw = process.env.ADMIN_EMAILS || '';
  return raw
    .replace(/["'\r\n]/g, '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const clientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET no está configurado en las variables de entorno.');
  }

  if (!clientId || !clientSecret) {
    throw new Error('Las credenciales de Google OAuth (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET) no están configuradas.');
  }

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

        const isConfiguredAdmin = !!userEmail && adminEmails.includes(userEmail);
        const isAdmin = token.rol === 'admin' || isConfiguredAdmin;

        if (isAdmin) {
          token.rol = 'admin';
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
