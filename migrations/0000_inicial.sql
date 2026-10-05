CREATE TABLE `campanhas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL,
	`tipo` text DEFAULT 'natal' NOT NULL,
	`descricao` text,
	`data_inicio` text,
	`data_fim` text,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`valor_sacolinha` integer,
	`max_parcelas` integer DEFAULT 1 NOT NULL,
	`prazo_entrega` text,
	`itens_sacolinha` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campanhas_slug_unique` ON `campanhas` (`slug`);--> statement-breakpoint
CREATE TABLE `criancas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`apelido_publico` text,
	`data_nascimento` text,
	`sexo` text,
	`tamanho_camiseta` text,
	`tamanho_calca` text,
	`tamanho_calcado` text,
	`sugestao_presente` text,
	`gostos` text,
	`foto_key` text,
	`avatar_key` text,
	`avatar_seed` text,
	`responsavel_nome` text,
	`responsavel_contato` text,
	`autorizacao_imagem` integer DEFAULT false NOT NULL,
	`autorizacao_imagem_data` text,
	`observacoes` text,
	`id_externo` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `criancas_nome_idx` ON `criancas` (`nome`);--> statement-breakpoint
CREATE INDEX `criancas_id_externo_idx` ON `criancas` (`id_externo`);--> statement-breakpoint
CREATE TABLE `log_auditoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`autor` text NOT NULL,
	`acao` text NOT NULL,
	`entidade` text NOT NULL,
	`entidade_id` text,
	`detalhes` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `log_entidade_idx` ON `log_auditoria` (`entidade`,`entidade_id`);--> statement-breakpoint
CREATE INDEX `log_criado_idx` ON `log_auditoria` (`criado_em`);--> statement-breakpoint
CREATE TABLE `padrinhos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`email` text,
	`telefone` text,
	`cpf` text,
	`asaas_customer_id` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `padrinhos_cpf_idx` ON `padrinhos` (`cpf`);--> statement-breakpoint
CREATE INDEX `padrinhos_email_idx` ON `padrinhos` (`email`);--> statement-breakpoint
CREATE TABLE `participacoes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crianca_id` integer NOT NULL,
	`campanha_id` integer NOT NULL,
	`pedido_id` integer,
	`status` text DEFAULT 'disponivel' NOT NULL,
	`padrinho_nome` text,
	`padrinho_contato` text,
	`canal` text,
	`data_apadrinhamento` text,
	`data_entrega` text,
	`observacoes` text,
	`atualizado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`crianca_id`) REFERENCES `criancas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `participacoes_crianca_campanha_uq` ON `participacoes` (`crianca_id`,`campanha_id`);--> statement-breakpoint
CREATE INDEX `participacoes_campanha_status_idx` ON `participacoes` (`campanha_id`,`status`);--> statement-breakpoint
CREATE INDEX `participacoes_pedido_idx` ON `participacoes` (`pedido_id`);--> statement-breakpoint
CREATE TABLE `pedido_itens` (
	`pedido_id` integer NOT NULL,
	`crianca_id` integer NOT NULL,
	PRIMARY KEY(`pedido_id`, `crianca_id`),
	FOREIGN KEY (`pedido_id`) REFERENCES `pedidos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`crianca_id`) REFERENCES `criancas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pedidos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token` text NOT NULL,
	`padrinho_id` integer NOT NULL,
	`campanha_id` integer NOT NULL,
	`modalidade` text NOT NULL,
	`ponto_coleta_id` integer,
	`valor` integer,
	`parcelas` integer DEFAULT 1 NOT NULL,
	`forma` text,
	`asaas_payment_id` text,
	`asaas_invoice_url` text,
	`status` text NOT NULL,
	`reservado_ate` integer,
	`prazo_entrega` text,
	`pago_em` integer,
	`entregue_em` integer,
	`pendencia` text,
	`observacoes` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`padrinho_id`) REFERENCES `padrinhos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ponto_coleta_id`) REFERENCES `pontos_coleta`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pedidos_token_unique` ON `pedidos` (`token`);--> statement-breakpoint
CREATE INDEX `pedidos_status_idx` ON `pedidos` (`status`);--> statement-breakpoint
CREATE INDEX `pedidos_campanha_idx` ON `pedidos` (`campanha_id`);--> statement-breakpoint
CREATE INDEX `pedidos_asaas_idx` ON `pedidos` (`asaas_payment_id`);--> statement-breakpoint
CREATE TABLE `pontos_coleta` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nome` text NOT NULL,
	`endereco` text,
	`horarios` text,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `usuarios_painel` (
	`email` text PRIMARY KEY NOT NULL,
	`nome` text,
	`papel` text DEFAULT 'voluntario' NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`criado_por` text,
	`criado_em` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
