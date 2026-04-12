'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getReportsByDateRange } from './actions'
import type { ReportSummary } from './actions'

function getMonthRange(offset: number) {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)

    const year = jst.getUTCFullYear()
    const month = jst.getUTCMonth() + offset

    const start = new Date(Date.UTC(year, month, 1))
    const end = new Date(Date.UTC(year, month + 1, 0))

    return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
        year: start.getUTCFullYear(),
        month: start.getUTCMonth(),
    }
}

export default function MonthlyView({
    initialReports,
    onSelectDate,
}: {
    initialReports: ReportSummary[]
    onSelectDate?: (date: string) => void
}) {
    const [monthOffset, setMonthOffset] = useState(0)
    const [reports, setReports] = useState<ReportSummary[]>(initialReports)
    const [loading, setLoading] = useState(false)

    const { startDate, endDate, year, month } = getMonthRange(monthOffset)
    const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    const dayLabels = ['月', '火', '水', '木', '金', '土', '日']

    const fetchMonth = useCallback(async (offset: number) => {
        setLoading(true)
        const { startDate: s, endDate: e } = getMonthRange(offset)
        const data = await getReportsByDateRange(s, e)
        setReports(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        if (monthOffset !== 0) {
            fetchMonth(monthOffset)
        } else {
            setReports(initialReports)
        }
    }, [monthOffset, initialReports, fetchMonth])

    // カレンダーグリッド構築
    const reportMap = new Map(reports.map(r => [r.report_date, r]))

    const firstDay = new Date(Date.UTC(year, month, 1))
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

    // 月曜始まり: 月=0 火=1 ... 日=6
    let startDayIndex = firstDay.getUTCDay() - 1
    if (startDayIndex < 0) startDayIndex = 6

    const calendarCells: (string | null)[] = []
    // 空セル
    for (let i = 0; i < startDayIndex; i++) calendarCells.push(null)
    // 日付セル
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        calendarCells.push(dateStr)
    }

    // サマリー
    const activeReports = reports.filter(r => r.score > 0)
    const avgScore = activeReports.length > 0
        ? Math.round(activeReports.reduce((a, r) => a + r.score, 0) / activeReports.length)
        : 0
    const totalCalories = reports.reduce((a, r) => a + r.total_calories, 0)

    const isCurrentMonth = monthOffset === 0

    return (
        <div className="space-y-4">
            {/* 月ナビゲーション */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setMonthOffset(monthOffset - 1)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <ChevronLeft size={20} className="text-gray-500" />
                </button>
                <div className="text-center">
                    <div className="font-bold text-gray-900">
                        {year}年 {monthNames[month]}
                    </div>
                    {isCurrentMonth && (
                        <span className="text-[11px] text-gray-400">今月</span>
                    )}
                </div>
                <button
                    onClick={() => setMonthOffset(monthOffset + 1)}
                    disabled={isCurrentMonth}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-30"
                >
                    <ChevronRight size={20} className="text-gray-500" />
                </button>
            </div>

            {/* カレンダーグリッド */}
            <div className="card p-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>
                ) : (
                    <>
                        {/* 曜日ヘッダー */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayLabels.map((label, i) => (
                                <div key={label} className={`text-center text-[10px] font-bold py-1 ${i === 6 ? 'text-red-400' : i === 5 ? 'text-blue-400' : 'text-gray-400'}`}>
                                    {label}
                                </div>
                            ))}
                        </div>

                        {/* 日付セル */}
                        <div className="grid grid-cols-7 gap-1">
                            {calendarCells.map((dateStr, i) => {
                                if (!dateStr) {
                                    return <div key={`empty-${i}`} className="aspect-square" />
                                }

                                const report = reportMap.get(dateStr)
                                const day = new Date(dateStr + 'T00:00:00Z').getUTCDate()

                                // スコアに基づくスタイル
                                let cellClass = 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                                let scoreLabel = null

                                if (report) {
                                    if (report.score >= 80) {
                                        cellClass = 'bg-green-100 text-green-700 hover:bg-green-200 ring-1 ring-inset ring-green-200'
                                    } else if (report.score >= 40) {
                                        cellClass = 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 ring-1 ring-inset ring-yellow-200'
                                    } else {
                                        cellClass = 'bg-red-100 text-red-700 hover:bg-red-200 ring-1 ring-inset ring-red-200'
                                    }
                                    scoreLabel = report.score
                                }

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => onSelectDate?.(dateStr)}
                                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative ${cellClass}`}
                                    >
                                        <span className="text-xs font-bold leading-none">{day}</span>
                                        {scoreLabel !== null && (
                                            <span className="text-[9px] font-medium leading-none opacity-80">{scoreLabel}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* 月間サマリー */}
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
                            <div className="text-xs text-gray-400 mb-1">記録日数</div>
                            <div className="text-lg font-bold text-gray-900">{activeReports.length}</div>
                            <div className="text-[10px] text-gray-400">日</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
