import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, businessMembers } from '@/drizzle/schema';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          orgId: user.orgId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.orgId = (user as any).orgId;
      }

      if (token.id) {
        // Direct live DB check to invalidate sessions for deactivated users instantly
        const [dbUser] = await db
          .select({ isActive: users.isActive, role: users.role, orgId: users.orgId })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);

        if (!dbUser || !dbUser.isActive) {
          // Returning empty/invalid token object or null to invalidate the session
          return {} as any;
        }

        // Fetch user's assigned business memberships
        const memberships = await db
          .select({ businessId: businessMembers.businessId })
          .from(businessMembers)
          .where(eq(businessMembers.userId, token.id as string));

        token.role = dbUser.role;
        token.orgId = dbUser.orgId;
        token.businessIds = memberships.map((m) => m.businessId);
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

// Helper type
export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  orgId: string;
  businessIds: string[];
};
