-- ============================================
-- Food Comments DBマイグレーション
-- Supabaseダッシュボードの SQL Editor で実行
-- ============================================

-- 1. meal_logsにanalysisカラムを追加
-- （食事単位のAI分析結果を格納）
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS analysis JSONB;

-- 2. 既存データのクリーンアップ（任意）
-- 既存のdaily_reportsとmeal_logsをリセットしたい場合のみ実行
-- TRUNCATE TABLE public.daily_reports;
-- TRUNCATE TABLE public.meal_logs;

-- ============================================
-- 上記のALTER TABLEは安全に実行可能です
-- TRUNCATEはデータを削除するので確認してから実行
-- ============================================
