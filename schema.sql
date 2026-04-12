CREATE TABLE IF NOT EXISTS `user` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text,
  `email` text UNIQUE,
  `emailVerified` integer,
  `image` text
);

CREATE TABLE IF NOT EXISTS `account` (
  `userId` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `type` text NOT NULL,
  `provider` text NOT NULL,
  `providerAccountId` text NOT NULL,
  `refresh_token` text,
  `access_token` text,
  `expires_at` integer,
  `token_type` text,
  `scope` text,
  `id_token` text,
  `session_state` text
);

CREATE TABLE IF NOT EXISTS `session` (
  `sessionToken` text PRIMARY KEY NOT NULL,
  `userId` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `expires` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `verificationToken` (
  `identifier` text NOT NULL,
  `token` text NOT NULL,
  `expires` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `meal_logs` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `image_path` text,
  `memo` text,
  `analysis` text,
  `processed` integer NOT NULL DEFAULT 0,
  `report_id` text,
  `created_at` integer
);

CREATE TABLE IF NOT EXISTS `daily_reports` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `user`(`id`) ON DELETE CASCADE,
  `report_date` text NOT NULL,
  `nutritional_summary` text,
  `ai_comment` text,
  `score` integer,
  `created_at` integer
);
