import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';
// @opennextjs/cloudflareからgetCloudflareContextをインポート
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Cloudflare 型宣言（型パッケージがない場合のフォールバック）
declare const EdgeRuntime: string | undefined;
declare class D1Database { prepare(query: string): any; dump(): any; batch(statements: any[]): any; exec(query: string): any; }
declare class R2Bucket { get(key: string): any; put(key: string, value: any, options?: any): any; delete(key: string): any; list(options?: any): any; head(key: string): any; }

// Cloudflare バインディングの型定義
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

// D1 DBクライアントを返す関数
export function getDb(env?: Env) {
  // 1. 引数で直接バインディングが渡された場合
  if (env && env.DB) {
    return drizzleD1(env.DB, { schema });
  }

  // 2. @opennextjs/cloudflareのコンテキストから安全に取得
  try {
    const cfCtx = getCloudflareContext();
    if (cfCtx && cfCtx.env && cfCtx.env.DB) {
      return drizzleD1(cfCtx.env.DB as D1Database, { schema });
    }
  } catch (e) {
    // ignored (may throw in static build env)
  }

  // 3. グローバルに process.env.DB がある場合
  if (typeof process !== 'undefined' && process.env && (process.env as any).DB) {
    return drizzleD1((process.env as any).DB as D1Database, { schema });
  }

  // 4. それ以外（バインディング取得前）の場合、安全のためのProxyを返す
  return new Proxy({}, {
    get: function(target, prop) {
      console.warn(`[getDb] Accessing DB proxy property '${String(prop)}' without env.DB`);
      return function() { 
        throw new Error('Database binding (env.DB) is not available yet.');
      };
    }
  }) as any;
}
