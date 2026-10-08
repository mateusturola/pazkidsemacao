CREATE TABLE `convites_enviados` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campanha_id` integer NOT NULL,
	`campanha_origem_id` integer NOT NULL,
	`para` text NOT NULL,
	`assunto` text NOT NULL,
	`html` text NOT NULL,
	`status` text NOT NULL,
	`erro` text,
	`enviado_por` text NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campanha_origem_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `convites_campanha_para_uq` ON `convites_enviados` (`campanha_id`,`para`);--> statement-breakpoint
CREATE TABLE `inscricoes_novidades` (
	`email` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`token` text NOT NULL,
	`aceitou_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`descadastrado_em` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `inscricoes_novidades_token_unique` ON `inscricoes_novidades` (`token`);