# Convenções — Paz Kids em Ação

Site das campanhas (pazkidsemacao.com) e painel da equipe (painel.pazkidsemacao.com), num Worker só.

## Dados de crianças (LGPD e ECA)

- O site mostra o mínimo: apelido público ou primeiro nome, idade, tamanhos, sugestão de presente,
  gostos, sonho e "sobre" (o texto da família; sem ele, `historiaCrianca` monta um com o cadastro).
  **Nunca** sobrenome, responsável, contato ou observações. Toda consulta pública passa por
  `criancasDaCampanha` (`src/lib/campanhas.ts`), que só seleciona esses campos.
- Bucket R2 privado. Foto sai pelo site (`/fotos/[id]`) só com `autorizacao_imagem` e só de criança
  numa campanha publicada; sem autorização, o avatar. No painel, pela rota protegida da criança.
- Avatar é DiceBear (estilo lorelei, CC0). O navegador mostra a prévia; o servidor gera de novo a
  partir da semente para salvar. Nunca grave SVG vindo do navegador.
- Backup do D1 nunca vai para o repositório (`/backups` está no .gitignore).

## Reserva

- Quem decide quem leva a criança é o UPDATE condicional em `reservar` (`src/lib/reservas.ts`):
  só troca `disponivel` por `reservada`. Não troque por "lê e depois grava".
- `liberarExpiradas()` roda antes de mostrar ou reservar crianças (o cron diário é só para e-mails e Instagram).
- Campanha aberta = ativa e dentro da data de fim (`campanhaAberta`). Use sempre a função, nunca só o status.
- Pagamento online reserva por 30 minutos; balcão reserva até o prazo da campanha e só a equipe libera.

## Segurança

- Login do painel é o Cloudflare Access (código por e-mail, qualquer e-mail), e o Worker **também**
  valida o JWT (`src/lib/access.ts`). Quem entra é decidido pela tabela `usuarios_painel`
  (`src/lib/auth.ts`). Sem `ACCESS_TEAM_DOMAIN`/`ACCESS_AUD`, o painel nega tudo. A única exceção é
  `NODE_ENV=development` (o `next dev` local).
- `workers_dev` e `preview_urls` desligados: seriam uma entrada no Worker sem passar pelo Access.
- Toda server action do painel chama `requireUsuario()` ou `requireAdmin()`: o middleware protege
  páginas, não actions. Route handler do painel confere `usuarioAtual()`.
- O token do pedido é a única proteção da página do doador: 18 bytes aleatórios, `noindex`, `no-referrer`.
- Webhook do Asaas só aceita o `ASAAS_WEBHOOK_TOKEN` e responde 200 a todo o resto (erro seguido pausa a fila).

## Dados

- Cloudflare Workers (OpenNext) + D1. Use `getDb()` dentro da requisição; variáveis com `env()`.
- Dinheiro em **centavos**. Data pura em texto `YYYY-MM-DD`; instante em `timestamp_ms`.
- O D1 aceita no máximo 100 parâmetros por consulta: insert em lote vai em pedaços (`db.batch`).
- Migration aditiva, gerada com `drizzle-kit generate` e aplicada com `wrangler d1 migrations apply`.
  Nunca edite uma migration já aplicada em produção.

## Visual

- Site institucional do Paz Kids em Ação: o amarelo do projeto é a cor principal, com a tinta escura
  do Paz Kids (classe `.tema-paz`). A campanha de Natal tem marca própria (`.tema-natal`, padrão).
- Manual da marca da campanha (Drive › CAMPANHA DE NATAL › Marca): verde #1E4B36 e creme #F4EFE3 de
  base, amarelo #F5B629 e vermelho #D64A2B de destaque. Texto amarelo só sobre o verde.
- Fredoka nos títulos, Nunito no texto, Caveat Brush só em frase de destaque (uma por bloco).
- Pincelada amarela (`.pincelada`) sublinha uma palavra, nunca um parágrafo. Formas orgânicas sempre
  grandes e cortadas pela borda. Ícones de traço arredondado em verde; a estrela é o único preenchido.
