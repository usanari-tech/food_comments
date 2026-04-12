/**
 * JSTタイムゾーンユーティリティ
 * アプリ全体で統一的にJST日付を扱うためのヘルパー
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/**
 * 現在のJST日時を取得
 */
export function getJSTNow(): Date {
    const now = new Date()
    return new Date(now.getTime() + JST_OFFSET_MS)
}

/**
 * 現在のJST日付文字列を取得 (YYYY-MM-DD)
 */
export function getJSTDateString(date?: Date): string {
    const target = date
        ? new Date(date.getTime() + JST_OFFSET_MS)
        : getJSTNow()
    return target.toISOString().split('T')[0]
}

/**
 * UTCのDateオブジェクトからJST日付文字列を算出
 * DB上のcreated_at (UTC) をJSTの日付に変換する場合に使用
 */
export function utcToJSTDateString(utcDateStr: string): string {
    const utcDate = new Date(utcDateStr)
    const jstDate = new Date(utcDate.getTime() + JST_OFFSET_MS)
    return jstDate.toISOString().split('T')[0]
}

/**
 * 指定日付(YYYY-MM-DD)のJST範囲をISO文字列で返す
 * Supabaseクエリ用
 */
export function getJSTDayRange(dateStr: string): {
    start: string
    end: string
} {
    return {
        start: `${dateStr}T00:00:00+09:00`,
        end: `${dateStr}T23:59:59+09:00`,
    }
}
