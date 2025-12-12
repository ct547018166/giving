import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import db from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET, // Explicitly set secret
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) return null;

          console.log('Authorizing user:', credentials.username);
          const user = db.prepare("SELECT * FROM users WHERE name = ?").get(credentials.username) as any;
          
          if (user && user.password) {
            const isValid = await bcrypt.compare(credentials.password as string, user.password);
            if (isValid) {
              console.log('User authorized:', user.name);
              return {
                id: user.id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
              };
            }
          }
          console.log('Authorization failed for user:', credentials.username);
          return null;
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
});
