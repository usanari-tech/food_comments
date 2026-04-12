'use client'

import { useState, useCallback } from 'react'
import { CalendarDays, CalendarRange } from 'lucide-react'
import type { ReportSummary } from './actions'
import WeeklyView from './weekly-view'
import MonthlyView from './monthly-view'

type ViewMode = 'weekly' | 'monthly'

function getWeekOffsetForDate(dateStr: string): number {
    const now = new Date()
    const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
    const today = new Date(jst.toISOString().split('T')[0] + 'T00:00:00Z')

    // 今週の月曜日
    const todayDay = today.getUTCDay()
    const todayMondayOffset = todayDay === 0 ? -6 : 1 - todayDay
    const thisMonday = new Date(today)
    thisMonday.setUTCDate(today.getUTCDate() + todayMondayOffset)

    // 選択日の月曜日
    const selected = new Date(dateStr + 'T00:00:00Z')
    const selectedDay = selected.getUTCDay()
    const selectedMondayOffset = selectedDay === 0 ? -6 : 1 - selectedDay
    const selectedMonday = new Date(selected)
    selectedMonday.setUTCDate(selected.getUTCDate() + selectedMondayOffset)

    // 差分を週数で
    const diffMs = selectedMonday.getTime() - thisMonday.getTime()
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
}

export default function HistoryView({
    weeklyReports,
    monthlyReports,
    monthlyReports: ReportSummary[]
}) {
    const [viewMode, setViewMode] = useState<ViewMode>('weekly')
    const [selectedWeekOffset, setSelectedWeekOffset] = useState(0)

    const handleSelectDate = useCallback((dateStr: string) => {
        const offset = getWeekOffsetForDate(dateStr)
        setSelectedWeekOffset(offset)
        setViewMode('weekly')
    }, [])

    return (
        <section>
            {/* タブ切替 */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setViewMode('weekly')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${viewMode === 'weekly'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    <CalendarDays size={14} />
                    週間
                </button>
                <button
                    onClick={() => setViewMode('monthly')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${viewMode === 'monthly'
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                >
                    <CalendarRange size={14} />
                    月間
                </button>
            </div>

            {/* ビュー本体 */}
            {viewMode === 'weekly' ? (
                <WeeklyView
                    initialReports={weeklyReports}
                    initialWeekOffset={selectedWeekOffset}
                />
            ) : (
                <MonthlyView
                    initialReports={monthlyReports}
                    onSelectDate={handleSelectDate}
                />
            )}
        </section>
    )
}

