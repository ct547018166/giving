import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import WeChat from "next-auth/providers/wechat";
import db from "./db";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    WeChat({
      clientId: process.env.WECHAT_APP_ID,
      clientSecret: process.env.WECHAT_APP_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = db.prepare("SELECT * FROM users WHERE name = ?").get(credentials.username) as any;
        
        if (user && user.password) {
          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (isValid) {
            return {
              id: user.id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
            };
          }
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "wechat") {
        // Check if user exists
        const existingUser = db.prepare("SELECT * FROM users WHERE provider = ? AND provider_id = ?").get("wechat", account.providerAccountId) as any;
        
        if (!existingUser) {
          // Create new user
          const stmt = db.prepare("INSERT INTO users (name, image, provider, provider_id, role) VALUES (?, ?, ?, ?, ?)");
          const result = stmt.run(user.name || "WeChat User", user.image, "wechat", account.providerAccountId, "guest");
          user.id = result.lastInsertRowid.toString();
          (user as any).role = "guest";
        } else {
          user.id = existingUser.id.toString();
          (user as any).role = existingUser.role;
        }
      }
      return true;
    },
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
