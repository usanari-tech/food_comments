'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Menu, User as UserIcon } from 'lucide-react'
import PostModal from './post-modal'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import type { Session } from 'next-auth'

export default function DashboardHeader({ user }: { user: Session["user"] }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const router = useRouter()

    const avatarUrl = user?.image

    const handleSignOut = async () => {
        await signOut({ redirect: true, callbackUrl: '/login' })
    }

    // クリックアウトでメニューを閉じる
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <header className="sticky top-0 z-50 glass border-b border-gray-200/50">
            <nav className="max-w-lg mx-auto flex justify-between items-center px-4 py-2">
                {/* ロゴ（クリックでリロード） */}
                <a href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src="/icon.png" alt="Logo" className="w-8 h-8 rounded-lg shadow-sm" />
                    <h1 className="font-bold text-lg text-gray-900 tracking-tight font-display">Spicy</h1>
                </a>

                <div className="flex items-center gap-2">
                    {/* 投稿ボタン */}
                    <PostModal />

                    {/* ユーザーメニュー */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-sm transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt="User"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                                    {user?.email?.[0].toUpperCase() || 'U'}
                                </div>
                            )}
                        </button>

                        {/* ドロップダウンメニュー */}
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fade-in origin-top-right z-50">
                                <div className="px-4 py-2 border-b border-gray-50">
                                    <p className="text-xs text-gray-500 font-medium truncate">ログイン中</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{user?.name || user?.email}</p>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                >
                                    <LogOut size={16} />
                                    ログアウト
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </header>
    )
}
