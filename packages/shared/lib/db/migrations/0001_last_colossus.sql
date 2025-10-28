CREATE TABLE `hue_automations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`enabled` integer DEFAULT true NOT NULL,
	`action_type` text NOT NULL,
	`action_config` text NOT NULL,
	`selected_lights` text NOT NULL,
	`trigger_type` text DEFAULT 'manual',
	`trigger_config` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
