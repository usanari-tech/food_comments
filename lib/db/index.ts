import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import { drizzle as drizzleLibSQL } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Cloudflare 型宣言（型パッケージがない場合のフォールバック）
declare const EdgeRuntime: string | undefined;
declare class D1Database { prepare(query: string): any; dump(): any; batch(statements: any[]): any; exec(query: string): any; }
declare class R2Bucket { get(key: string): any; put(key: string, value: any, options?: any): any; delete(key: string): any; list(options?: any): any; head(key: string): any; }

// Cloudflare バインディングの型定義
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

// 実行環境（ローカルNode.js環境か、Cloudflare環境か）に応じてDBクライアントを切り替えるラッパー関数
export function getDb(env?: Env) {
  // 1. Cloudflare 環境など、バインディング（env.DB）が渡された場合
  if (env && env.DB) {
    return drizzleD1(env.DB, { schema });
  }

  // 2. グローバルに process.env.DB (Cloudflare Pagesのバインディング等) がある場合
  if (typeof process !== 'undefined' && process.env && (process.env as any).DB) {
    return drizzleD1((process.env as any).DB as D1Database, { schema });
  }

  // Edgeランタイムの判定
  const isEdge = typeof EdgeRuntime === 'string' || typeof window !== 'undefined' || !('process' in globalThis);
  if (isEdge) {
    // Middleware等のEdge環境でローカルDB(libsql)を要求された場合、
    // 即時にnullを返すとAuth.js初期化等でクラッシュするため、Proxyを返します
    return new Proxy({}, {
      get: function(target, prop) {
        console.warn(`[getDb] Accessing DB proxy property '${String(prop)}' in Edge Runtime without env.DB`);
        return function() { 
          throw new Error('Database is not initialized in edge middleware yet.');
        };
      }
    }) as any;
  }

  // 3. ローカル Node.js 開発環境時
  const client = createClient({ url: 'file:local.db' });
  return drizzleLibSQL(client, { schema });
}
