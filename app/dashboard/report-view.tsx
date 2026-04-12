'use client'

import { useEffect, useState } from 'react'
import { getPastReports } from './actions'
import type { PastReport } from './actions'
import { Loader2, AlertTriangle } from 'lucide-react'

export default function ReportView() {
    const [report, setReport] = useState<PastReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLatestReport = async () => {
            const reports = await getPastReports()
            if (reports.length > 0) {
                setReport(reports[0])
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
                <span className="text-xs text-red-400">{report.report_date}</span>
            </div>

            <div className="p-6 space-y-4">
                <div className="bg-red-950/10 p-4 rounded border border-red-900/20">
                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">AI Comment</h4>
                    <p className="text-red-300 italic font-medium leading-relaxed">
                        "{report.ai_comment}"
                    </p>
                </div>
            </div>
        </div>
    )
}
