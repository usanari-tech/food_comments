'use client'

import { useState } from 'react'
import { X, ZoomIn } from 'lucide-react'

type Props = {
    src: string
    alt: string
    className?: string
}

export default function ImageWithZoom({ src, alt, className = '' }: Props) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <div
                className={`relative cursor-pointer group ${className}`}
                onClick={() => setIsOpen(true)}
            >
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>

            {/* 拡大モーダル */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setIsOpen(false)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        onClick={() => setIsOpen(false)}
                    >
                        <X size={24} />
                    </button>
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}
