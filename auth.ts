import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { getDb } from "@/lib/db"
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema"

// Advanced Initialization pattern for Edge / Cloudflare Workers
export const { handlers, signIn, signOut, auth } = NextAuth((req) => {
  // req?.env またはグローバル環境変数からDBを取得
  let db;
  try {
    // Cloudflare Middleware 等で req から env が取れる場合の拡張
    const env = (req as any)?.env;
    db = getDb(env);
    if (db && typeof db.select !== 'function') {
        db = undefined; // Return undefined if we got the fallback Proxy
    }
  } catch (error) {
    db = undefined;
  }

  // DB が確保できないビルドフェーズでは adapter は undefined とする
  const adapter = db ? DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }) : undefined;

  return {
    ...authConfig,
    adapter,
  };
})

