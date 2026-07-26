CREATE TABLE `daily_checkins` (
	`date` text NOT NULL,
	`habit_key` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`date`, `habit_key`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`subject` text DEFAULT 'General' NOT NULL,
	`due_date` text,
	`type` text DEFAULT 'Tarea' NOT NULL,
	`state` text DEFAULT 'upcoming' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text
);
