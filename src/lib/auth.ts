import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { AuthOptions } from 'next-auth'
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from './prisma'

// Simple in-memory cache for user data
const userCache = new Map<string, { id: string; username: string | null; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        try {
          // Check cache first
          const cached = userCache.get(session.user.email);
          const now = Date.now();
          
          if (cached && (now - cached.timestamp < CACHE_DURATION)) {
            session.user.id = cached.id;
            session.user.username = cached.username || undefined;
            return session;
          }

          // Fetch from database if not cached or cache expired
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, username: true }
          });
          
          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.username = dbUser.username || undefined;
            
            // Update cache
            userCache.set(session.user.email, {
              id: dbUser.id,
              username: dbUser.username,
              timestamp: now
            });
          }
        } catch (error) {
          console.error('Error fetching user in session callback:', error);
          // Return session even if database lookup fails to prevent blocking
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects after sign in
      if (url.startsWith("/")) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions) 