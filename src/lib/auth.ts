import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { usuarios, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
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
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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

        const adminEmails = (process.env.ADMIN_EMAILS || '')
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
});
