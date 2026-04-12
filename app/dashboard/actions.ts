'use server'

import { getDb } from '@/lib/db'
import { auth } from '@/auth'
import { getJSTDateString, getJSTDayRange } from '@/lib/timezone'
import { mealLogs, dailyReports } from '@/lib/db/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { uploadImageToR2 } from '@/lib/r2'

export async function uploadMealImageAction(formData: FormData) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")
    
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    
    if (!file || !fileName) throw new Error("Invalid request")

    const key = `${session.user.id}/${fileName}`
    const arrayBuffer = await file.arrayBuffer()
    
    await uploadImageToR2(key, arrayBuffer, file.type)
    return { success: true, key }
}

export async function saveMealLog({ imagePath, memo }: { imagePath: string | null, memo: string | null }) {
    const session = await auth()
    if (!session?.user?.id) throw new Error("Unauthorized")

    const db = getDb()
    await db.insert(mealLogs).values({
        userId: session.user.id,
        imagePath,
        memo,
    })

    return { success: true }
}

export type TodayMealLog = {
    id: string
    image_path: string | null
    memo?: string | null
    created_at: string
}

export async function getTodayMealLogs(): Promise<TodayMealLog[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const db = getDb()
    const today = getJSTDateString()
    const { start } = getJSTDayRange(today)

    // JSTの開始時間以上の未処理ログを取得
    const stmt = await db.select({
        id: mealLogs.id,
        image_path: mealLogs.imagePath,
        memo: mealLogs.memo,
        created_at: mealLogs.createdAt,
    })
    .from(mealLogs)
    .where(and(
        eq(mealLogs.userId, session.user.id),
        eq(mealLogs.processed, false),
        gte(mealLogs.createdAt, new Date(start))
    ))
    .orderBy(desc(mealLogs.createdAt))

    return stmt.map(s => ({
        id: s.id,
        image_path: s.image_path,
        memo: s.memo,
        created_at: s.created_at?.toISOString() || '',
    }))
}

export type MealAnalysis = {
    menu_name: string
    calories: number
    pfc: { p: number; f: number; c: number }
    comment: string
    image_path?: string | null
    memo?: string | null
    created_at?: string
}

export type PastReport = {
    id: string
    report_date: string
    score: number
    ai_comment: string
    total_calories?: number
    total_pfc?: { p: number; f: number; c: number }
    meals: MealAnalysis[]
}

export async function getPastReports(): Promise<PastReport[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const db = getDb()
    
    // 直近10件の日報を取得
    const reports = await db.select()
        .from(dailyReports)
        .where(eq(dailyReports.userId, session.user.id))
        .orderBy(desc(dailyReports.reportDate))
        .limit(10)

    if (!reports.length) return []

    const result: PastReport[] = []

    for (const report of reports) {
        // この日報に紐づく食事ログを取得
        const logs = await db.select()
            .from(mealLogs)
            .where(eq(mealLogs.reportId, report.id))
            .orderBy(mealLogs.createdAt)
            
        const meals: MealAnalysis[] = []

        for (const log of logs) {
            if (log.analysis) {
                const analysisData = log.analysis as any
                meals.push({
                    menu_name: analysisData.menu_name || '不明',
                    calories: analysisData.calories || 0,
                    pfc: analysisData.pfc || { p: 0, f: 0, c: 0 },
                    comment: analysisData.comment || '',
                    image_path: log.imagePath,
                    memo: log.memo,
                    created_at: log.createdAt?.toISOString()
                })
            }
        }

        const nutritionalSummary = report.nutritionalSummary as any

        result.push({
            id: report.id,
            report_date: report.reportDate,
            score: report.score || 0,
            ai_comment: report.aiComment || '',
            total_calories: nutritionalSummary?.total_calories,
            total_pfc: nutritionalSummary?.total_nutrition || nutritionalSummary?.total_pfc,
            meals
        })
    }

    return result
}

export type ReportSummary = PastReport & { meal_count: number }

export async function getReportsByDateRange(startDate: string, endDate: string): Promise<ReportSummary[]> {
    const session = await auth()
    if (!session?.user?.id) return []

    const db = getDb()

    const reports = await db.select()
        .from(dailyReports)
        .where(and(
            eq(dailyReports.userId, session.user.id),
            gte(dailyReports.reportDate, startDate),
            lte(dailyReports.reportDate, endDate)
        ))
        .orderBy(dailyReports.reportDate)

    const result: ReportSummary[] = []

    for (const report of reports) {
        const logs = await db.select()
            .from(mealLogs)
            .where(eq(mealLogs.reportId, report.id))
            
        const meals: MealAnalysis[] = []

        for (const log of logs) {
            if (log.analysis) {
                const analysisData = log.analysis as any
                meals.push({
                    menu_name: analysisData.menu_name || '不明',
                    calories: analysisData.calories || 0,
                    pfc: analysisData.pfc || { p: 0, f: 0, c: 0 },
                    comment: analysisData.comment || '',
                    image_path: log.imagePath,
                    memo: log.memo,
                    created_at: log.createdAt?.toISOString()
                })
            }
        }

        const nutritionalSummary = report.nutritionalSummary as any

        result.push({
            id: report.id,
            report_date: report.reportDate,
            score: report.score || 0,
            ai_comment: report.aiComment || '',
            total_calories: nutritionalSummary?.total_calories || 0,
            total_pfc: nutritionalSummary?.total_pfc || { p: 0, f: 0, c: 0 },
            meal_count: meals.length,
            meals
        })
    }

    return result
}
