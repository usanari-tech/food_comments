
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

// 環境変数の簡易読み込み
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            process.env[key] = value
        }
    })
}

// タイムゾーンユーティリティの簡易実装
function utcToJSTDateString(utcDateStr: string): string {
    const date = new Date(utcDateStr)
    // JSTに変換 (UTC+9)
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
    return jstDate.toISOString().split('T')[0]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleApiKey = process.env.GOOGLE_AI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !googleApiKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)
const genAI = new GoogleGenerativeAI(googleApiKey!)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

async function main() {
    console.log('=== Manual Report Generation ===')

    try {
        // 1. 未処理のmeal_logsを取得
        const { data: logs, error: logsError } = await supabase
            .from('meal_logs')
            .select('id, user_id, image_path, memo, created_at')
            .eq('processed', false)
            .order('created_at', { ascending: true })

        if (logsError) throw logsError
        if (!logs || logs.length === 0) {
            console.log('No unprocessed logs found')
            return
        }

        console.log(`Found ${logs.length} unprocessed logs.`)

        // 2. ユーザーごと × JST日付ごとにグループ化
        const userDateLogs: { [key: string]: typeof logs } = {}
        logs.forEach(log => {
            const jstDate = utcToJSTDateString(log.created_at)
            const groupKey = `${log.user_id}__${jstDate}`
            if (!userDateLogs[groupKey]) userDateLogs[groupKey] = []
            userDateLogs[groupKey].push(log)
        })

        // 3. ユーザー×日付ごとに処理
        for (const groupKey of Object.keys(userDateLogs)) {
            const [userId, reportDate] = groupKey.split('__')
            const meals = userDateLogs[groupKey]
            console.log(`Processing group: ${groupKey} (${meals.length} meals)`)

            const promptParts: any[] = []

            // プロンプト構築
            promptParts.push(
                "あなたは30歳の辛口お姉さんです。栄養学に詳しく、弟や妹のような相手に対して厳しくも愛のある指導をします。",
                "口調は「〜でしょ」「〜なさい」「何考えてるの？」など、きつめだけど根底に優しさがある感じ。",
                "ユーザーが投稿したメモ（例：「野菜抜き」「大盛り」など）があれば、その情報も必ず考慮してコメントしてください。",
                "",
                "## 出力形式",
                "以下のJSON形式のみで出力してください。Markdownのコードブロックは不要です。",
                "",
                `食事は${meals.length}件あります。必ず${meals.length}件分のmeals配列を返してください。`,
                "",
                JSON.stringify({
                    meals: [
                        {
                            menu_name: "料理名（例：カツ丼）",
                            calories: 500,
                            pfc: { p: 20, f: 25, c: 60 },
                            comment: "この料理に対する辛口コメント（50字程度、メモの内容も踏まえて）"
                        }
                    ],
                    daily_summary: {
                        total_calories: 1500,
                        total_pfc: { p: 80, f: 60, c: 150 },
                        score: 65,
                        roast: "1日の総評（200字以上）。お姉さんとして厳しくも愛のある言葉で。"
                    }
                }, null, 2),
                "",
                "## 食事画像とメモ"
            )

            // 各食事の画像を追加
            for (let i = 0; i < meals.length; i++) {
                const meal = meals[i]

                const { data: imageBlob, error: downloadError } = await supabase.storage
                    .from('meal_photos')
                    .download(meal.image_path)

                if (!downloadError && imageBlob) {
                    const arrayBuffer = await imageBlob.arrayBuffer()
                    const base64Data = Buffer.from(arrayBuffer).toString('base64')

                    promptParts.push(`\n--- 食事 ${i + 1} ---`)
                    promptParts.push({
                        inlineData: {
                            data: base64Data,
                            mimeType: imageBlob.type || 'image/webp'
                        }
                    })
                    if (meal.memo) {
                        promptParts.push(`メモ: ${meal.memo}`)
                    }
                } else {
                    console.error(`Failed to download image: ${meal.image_path}`, downloadError)
                }
            }

            // Gemini API呼び出し
            try {
                console.log('Calling Gemini API...')
                const result = await model.generateContent(promptParts)
                const response = result.response
                let text = response.text()

                // JSONを抽出
                text = text.replace(/```json/g, '').replace(/```/g, '').trim()

                let aiData: any
                try {
                    aiData = JSON.parse(text)
                } catch (parseErr) {
                    console.error(`JSON parse failed for ${userId}:`, text.substring(0, 200))
                    continue
                }

                if (!aiData.meals || !Array.isArray(aiData.meals)) {
                    console.error(`Invalid meals format for ${userId}`)
                    continue
                }

                // AIのmeals分析にimage_pathをマージ
                const mealsWithImages = aiData.meals.map((m: any, i: number) => ({
                    ...m,
                    image_path: meals[i]?.image_path || undefined,
                }))

                // daily_reportを保存
                console.log('Upserting daily_report...')
                const { data: reportData, error: reportError } = await supabase
                    .from('daily_reports')
                    .upsert({
                        user_id: userId,
                        report_date: reportDate,
                        nutritional_summary: {
                            total_calories: aiData.daily_summary?.total_calories,
                            total_pfc: aiData.daily_summary?.total_pfc,
                            meals: mealsWithImages
                        },
                        ai_comment: aiData.daily_summary?.roast,
                        score: aiData.daily_summary?.score
                    }, {
                        onConflict: 'user_id,report_date'
                    })
                    .select('id')
                    .single()

                if (reportError) {
                    console.error(`Failed to save report for ${userId}:`, reportError)
                    continue
                }

                const reportId = reportData?.id
                console.log(`Report saved/updated. ID: ${reportId}`)

                // 各meal_logのanalysis + report_idを更新
                for (let i = 0; i < meals.length; i++) {
                    const mealId = meals[i].id
                    const mealAnalysis = aiData.meals?.[i] || null

                    console.log(`Updating meal_log: ${mealId}, ReportID: ${reportId}`)
                    const { error: updateError } = await supabase
                        .from('meal_logs')
                        .update({
                            analysis: mealAnalysis,
                            processed: true,
                            ...(reportId ? { report_id: reportId } : {})
                        })
                        .eq('id', mealId)

                    if (updateError) {
                        console.error(`Failed to update meal_log ${mealId}:`, updateError)
                    }
                }

                console.log(`Successfully processed group: ${groupKey}`)

            } catch (err: any) {
                console.error(`Error processing user ${userId}:`, err)
            }
        }

    } catch (error: any) {
        console.error('Batch Job Error:', error)
    }
}

main()
