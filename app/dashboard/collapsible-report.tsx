'use client'

import { useState } from 'react'
import { ChevronDown, Flame, Utensils } from 'lucide-react'
import type { ReportSummary } from './actions'
import ImageWithZoom from './image-with-zoom'

type MealAnalysis = {
    menu_name: string
    calories: number
    pfc: { p: number; f: number; c: number }
    comment: string
    image_path?: string
    memo?: string
    created_at?: string
}

export default function CollapsibleReport({
    report,
    meals,
}: {
    report: ReportSummary
    meals?: MealAnalysis[]
}) {
    const [isOpen, setIsOpen] = useState(false)

    const dayNames = ['日', '月', '火', '水', '木', '金', '土']
    const date = new Date(report.report_date + 'T00:00:00+09:00')
    const dayName = dayNames[date.getDay()]
    const dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${dayName})`

    const scoreColor = report.score < 50 ? 'score-low' : report.score < 80 ? 'score-mid' : 'score-good'

    return (
        <div className="card overflow-hidden animate-fade-in">
            {/* ヘッダー - タップで展開 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`text-xl font-black ${scoreColor}`}>
                        {report.score}
                    </div>
                    <div className="text-left">
                        <div className="font-semibold text-gray-900 text-sm">{dateLabel}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Utensils size={10} />
                            {report.meal_count}食 · {report.total_calories.toLocaleString()} kcal
                        </div>
                    </div>
                </div>
                <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* 展開コンテンツ */}
            {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3 animate-fade-in">
                    {/* 食事カード */}
                    {meals && meals.length > 0 ? (
                        meals.map((meal, i) => {
                            const time = meal.created_at
                                ? new Date(meal.created_at).toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Tokyo'
                                })
                                : null

                            return (
                                <div key={i} className="card p-3">
                                    <div className="flex gap-3">
                                        {meal.image_path && (
                                            <ImageWithZoom
                                                src={`${process.env.NEXT_PUBLIC_R2_URL || ''}/${meal.image_path}`}
                                                alt={meal.menu_name}
                                                className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden shadow-sm"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-900 text-sm">{meal.menu_name}</h4>
                                                {time && <span className="text-xs text-gray-400">{time}</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="nutrition-pill text-[11px]">
                                                    <Flame size={10} className="text-orange-500" />
                                                    {meal.calories} kcal
                                                </span>
                                                <span className="nutrition-pill text-[11px]">P {meal.pfc?.p}g</span>
                                                <span className="nutrition-pill text-[11px]">F {meal.pfc?.f}g</span>
                                                <span className="nutrition-pill text-[11px]">C {meal.pfc?.c}g</span>
                                            </div>
                                        </div>
                                    </div>
                                    {meal.comment && (
                                        <div className="comment-box mt-2">
                                            <p className="text-xs text-gray-600 leading-relaxed">{meal.comment}</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-4 text-sm text-gray-400">
                            食事データの詳細は準備中です
                        </div>
                    )}

                    {/* 辛口コメント */}
                    {report.ai_comment && (
                        <div className="pt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                    <Flame size={12} className="text-white" />
                                </div>
                                <span className="font-bold text-gray-800 text-xs">辛口コメント</span>
                            </div>
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-3 border border-gray-100">
                                <p className="text-gray-700 text-xs leading-relaxed">{report.ai_comment}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
