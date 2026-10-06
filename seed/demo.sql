-- Dados de DEMONSTRAÇÃO, para a equipe ver o site funcionando antes das crianças reais.
-- Crianças fictícias (só primeiro nome, avatar ilustrado), valor e prazo de exemplo.
-- Nunca rode isto no banco de produção depois que as crianças reais forem cadastradas.
--   npx wrangler d1 execute pazkidsemacao --local --file=seed/demo.sql

UPDATE campanhas SET status = 'ativa', valor_sacolinha = 15000, max_parcelas = 3, prazo_entrega = '2026-12-13',
  data_inicio = '2026-10-15', data_fim = '2026-12-20' WHERE slug = 'natal';

INSERT INTO pontos_coleta (nome, endereco, horarios) VALUES
  ('Recepção do Paz Kids · Paz Church São Paulo', 'Endereço a confirmar pela equipe', 'Horários a confirmar pela equipe');

INSERT INTO criancas (nome, data_nascimento, sexo, tamanho_camiseta, tamanho_calca, tamanho_calcado, sugestao_presente, gostos, autorizacao_imagem, id_externo) VALUES
  ('Ana Clara', '2018-03-14', 'F', '8', '8', '30', 'Boneca', 'Desenhar e dançar', 0, 'demo-1'),
  ('Davi', '2014-01-05', 'M', '12', '12', '36', 'Bola de futebol', 'Futebol e videogame', 0, 'demo-2'),
  ('Lívia', '2020-07-20', 'F', '6', '6', '26', 'Kit de pintura', 'Massinha', 0, 'demo-3'),
  ('João Pedro', '2016-11-02', 'M', '10', '10', '33', 'Carrinho de controle remoto', 'Correr e brincar de pega-pega', 0, 'demo-4'),
  ('Helena', '2019-09-30', 'F', '6', '6', '28', 'Livro de histórias', 'Ler e ouvir histórias', 0, 'demo-5'),
  ('Miguel', '2017-05-22', 'M', '10', '8', '31', 'Kit de super-herói', 'Super-heróis', 0, 'demo-6'),
  ('Sophia', '2015-12-08', 'F', '12', '12', '34', 'Estojo completo', 'Escola e desenho', 0, 'demo-7'),
  ('Arthur', '2021-02-17', 'M', '4', '4', '24', 'Caminhãozinho', 'Brincar na areia', 0, 'demo-8'),
  ('Valentina', '2016-04-11', 'F', '10', '10', '32', 'Patins', 'Cantar louvor', 0, 'demo-9'),
  ('Gabriel', '2013-08-29', 'M', '14', '14', '38', 'Fone de ouvido', 'Música e skate', 0, 'demo-10'),
  ('Maria Alice', '2018-10-03', 'F', '8', '8', '29', 'Mochila', 'Bonecas e casinha', 0, 'demo-11'),
  ('Heitor', '2019-06-15', 'M', '6', '6', '27', 'Quebra-cabeça', 'Dinossauros', 0, 'demo-12');

INSERT INTO participacoes (crianca_id, campanha_id, status)
  SELECT c.id, (SELECT id FROM campanhas WHERE slug = 'natal'), 'disponivel' FROM criancas c WHERE c.id_externo LIKE 'demo-%';

-- Três já apadrinhadas pela equipe, para a barra de progresso e os relatórios não começarem vazios.
UPDATE participacoes SET status = 'apadrinhada', canal = 'whatsapp', padrinho_nome = 'Padrinho de demonstração', data_apadrinhamento = '2026-10-20'
  WHERE crianca_id IN (SELECT id FROM criancas WHERE id_externo IN ('demo-10', 'demo-11'));
UPDATE participacoes SET status = 'apadrinhada', canal = 'igreja', padrinho_nome = 'Padrinho de demonstração', data_apadrinhamento = '2026-10-22'
  WHERE crianca_id IN (SELECT id FROM criancas WHERE id_externo = 'demo-12');
