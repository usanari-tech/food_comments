
import { createClient } from '@supabase/supabase-js'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

async function main() {
    console.log('=== Resetting Processing Status ===')

    // 1. 2/8, 2/9, 2/10 のレポートを削除
    //    (2/10はゴミデータ、2/8, 2/9は再生成対象)
    const targetDates = ['2026-02-08', '2026-02-09', '2026-02-10']
    console.log(`Deleting daily_reports for dates: ${targetDates.join(', ')}`)

    const { error: deleteError } = await supabase
        .from('daily_reports')
        .delete()
        .in('report_date', targetDates)

    if (deleteError) {
        console.error('Error deleting reports:', deleteError)
    } else {
        console.log('Successfully deleted reports.')
    }

    // 2. 直近(2/8以降)の meal_logs の processed を false に戻す
    console.log('Resetting meal_logs processed status to false...')
    // UTCで 2/8 00:00 (JST 2/8 09:00) 以降くらいを対象にする
    const since = '2026-02-07T15:00:00.000Z'

    const { data: logs, error: fetchError } = await supabase
        .from('meal_logs')
        .select('id')
        .gte('created_at', since)

    if (fetchError || !logs) {
        console.error('Error fetching logs:', fetchError)
        return
    }

    const ids = logs.map(l => l.id)
    console.log(`Found ${ids.length} logs to reset.`)

    if (ids.length > 0) {
        const { error: updateError } = await supabase
            .from('meal_logs')
            .update({ processed: false, report_id: null, analysis: null }) // report_idとanalysisもクリア
            .in('id', ids)

        if (updateError) {
            console.error('Error resetting logs:', updateError)
        } else {
            console.log('Successfully reset logs.')
        }
    }
}

main()
