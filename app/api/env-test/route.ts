import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET() {
    try {
        const cfCtx = getCloudflareContext();
        return NextResponse.json({
            hasEnv: !!cfCtx?.env,
            keys: cfCtx?.env ? Object.keys(cfCtx.env) : [],
            cronNative: (cfCtx?.env as any)?.CRON_SECRET ? 'exists' : 'missing',
            cronProcess: process.env.CRON_SECRET || 'missing',
            googleAiNative: !!(cfCtx?.env as any)?.GOOGLE_AI_API_KEY
        })
    } catch(e: any) {
        return NextResponse.json({ error: e.message })
    }
}
