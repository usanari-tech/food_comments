import { NextResponse } from 'next/server'

// SDKを使わずfetchで直接Gemini REST APIを叩くヘルパー関数
async function callGeminiRest(apiKey: string, model: string, parts: any[]): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const body = {
        contents: [{ parts }]
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Gemini API error ${res.status}: ${errText}`)
    }
    const data = await res.json() as any
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function GET(request: Request) {
    try {
        const apiKey = process.env.GOOGLE_AI_API_KEY
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_AI_API_KEY not set' }, { status: 500 })
        }

        const model = 'gemini-3.1-flash-lite-preview'
        const text = await callGeminiRest(apiKey, model, [
            { text: 'こんにちは！今日の食事の感想を一言で教えてください。' }
        ])

        return NextResponse.json({
            success: true,
            model,
            response: text,
        })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
