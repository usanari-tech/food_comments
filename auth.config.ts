import type { NextAuthConfig } from 'next-auth'
import Google from "next-auth/providers/google"

export default {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session && session.user && token) {
        const userId = (token.sub || token.id) as string
        if (userId) {
          session.user.id = userId
        }
      }
      return session
    }
  }
} satisfies NextAuthConfig
