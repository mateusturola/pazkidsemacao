CREATE TABLE `configuracoes` (
	`chave` text PRIMARY KEY NOT NULL,
	`valor` text NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `instagram_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`permalink` text NOT NULL,
	`legenda` text,
	`tipo` text NOT NULL,
	`imagem_key` text NOT NULL,
	`publicado_em` integer NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `instagram_publicado_idx` ON `instagram_posts` (`publicado_em`);