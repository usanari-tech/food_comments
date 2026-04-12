'use server'

import { getDb } from '@/lib/db'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import { deleteR2Object } from '@/lib/r2'
import { mealLogs } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'

export async function deleteMealLog(mealId: string) {
    const session = await auth()
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' }
    }

    const db = getDb()

    // 1. レコード取得
    const [meal] = await db.select()
        .from(mealLogs)
        .where(and(
            eq(mealLogs.id, mealId),
            eq(mealLogs.userId, session.user.id)
        ))
        .limit(1)

    if (!meal) {
        return { success: false, error: 'Meal not found or unauthorized' }
    }

    if (meal.processed) {
        return { success: false, error: '評価済みの投稿は削除できません' }
    }

    // 2. ストレージ(R2)から画像を削除
    if (meal.imagePath) {
        try {
            await deleteR2Object(meal.imagePath)
        } catch (e) {
            console.error("Failed to delete R2 object", e)
            // 失敗してもDBからは消す（あるいはエラーで止めるか）
        }
    }

    // 3. DBからmeal_logを削除
    await db.delete(mealLogs)
        .where(eq(mealLogs.id, mealId))

    revalidatePath('/dashboard')
    return { success: true }
}
