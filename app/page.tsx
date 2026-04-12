import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-zinc-50">
      <h1 className="text-4xl font-bold mb-4">Food Comments (仮)</h1>
      <p className="text-xl mb-8">ドS管理栄養士があなたの食生活を罵倒します。</p>

      <div className="flex gap-4">
        <a href="/login" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors no-underline">
          ログインして骂倒される
        </a>
      </div>
    </main>
  )
}
