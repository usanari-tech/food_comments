'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getReportsByDateRange } from './actions'
import type { ReportSummary } from './actions'
import CollapsibleReport from './collapsible-report'

function getWeekRange(offset: number) {
    const now = new Date()
    // JST基準
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const today = new Date(jst.toISOString().split('T')[0] + 'T00:00:00Z')

    // 今週の月曜日を算出
    const dayOfWeek = today.getUTCDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(today)
    monday.setUTCDate(today.getUTCDate() + mondayOffset + offset * 7)

    const sunday = new Date(monday)
    sunday.setUTCDate(monday.getUTCDate() + 6)

    const startDate = monday.toISOString().split('T')[0]
    const endDate = sunday.toISOString().split('T')[0]

    return { startDate, endDate, monday, sunday }
}

function formatDateRange(start: string, end: string): string {
    const s = new Date(start + 'T00:00:00Z')
    const e = new Date(end + 'T00:00:00Z')
    return `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}`
}

export default function WeeklyView({
    initialReports,
    initialWeekOffset = 0,
}: {
    initialReports: ReportSummary[]
    initialWeekOffset?: number
}) {
    const [weekOffset, setWeekOffset] = useState(initialWeekOffset)
    const [reports, setReports] = useState<ReportSummary[]>(initialReports)
    const [loading, setLoading] = useState(false)

    const { startDate, endDate } = getWeekRange(weekOffset)
    const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

    // 週変更時にServer Actionでデータ取得
    const fetchWeek = useCallback(async (offset: number) => {
        setLoading(true)
        const { startDate: s, endDate: e } = getWeekRange(offset)
        const data = await getReportsByDateRange(s, e)
        setReports(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (weekOffset !== 0) {
            fetchWeek(weekOffset)
        } else {
            setReports(initialReports)
        }
    }, [weekOffset, initialReports, fetchWeek])

    // 親から初期weekOffsetが変わった場合に追従
    useEffect(() => {
        setWeekOffset(initialWeekOffset)
    }, [initialWeekOffset])

    // 7日分のスロットを作成（投稿のない日も表示）
    const reportMap = new Map(reports.map(r => [r.report_date, r]))
    const weekSlots: (ReportSummary | null)[] = []
    const { monday } = getWeekRange(weekOffset)
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setUTCDate(monday.getUTCDate() + i)
        const dateStr = d.toISOString().split('T')[0]
        weekSlots.push(reportMap.get(dateStr) || null)
    }

    // サマリー計算
    const activeReports = reports.filter(r => r.score > 0)
    const avgScore = activeReports.length > 0
        ? Math.round(activeReports.reduce((a, r) => a + r.score, 0) / activeReports.length)
        : 0
    const totalCalories = reports.reduce((a, r) => a + r.total_calories, 0)
    const totalMeals = reports.reduce((a, r) => a + r.meal_count, 0)

    const isCurrentWeek = weekOffset === 0

    return (
        <div className="space-y-4">
            {/* 週ナビゲーション */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setWeekOffset(weekOffset - 1)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-500" />
                </button>
                <div className="text-center">
                    <div className="font-bold text-gray-900">
                        {formatDateRange(startDate, endDate)}
                    </div>
                    {isCurrentWeek && (
                        <span className="text-[11px] text-gray-400">今週</span>
                    )}
                </div>
                <button
                    onClick={() => setWeekOffset(weekOffset + 1)}
                    disabled={isCurrentWeek}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                    <ChevronRight size={20} className="text-gray-500" />
                </button>
            </div>

            {/* スコアドットチャート */}
            <div className="card p-4">
                <div className="grid grid-cols-7 gap-1 text-center">
                    {dayLabels.map((label, i) => (
                        <div key={label} className="flex flex-col items-center gap-2">
                            <span className="text-[11px] font-medium text-gray-400">{label}</span>
                            {weekSlots[i] ? (
                                <div className="relative">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
                                            ${weekSlots[i]!.score >= 80 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                                                weekSlots[i]!.score >= 40 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' :
                                                    'bg-gradient-to-br from-red-400 to-rose-500'}`}
                                    >
                                        {weekSlots[i]!.score}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        {weekSlots[i]!.meal_count}食
                                    </div>
                                </div>
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-gray-300 text-xs">—</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* 週間サマリー */}
            {activeReports.length > 0 && (
                <div className="card p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-xs text-gray-400 mb-1">平均スコア</div>
                            <div className={`text-xl font-black ${avgScore < 40 ? 'score-low' : avgScore < 80 ? 'score-mid' : 'score-good'}`}>
                                {avgScore}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 mb-1">合計カロリー</div>
                            <div className="text-lg font-bold text-gray-900">
                                {totalCalories.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-gray-400">kcal</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 mb-1">食事数</div>
                            <div className="text-lg font-bold text-gray-900">{totalMeals}</div>
                            <div className="text-[10px] text-gray-400">食</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 日別レポート（折りたたみ） */}
            {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
            ) : reports.length > 0 ? (
                <div className="space-y-2">
                    {[...reports].reverse().map(report => (
                        <CollapsibleReport
                            key={report.id}
                            report={report}
                        />
                    ))}
                </div>
            ) : (
                <div className="empty-state py-8">
                    <div className="empty-state-icon">📊</div>
                    <p className="text-gray-400 text-sm">この週のレポートはありません</p>
                </div>
            )}
        </div>
    )
}
