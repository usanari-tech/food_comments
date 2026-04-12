import { ChefHat } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex flex-col items-center justify-center p-4">
            <div className="relative">
                {/* 背景の円（パルスアニメーション） */}
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-20"></div>

                {/* アイコンコンテナ */}
                <div className="relative w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-xl animate-bounce-subtle p-4">
                    <img src="/icon.png" alt="Loading" className="w-full h-full object-contain" />
                </div>
            </div>

            <div className="mt-8 text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-800 tracking-wide">
                    Loading...
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                    データを読み込んでいます
                </p>
            </div>

            {/* カスタムCSSアニメーション用のスタイル定義をここだけで完結させる（簡易的） */}
            <style>{`
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite ease-in-out;
                }
            `}</style>
        </div>
    )
}
