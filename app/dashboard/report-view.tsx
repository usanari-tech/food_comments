'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, AlertTriangle } from 'lucide-react'

type DailyReport = {
    id: string
    nutritional_summary: { text: string }
    ai_comment: string
    score: number
    created_at: string
}

export default function ReportView() {
    const [report, setReport] = useState<DailyReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLatestReport = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) return

            const { data, error } = await supabase
                .from('daily_reports')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setReport(data)
            }
            setLoading(false)
        }

        fetchLatestReport()
    }, [])

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-zinc-500" /></div>
    }

    if (!report) {
        return (
            <div className="w-full max-w-md p-6 rounded-lg border border-zinc-800 bg-zinc-900/30 text-center text-zinc-500">
                <p>まだ罵倒レポートはありません。</p>
                <p className="text-xs mt-2">写真を投稿して、深夜のバッチ処理（または手動実行）を待ちましょう。</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md bg-zinc-900 border border-red-900/50 rounded-lg overflow-hidden shadow-lg shadow-red-900/10">
            <div className="bg-red-950/30 p-4 border-b border-red-900/30 flex justify-between items-center">
                <h3 className="font-bold text-red-200 flex items-center gap-2">
                    <AlertTriangle size={18} />
                    本日の指導 (Score: {report.score})
                </h3>
                <span className="text-xs text-red-400">{new Date(report.created_at).toLocaleDateString()}</span>
            </div>

            <div className="p-6 space-y-4">
                <div>
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Summary</h4>
                    <p className="text-sm text-zinc-300">{report.nutritional_summary?.text}</p>
                </div>

                <div className="bg-red-950/10 p-4 rounded border border-red-900/20">
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">From Dr. S</h4>
                    <p className="text-red-300 italic font-medium leading-relaxed">
                        "{report.ai_comment}"
                    </p>
                </div>
            </div>
        </div>
    )
}
