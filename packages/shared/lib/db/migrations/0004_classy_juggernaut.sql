ALTER TABLE `tiktok_gift_triggers` RENAME COLUMN "gift_id" TO "gift_ids";--> statement-breakpoint
ALTER TABLE `tiktok_gift_triggers` ADD `match_all_gifts` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tiktok_gift_triggers` DROP COLUMN `gift_name`;