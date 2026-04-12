'use client'

import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { Camera, Image as ImageIcon, X, Loader2, Check, Sparkles } from 'lucide-react'

type FileWithPreview = {
    file: File
    preview: string
    id: string
}

import { getPresignedUploadUrl, saveMealLog } from './actions'

export default function UploadForm({ onSuccess }: { onSuccess?: () => void }) {
    const [files, setFiles] = useState<FileWithPreview[]>([])
    const [memo, setMemo] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const cameraInputRef = useRef<HTMLInputElement>(null)
    const galleryInputRef = useRef<HTMLInputElement>(null)

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: FileWithPreview[] = []
            for (const file of Array.from(e.target.files)) {
                const objectUrl = URL.createObjectURL(file)
                newFiles.push({
                    file,
                    preview: objectUrl,
                    id: `${Date.now()}-${Math.random()}`
                })
            }
            setFiles(prev => [...prev, ...newFiles])
            setMessage(null)
        }
        e.target.value = ''
    }

    const removeFile = (id: string) => {
        setFiles(prev => {
            const file = prev.find(f => f.id === id)
            if (file) URL.revokeObjectURL(file.preview)
            return prev.filter(f => f.id !== id)
        })
    }

    const clearAll = () => {
        files.forEach(f => URL.revokeObjectURL(f.preview))
        setFiles([])
        setMemo('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (files.length === 0 && !memo.trim()) return

        setLoading(true)
        setMessage(null)

        try {
            if (files.length > 0) {
                const options = {
                    maxSizeMB: 0.3,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                    fileType: 'image/webp' as const
                }

                for (const { file } of files) {
                    const compressedFile = await imageCompression(file, options)
                    const fileName = `${Date.now()}.webp`
                    
                    // 1. Presigned URL を取得
                    const { url, key } = await getPresignedUploadUrl(fileName, 'image/webp')

                    // 2. R2 に PUT してアップロード
                    const res = await fetch(url, {
                        method: 'PUT',
                        body: compressedFile,
                        headers: {
                            'Content-Type': 'image/webp'
                        }
                    })

                    if (!res.ok) {
                        throw new Error(`Upload failed: ${res.statusText}`)
                    }

                    // 3. DBに保存
                    await saveMealLog({ imagePath: key, memo })
                }
            } else if (memo.trim() !== '') {
                // 画像なし、メモのみの場合
                await saveMealLog({ imagePath: null, memo })
            }

            clearAll()
            const msgCount = files.length > 0 ? `${files.length}件の` : '1件の'
            setMessage({ type: 'success', text: `${msgCount}投稿を受け付けました！` })
            onSuccess?.()

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '不明なエラー'
            console.error('Upload error:', error)
            setMessage({ type: 'error', text: `エラー: ${errorMessage}` })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                {/* カメラ / ギャラリー選択ボタン */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 btn-secondary flex flex-col items-center gap-2 py-5"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                            <Camera size={24} className="text-indigo-500" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">カメラ</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex-1 btn-secondary flex flex-col items-center gap-2 py-5"
                    >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
                            <ImageIcon size={24} className="text-emerald-500" />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">ギャラリー</span>
                    </button>
                </div>

                {/* Hidden inputs */}
                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    onChange={handleFilesChange}
                    className="hidden"
                />
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    ref={galleryInputRef}
                    onChange={handleFilesChange}
                    className="hidden"
                />

                {/* プレビュー一覧 */}
                {files.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">{files.length}枚選択中</span>
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            >
                                すべて削除
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {files.map(({ id, preview }) => (
                                <div key={id} className="relative aspect-square rounded-xl overflow-hidden shadow-sm group">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                    <button
                                        type="button"
                                        onClick={() => removeFile(id)}
                                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* メモ入力 */}
                <div>
                    <label className="text-xs font-medium text-gray-400 mb-2 block">メモ (任意)</label>
                    <textarea
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="例: ラーメン大盛り、野菜抜き"
                        className="input-field w-full resize-none h-20"
                    />
                </div>

                {/* 投稿ボタン */}
                <button
                    type="submit"
                    disabled={(files.length === 0 && !memo.trim()) || loading}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            <span>アップロード中...</span>
                        </>
                    ) : (files.length > 0 || memo.trim()) ? (
                        <>
                            <Check size={20} />
                            <span>投稿する {files.length > 0 ? `(${files.length}件)` : '(メモのみ)'}</span>
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            <span>写真かメモを入力してください</span>
                        </>
                    )}
                </button>

                {/* メッセージ */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 animate-fade-in ${message.type === 'success'
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-100'
                        : 'bg-gradient-to-r from-red-50 to-rose-50 text-red-600 border border-red-100'
                        }`}>
                        {message.type === 'success' ? (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Check size={16} className="text-green-600" />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                <X size={16} className="text-red-600" />
                            </div>
                        )}
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    )
}
