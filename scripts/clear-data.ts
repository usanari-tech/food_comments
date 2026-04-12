import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearAllData() {
    console.log('🧹 Clearing all data...')

    // 1. meal_logs (食事記録) の削除
    const { error: error1 } = await supabase
        .from('meal_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 全件削除ハック

    if (error1) console.error('Error clearing meal_logs:', error1)
    else console.log('✅ meal_logs cleared')

    // 2. daily_reports (日次レポート) の削除
    const { error: error2 } = await supabase
        .from('daily_reports')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error2) console.error('Error clearing daily_reports:', error2)
    else console.log('✅ daily_reports cleared')

    // 3. Storage (meal_photos) のファイル削除
    // バケット内の全ファイルをリストアップして削除
    const { data: files, error: listError } = await supabase
        .storage
        .from('meal_photos')
        .list()

    if (listError) {
        console.error('Error listing files:', listError)
    } else if (files && files.length > 0) {
        const paths = files.map(f => f.name)
        const { error: removeError } = await supabase
            .storage
            .from('meal_photos')
            .remove(paths)

        if (removeError) console.error('Error removing files:', removeError)
        else console.log(`✅ ${files.length} images removed from storage`)
    } else {
        console.log('ℹ️ No images to remove')
    }

    console.log('✨ All data cleared successfully!')
}

clearAllData()
