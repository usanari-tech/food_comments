import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
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
        // Auth.jsのデフォルトのOAuth仕様ではsubに一意なIDが入ります
        const userId = (token.sub || token.id) as string
        if (userId) {
          session.user.id = userId
        }
      }
      return session
    }
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  ]
})
