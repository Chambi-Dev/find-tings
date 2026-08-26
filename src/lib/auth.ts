import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { usuarios, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: usuarios,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [Google],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase());

        const isAdmin =
          // @ts-ignore
          user.rol === 'admin' ||
          (session.user.email &&
            adminEmails.includes(session.user.email.toLowerCase()));

        // @ts-ignore
        session.user.rol = isAdmin ? 'admin' : (user.rol || 'alumno');
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
