CREATE TABLE `agenda` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`dia_semana` integer NOT NULL,
	`hora` text NOT NULL,
	`nome` text NOT NULL,
	`endereco` text NOT NULL,
	`complemento` text,
	`lat` real,
	`lng` real,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `agenda_dia_idx` ON `agenda` (`dia_semana`,`hora`);