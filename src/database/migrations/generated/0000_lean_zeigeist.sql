CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`logo_initial` text NOT NULL,
	`logo_color` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`website` text,
	`currency_code` text NOT NULL,
	`tax_number` text,
	`invoice_prefix` text NOT NULL,
	`next_invoice_number` integer DEFAULT 1 NOT NULL,
	`default_invoice_type_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`default_invoice_type_id`) REFERENCES `invoice_types`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `invoice_types` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`is_system_defined` integer DEFAULT false NOT NULL,
	`enabled_fields` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`email` text,
	`address` text,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `customers_name_idx` ON `customers` (`name`);--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sku` text,
	`unit` text,
	`default_price` real NOT NULL,
	`tax_rate` real,
	`weight` real,
	`length` real,
	`width` real,
	`height` real,
	`invoice_type_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`invoice_type_id`) REFERENCES `invoice_types`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `items_name_idx` ON `items` (`name`);--> statement-breakpoint
CREATE INDEX `items_sku_idx` ON `items` (`sku`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_number` text NOT NULL,
	`customer_id` text NOT NULL,
	`invoice_type_id` text NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text,
	`subtotal` real NOT NULL,
	`discount_total` real NOT NULL,
	`tax_total` real NOT NULL,
	`total` real NOT NULL,
	`notes` text,
	`terms` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`invoice_type_id`) REFERENCES `invoice_types`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_customer_id_idx` ON `invoices` (`customer_id`);--> statement-breakpoint
CREATE INDEX `invoices_status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `invoices_due_date_idx` ON `invoices` (`due_date`);--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`item_id` text,
	`item_name_snapshot` text NOT NULL,
	`item_description_snapshot` text,
	`item_sku_snapshot` text,
	`unit_snapshot` text,
	`quantity` real,
	`weight` real,
	`length` real,
	`width` real,
	`height` real,
	`unit_price` real NOT NULL,
	`discount` real,
	`tax_rate` real,
	`line_total` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invoice_items_invoice_id_idx` ON `invoice_items` (`invoice_id`);--> statement-breakpoint
CREATE INDEX `invoice_items_item_id_idx` ON `invoice_items` (`item_id`);--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount` real NOT NULL,
	`payment_date` text NOT NULL,
	`method` text NOT NULL,
	`reference` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `payments_invoice_id_idx` ON `payments` (`invoice_id`);--> statement-breakpoint
CREATE TABLE `social_links` (
	`id` text PRIMARY KEY NOT NULL,
	`business_id` text NOT NULL,
	`platform` text NOT NULL,
	`url` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `social_links_business_id_idx` ON `social_links` (`business_id`);--> statement-breakpoint
CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`default_currency` text NOT NULL,
	`default_tax_rate` real,
	`default_payment_terms_days` integer NOT NULL,
	`invoice_template_id` text NOT NULL,
	`backup_frequency` text NOT NULL,
	`last_backup_at` text,
	`cloud_backup_enabled` integer DEFAULT false NOT NULL,
	`app_lock_enabled` integer DEFAULT false NOT NULL,
	`biometric_unlock_enabled` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `backup_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`direction` text NOT NULL,
	`status` text NOT NULL,
	`file_name` text,
	`size_bytes` integer,
	`error_message` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `backup_logs_created_at_idx` ON `backup_logs` (`created_at`);