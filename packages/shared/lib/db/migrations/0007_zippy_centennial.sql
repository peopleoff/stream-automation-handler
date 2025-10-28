CREATE TABLE `service_status` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_name` text NOT NULL,
	`status` text NOT NULL,
	`last_heartbeat` integer NOT NULL,
	`connection_details` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_status_service_name_unique` ON `service_status` (`service_name`);--> statement-breakpoint
CREATE INDEX `service_status_service_name_idx` ON `service_status` (`service_name`);--> statement-breakpoint
CREATE INDEX `service_status_last_heartbeat_idx` ON `service_status` (`last_heartbeat`);