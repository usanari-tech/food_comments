'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import UploadForm from './upload-form'

export default function PostModal() {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)
    const router = useRouter()

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSuccess = () => {
        setTimeout(() => {
            setIsOpen(false)
            router.refresh()
        }, 1500)
    }

    // 背景スクロールロック
    useEffect(() => {
        if (mounted && isOpen) {
            document.body.style.overflow = 'hidden'
            return () => { document.body.style.overflow = 'unset' }
        }
    }, [mounted, isOpen])

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                title="食事を記録"
            >
                <Plus size={24} strokeWidth={2.5} />
            </button>

            {isOpen && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[100] overflow-y-auto bg-black/70 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsOpen(false)}
                >
                    <div className="min-h-full w-full px-4 py-12 flex flex-col items-center sm:justify-center pointer-events-none">
                        <div
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 relative animate-slide-up pointer-events-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                                    <Sparkles size={28} className="text-gray-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">食事を記録</h2>
                                <p className="text-sm text-gray-500 mt-2">
                                    写真をアップロードしてください<br />
                                    <span className="text-xs text-gray-400">（23:00に辛口評価が届きます）</span>
                                </p>
                            </div>

                            <UploadForm onSuccess={handleSuccess} />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
