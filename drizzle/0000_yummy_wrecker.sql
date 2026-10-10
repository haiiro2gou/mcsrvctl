CREATE TABLE `build` (
	`guild_id` text NOT NULL,
	`name` text NOT NULL,
	`alias` text NOT NULL,
	PRIMARY KEY(`guild_id`, `name`)
);
--> statement-breakpoint
CREATE TABLE `notify_channel` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`message_id` text NOT NULL
);
