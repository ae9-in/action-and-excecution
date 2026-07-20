import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
      }
      return token;
    },
    async session({ session, token }) {
      if (!token.id) {
        return null as any;
      }
      if (token && session.user) {
        const userObj = session.user as any;
        userObj.id = token.id as string;
        userObj.role = token.role;
        userObj.orgId = token.orgId;
        userObj.businessIds = (token as any).businessIds || [];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
