# Convenções — Paz Kids em Ação

Site das campanhas (pazkidsemacao.com) e painel da equipe (painel.pazkidsemacao.com), num Worker só.

## Dados de crianças (LGPD e ECA)

- O site mostra o mínimo: apelido público ou primeiro nome, idade, tamanhos, sugestão de presente e
  gostos. **Nunca** sobrenome, responsável, contato ou observações. Toda consulta pública passa por
  `criancasDaCampanha` (`src/lib/campanhas.ts`), que só seleciona esses campos.
- Bucket R2 privado. Foto sai pelo site (`/fotos/[id]`) só com `autorizacao_imagem` e só de criança
  numa campanha publicada; sem autorização, o avatar. No painel, pela rota protegida da criança.
- Avatar é DiceBear (estilo lorelei, CC0). O navegador mostra a prévia; o servidor gera de novo a
  partir da semente para salvar. Nunca grave SVG vindo do navegador.
- Backup do D1 nunca vai para o repositório (`/backups` está no .gitignore).

## Reserva

- Quem decide quem leva a criança é o UPDATE condicional em `reservar` (`src/lib/reservas.ts`):
  só troca `disponivel` por `reservada`. Não troque por "lê e depois grava".
- Não há cron: `liberarExpiradas()` roda antes de mostrar ou reservar crianças.
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

- Cores e fontes da marca em `src/app/globals.css` (Fredoka, Nunito, Caveat Brush só em detalhe).
- Sem glow, sem degradê em texto, sem ícone decorativo inventado, sem dado inventado no site.
- Data se escolhe no `DatePicker`, nunca em `<input type="date">`.
- Rodapé: "Desenvolvido por" com o logo da The Kingdom Digital, na versão branca (o fundo é escuro).

## Código

Comentário explica **por que**, não o que. Escreva em português, como o resto do código.
