CREATE TABLE `tiktok_gift_triggers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`gift_id` text NOT NULL,
	`gift_name` text NOT NULL,
	`min_quantity` integer,
	`max_quantity` integer,
	`automation_id` integer NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`automation_id`) REFERENCES `hue_automations`(`id`) ON UPDATE no action ON DELETE cascade
);
