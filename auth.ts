import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: (function() {
    try {
      const db = getDb();
      // Proxyを渡すとUnsupported database typeとなるため、DBが確保できているか簡易チェック
      if (!db || typeof db.select !== 'function') {
        console.warn('Skipping DrizzleAdapter initialization: DB instance is not fully available yet.');
        return undefined;
      }
      return DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      });
    } catch (e) {
      console.warn('Skipping DrizzleAdapter initialization during build phase.', e);
      return undefined;
    }
  })(),
})
