CREATE TABLE `automation_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`automation_id` integer,
	`trigger_id` integer,
	`event_type` text NOT NULL,
	`timestamp` integer NOT NULL,
	`status` text NOT NULL,
	`sender_username` text,
	`sender_id` text,
	`gift_id` text,
	`gift_name` text,
	`gift_value` integer,
	`repeat_count` integer,
	`event_data` text,
	`action_type` text NOT NULL,
	`action_config` text NOT NULL,
	`selected_lights` text NOT NULL,
	`selected_lights_count` integer NOT NULL,
	`successful_lights_count` integer NOT NULL,
	`failed_lights_count` integer NOT NULL,
	`execution_duration_ms` integer,
	`error_message` text,
	`failed_light_ids` text,
	`failed_light_errors` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`automation_name` text,
	`trigger_name` text,
	FOREIGN KEY (`automation_id`) REFERENCES `hue_automations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`trigger_id`) REFERENCES `tiktok_gift_triggers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `automation_runs_automation_id_idx` ON `automation_runs` (`automation_id`);--> statement-breakpoint
CREATE INDEX `automation_runs_timestamp_idx` ON `automation_runs` (`timestamp`);--> statement-breakpoint
CREATE INDEX `automation_runs_status_idx` ON `automation_runs` (`status`);--> statement-breakpoint
CREATE INDEX `automation_runs_automation_timestamp_idx` ON `automation_runs` (`automation_id`,`timestamp`);