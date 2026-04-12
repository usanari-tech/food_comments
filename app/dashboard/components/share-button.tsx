'use client'

import { Share2, Check, Copy } from 'lucide-react'
import { useState } from 'react'

type ShareButtonProps = {
    text: string
    url?: string
    title?: string
    className?: string
}

export default function ShareButton({
    text,
    url = typeof window !== 'undefined' ? window.location.origin : '',
    title = 'Spicy',
    className = ''
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation() // 親のクリックイベント（アコーディオンなど）を阻止

        const shareData = {
            title: title,
            text: text,
            url: url,
        }

        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData)
            } else {
                // Fallback to clipboard
                await navigator.clipboard.writeText(`${text} ${url}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        } catch (error) {
            console.error('Error sharing:', error)
        }
    }

    return (
        <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${className} 
                ${copied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
            title="結果をシェア"
        >
            {copied ? (
                <>
                    <Check size={14} />
                    <span>コピーしました</span>
                </>
            ) : (
                <>
                    <Share2 size={14} />
                    <span>シェア</span>
                </>
            )}
        </button>
    )
}
