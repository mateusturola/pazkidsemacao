CREATE TABLE `parceiros` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`link` text,
	`logo_key` text,
	`ordem` integer DEFAULT 0 NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `parceiros_ordem_idx` ON `parceiros` (`ativo`,`ordem`);--> statement-breakpoint
ALTER TABLE `pedidos` ADD `exibir_nome` integer DEFAULT false NOT NULL;