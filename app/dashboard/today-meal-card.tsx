'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteMealLog } from './delete-action'
import ImageWithZoom from './image-with-zoom'

type Props = {
    meal: {
        id: string
        image_path: string
        memo?: string
        created_at: string
    }
    }
}

export default function TodayMealCard({ meal }: Props) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const time = new Date(meal.created_at).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
    })

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deleteMealLog(meal.id)
            if (!result.success) {
                alert(result.error)
            }
        } catch (error) {
            alert('削除に失敗しました: ' + (error as Error).message)
        }
        setIsDeleting(false)
        setShowConfirm(false)
    }

    return (
        <div className="card overflow-hidden animate-fade-in relative">
            <div className="aspect-square relative overflow-hidden">
                <ImageWithZoom
                    src={`${process.env.NEXT_PUBLIC_R2_URL || ''}/${meal.image_path}`}
                    alt="食事"
                    className="w-full h-full"
                />
                <span className="status-pending absolute top-2 right-2">
                    待機中
                </span>

                {/* 削除ボタン */}
                <button
                    onClick={() => setShowConfirm(true)}
                    className="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors"
                    title="削除"
                >
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="p-3">
                <p className="text-xs font-medium text-gray-400 mb-1">{time}</p>
                {meal.memo && (
                    <p className="text-sm text-gray-700 truncate">{meal.memo}</p>
                )}
            </div>

            {/* 削除確認モーダル */}
            {showConfirm && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 z-10">
                    <p className="text-white text-sm mb-4 text-center">この投稿を削除しますか？</p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 transition-colors"
                            disabled={isDeleting}
                        >
                            キャンセル
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors"
                            disabled={isDeleting}
                        >
                            {isDeleting ? '削除中...' : '削除'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
