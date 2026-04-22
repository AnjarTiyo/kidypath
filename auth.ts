import NextAuth from "next-auth"
import type { Session } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { verifyPassword } from "@/lib/auth-utils"
import { isPhoneNumber, normalizePhoneToLocal } from "@/lib/helpers/phone"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        identifier: { label: "Email / No. HP", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email or phone number
          let user;
          if (isPhoneNumber(credentials.identifier as string)) {
            const normalized = normalizePhoneToLocal(credentials.identifier as string);
            [user] = await db
              .select()
              .from(users)
              .where(eq(users.phoneNumber, normalized))
              .limit(1);
          } else {
            [user] = await db
              .select()
              .from(users)
              .where(eq(users.email, credentials.identifier as string))
              .limit(1);
          }

          if (!user || !user.passwordHash) {
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password as string,
            user.passwordHash
          );

          if (!isValid) {
            return null;
          }

          // Return user data (with non-null values)
          return {
            id: user.id,
            email: user.email ?? "",
            name: user.fullName ?? "",
            role: user.role ?? "parent",
            isCurriculumCoordinator: user.isCurriculumCoordinator || false,
            avatarUrl: user.avatarUrl ?? null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.isCurriculumCoordinator = user.isCurriculumCoordinator ?? false;
        token.avatarUrl = user.avatarUrl ?? null;
      }
      // Allow client-side session.update() to refresh avatarUrl in the token
      if (trigger === "update" && session?.avatarUrl !== undefined) {
        token.avatarUrl = session.avatarUrl;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.isCurriculumCoordinator = Boolean(token.isCurriculumCoordinator);
        session.user.avatarUrl = (token.avatarUrl as string | null | undefined) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
  debug: process.env.NODE_ENV === 'development',
})

export function isCurriculumCoordinatorSession(session?: Session | null) {
  return Boolean(session?.user?.isCurriculumCoordinator)
}
