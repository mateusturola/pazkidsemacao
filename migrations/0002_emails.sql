CREATE TABLE `emails_enviados` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pedido_id` integer NOT NULL,
	`tipo` text NOT NULL,
	`para` text NOT NULL,
	`assunto` text NOT NULL,
	`html` text NOT NULL,
	`status` text NOT NULL,
	`erro` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `emails_pedido_tipo_uq` ON `emails_enviados` (`pedido_id`,`tipo`);