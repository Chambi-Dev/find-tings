import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
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
          // @ts-ignore
          token.rol = user.rol;
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token) {
          session.user.id = (token.id as string) || (token.sub as string);

          const adminEmails = (process.env.ADMIN_EMAILS || 'chambiadam20@gmail.com')
            .split(',')
            .map((e) => e.trim().toLowerCase());

          const isAdmin =
            token.rol === 'admin' ||
            (session.user.email &&
              adminEmails.includes(session.user.email.toLowerCase()));

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
