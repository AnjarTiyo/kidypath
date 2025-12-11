import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Password verification function (matches the seed file)
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const computedHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return computedHash === hash;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email as string))
            .limit(1);

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

          // Return user data
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
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
})
