-- Primeiro admin do painel. Os próximos usuários se cadastram pelo próprio painel.
INSERT OR IGNORE INTO usuarios_painel (email, nome, papel, ativo, criado_por)
VALUES ('turolamateus@gmail.com', 'Mateus', 'admin', 1, 'migration');
--> statement-breakpoint
-- A primeira campanha entra como rascunho: valor, prazo e crianças se completam no painel antes de publicar.
INSERT OR IGNORE INTO campanhas (nome, slug, tipo, descricao, status, max_parcelas, itens_sacolinha)
VALUES (
  'Sacolinha de Natal',
  'natal',
  'natal',
  'Neste Natal, queremos levar carinho, alegria e esperança para cada criança da nossa campanha. Você pode fazer parte disso preparando uma Sacolinha de Natal especialmente para uma criança.',
  'rascunho',
  1,
  '1 camiseta
1 calça
1 calçado
1 presente'
);
