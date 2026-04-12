
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 環境変数の簡易読み込み（dotenv依存回避）
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8')
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '') // クォート削除
            process.env[key] = value
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY


const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

// JST変換ヘルパー
function toJST(dateStr: string) {
    const date = new Date(dateStr)
    return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19) + ' (JST)'
}

async function main() {
    console.log('=== DB Status Debug ===\n')

    // 1. 直近の meal_logs を取得
    console.log('--- Recent Meal Logs (Last 10) ---')
    const { data: logs, error: logsError } = await supabase
        .from('meal_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (logsError) {
        console.error('Error fetching meal_logs:', logsError)
    } else {
        logs.forEach(log => {
            console.log(`ID: ${log.id}`)
            console.log(`Created: ${log.created_at} -> ${toJST(log.created_at)}`)
            console.log(`Image: ${log.image_path}`)
            console.log(`ReportID: ${log.report_id} (${log.report_id ? 'LINKED' : 'NULL'})`)
            console.log(`Processed: ${log.processed}`)
            console.log('---------------------------')
        })
    }

    // 2. 直近の daily_reports を取得
    console.log('\n--- Recent Daily Reports (Last 5) ---')
    const { data: reports, error: reportsError } = await supabase
        .from('daily_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(5)

    if (reportsError) {
        console.error('Error fetching daily_reports:', reportsError)
    } else {
        reports.forEach(report => {
            console.log(`ID: ${report.id}`)
            console.log(`Date: ${report.report_date}`)
            console.log(`Meals Count (in summary): ${report.nutritional_summary?.meals?.length || 0}`)
            // image_path が summary に含まれているか確認
            const meals = report.nutritional_summary?.meals || []
            const hasImages = meals.some((m: any) => !!m.image_path)
            console.log(`Has Images in Summary: ${hasImages}`)
            console.log('---------------------------')
        })
    }

    // 3. 2/10 の特定調査
    console.log('\n--- Specific Check for 2026-02-10 ---')
    const targetDate = '2026-02-10'

    // レポート
    const { data: report10 } = await supabase
        .from('daily_reports')
        .select('id')
        .eq('report_date', targetDate)
        .single()

    if (report10) {
        console.log(`Results for 2/10 Report ID: ${report10.id}`)

        // このレポートIDを持つログ
        const { count: linkedCount } = await supabase
            .from('meal_logs')
            .select('id', { count: 'exact' })
            .eq('report_id', report10.id)
        console.log(`-> Linked meal_logs count: ${linkedCount}`)

    } else {
        console.log('No report found for 2026-02-10')
    }

    // この日のJST範囲に含まれるログを探す
    // JST 2026-02-10 00:00:00 -> UTC 2026-02-09 15:00:00
    // JST 2026-02-10 23:59:59 -> UTC 2026-02-10 14:59:59
    const startUTC = '2026-02-09T15:00:00.000Z'
    const endUTC = '2026-02-10T14:59:59.999Z'

    const { data: potentialLogs } = await supabase
        .from('meal_logs')
        .select('id, created_at, report_id')
        .gte('created_at', startUTC)
        .lte('created_at', endUTC)

    console.log(`\nPotential logs for 2/10 (UTC Range: ${startUTC} - ${endUTC}):`)
    if (potentialLogs && potentialLogs.length > 0) {
        potentialLogs.forEach(l => {
            console.log(`- ${l.id} : ${l.created_at} (ReportID: ${l.report_id})`)
        })
    } else {
        console.log('No logs found in this time range.')
    }
}

main()