- Logo da campanha: o original de `public/natal/logo`, nunca redigitado nem recolorido; colorido só em
  fundo claro, negativo no verde. O site institucional usa o logo do Paz Kids em Ação (balões): o horizontal
  (`public/brand/pazkids-em-acao-horizontal-*`, do time de design) no menu, rodapé e painel; o vertical só no story.
- Sem glow, sem degradê em texto, sem dado inventado no site. Imagem de IA só como clima da campanha;
  foto de criança atendida é real e com autorização.
- Data se escolhe no `DatePicker`, nunca em `<input type="date">`.
- Rodapé: "Desenvolvido por" com o logo da The Kingdom Digital, na versão branca (o fundo é escuro).

## Padrinho e criança

- A mensagem e o "vou orar" de cada criança ficam em `pedido_itens`. A equipe lê e imprime pela página
  "Mensagens para imprimir" da campanha: o que estiver lá chega à criança.
- O agradecimento fala das crianças pelo nome e sonho (`natalDas`), nunca só "N crianças".
- Convite de campanha nova (painel › Convites) só vai para quem marcou, no finalizar, "quero receber as
  próximas campanhas" (`inscricoes_novidades`, por e-mail). A caixinha vem desmarcada e é separada do
  aceite da campanha. Todo convite leva o "não quero mais receber" (página com confirmação e POST de um
  clique). Os e-mails do próprio pedido não dependem disso.

## Equipe

- "Quem cuida do projeto" na página inicial vem da tabela `equipe` (painel › Equipe, só admin). Uma linha
  é uma pessoa ou um casal. Foto com o fundo recortado (PNG/WebP transparente) fica sobre a cor de um
  balão do logo; amarelo não, porque é a cor da camiseta. Sem Instagram, o ícone leva ao do projeto.

## Quem faz parte

- Empresas parceiras (tabela `parceiros`, painel › Parceiros, só admin): logo, uma frase e o link, que só
  aceita http(s) (`linkSeguro`).
- Mural de quem apadrinhou: só com a caixinha "quero que meu nome apareça" marcada no finalizar
  (`pedidos.exibir_nome`, desmarcada) e só de pedido confirmado (pago, aguardando entrega ou entregue).
  Mostra primeiro e último nome (`nomeNoMural`). A equipe tira pelo pedido no painel.

## Agenda semanal

- Vive no painel (tabela `agenda`, com estado e cidade; hora opcional) e aparece na página inicial e em
  `/agenda` (link da bio, com endereço e "Como chegar") pelo mapa do Brasil em SVG (`AgendaBrasil`), e no
  story do painel, um por estado.
- Os estados atendidos e as crianças por semana ficam em `configuracoes` (painel › Agenda › Onde o projeto
  está, `lerAlcance`): pintam o mapa e entram nos textos ("em 7 estados"), no FAQ, no SEO e no llms.txt.
  Contorno dos estados: malha do IBGE (`src/content/mapa-brasil.ts`).

## Demonstração

- `PAGAMENTO_MODO=demo` simula o pagamento; só `"asaas"` cobra. A rota de simulação recusa tudo fora do demo.
- `seed/demo.sql` é só para demonstração.
- Criança de demonstração tem `id_externo` começando com `demo-`. Painel › Configurações apaga elas e o
  que só existe por causa delas (`src/lib/demonstracao.ts`). Nenhum código real (o "Código no sistema antigo"
  da planilha) pode começar assim.

## Linguagem

- "Apadrinhar" e "apadrinhe uma criança". Nunca "adotar", "adote" ou "adoção": é o termo que a equipe usa.
- A igreja é a **Paz Church** (Paz Church São Paulo). O projeto está em Heliópolis e em outros estados, mas não existe
  Paz Church em Heliópolis: nunca escreva "igreja de Heliópolis" nem "Igreja da Paz". A única exceção é o
  favorecido do Pix ("Igreja da Paz na Cidade de São Paulo"), que é o nome que o banco mostra ao doador.
- Contato e voluntariado são pelo WhatsApp do projeto; heliopolis@paz.church é só a chave Pix.

## Código

Comentário explica **por que**, não o que. Escreva em português, como o resto do código.
