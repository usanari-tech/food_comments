import { Suspense } from 'react'

import DashboardHeader from './header-wrapper'
import DashboardContent from './overview'
import Loading from './loading'

export const dynamic = 'force-dynamic';

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            <Suspense fallback={<div className="h-16 w-full glass animate-pulse" />}>
                <DashboardHeader />
            </Suspense>

            <Suspense fallback={<Loading />}>
                <DashboardContent />
            </Suspense>
        </div>
    )
}
