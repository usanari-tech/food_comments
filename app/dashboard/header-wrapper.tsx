import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import DashboardHeaderClient from './header'

export default async function DashboardHeaderWrapper() {
    const session = await auth()

    if (!session?.user) return redirect('/login')

    return <DashboardHeaderClient user={session.user} />
}
