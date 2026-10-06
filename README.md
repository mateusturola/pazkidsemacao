# Paz Kids em Ação: site e painel

Site das campanhas do Paz Kids em Ação (Paz Church São Paulo; ações em Heliópolis) e painel da equipe, num Worker da
Cloudflare com D1 e R2.

- **`pazkidsemacao.com`**: página do projeto (quem somos, missão, campanhas abertas, Pix).
- **`pazkidsemacao.com/<campanha>`**: página da campanha, por exemplo `/natal`. O doador escolhe uma ou
  mais crianças (como num carrinho) e finaliza de uma vez:
  - **pagar online** (Pix ou cartão, pelo Asaas): as crianças ficam reservadas por 30 minutos; o webhook
    confirma e elas viram *apadrinhadas*. Se não confirmar, voltam para a lista sozinhas.
  - **montar e entregar** num ponto de coleta: ficam reservadas até a data limite; a equipe marca
    *entregue* no painel. Passou do prazo, o painel avisa e a equipe decide se libera.
- **`pazkidsemacao.com/pedido/<token>`**: página do doador com o pedido, os tamanhos e onde entregar.
- **`painel.pazkidsemacao.com`**: painel (crianças, campanhas, pedidos, pontos de coleta, usuários,
  importação de planilha, avatar, relatórios e auditoria).

Next.js 15 (App Router, server actions) · Tailwind 4 · Drizzle · Cloudflare D1 + R2 · OpenNext · Asaas · Resend.

A página do Natal segue o manual da marca da campanha (verde, creme, amarelo e vermelho; Fredoka,
Nunito e Caveat Brush; formas orgânicas e pincelada). Logos e símbolos de apoio estão em
`public/natal/`; fotos em `public/img/` (`acao-*` são reais, `ia-*` são as imagens geradas por IA do manual).

## Modo demonstração

Para a equipe ver tudo funcionando antes de ter conta no Asaas e crianças reais:

- `PAGAMENTO_MODO = "demo"` (wrangler.jsonc): o pagamento online usa uma tela de pagamento simulada
  (Pix com QR Code e cartão) que confirma o pedido como o webhook do Asaas faria. Ninguém é cobrado.
  Para valer, mude para `"asaas"` e cadastre a chave.
- `seed/demo.sql` + `seed/demo-300.sql`: 300 crianças fictícias (só primeiro nome e avatar), valor e
  prazo de exemplo, um ponto de coleta. Só para demonstração; nunca no banco com crianças reais.
- Sem token do Instagram, a seção de posts mostra fotos das ações.

## Fim da campanha

A campanha sai sozinha da página inicial e para de aceitar padrinhos quando passa a **data de fim**
(ou quando a situação muda para Encerrada no painel). A página dela continua no ar como agradecimento,
com quantas crianças ganharam a sacolinha.

## E-mails

Pelo Resend (`RESEND_API_KEY` + `EMAIL_REMETENTE`, domínio verificado no Resend). Cada pedido recebe:
agradecimento (no online, quando o pagamento confirma), lembrete 3 dias antes e na véspera do prazo do
balcão, e aviso quando a sacolinha chega. Tudo fica registrado em **Painel › E-mails**, com a prévia
de cada um. Sem a chave, os e-mails são montados e registrados como "demonstração", sem envio.

Os lembretes saem pelo cron do Worker (`triggers.crons`, 9h de Brasília), que chama `/api/cron` com o
secret `CRON_SECRET`; o mesmo cron atualiza os posts do Instagram (`docs/instagram-mensagem.md`).

## Google e IAs

- Dados estruturados (schema.org): organização (NGO) com área de atuação, igreja, redes e doação;
  perguntas frequentes (FAQPage); campanha como Event com DonateAction. Em `src/lib/seo.ts`.
- `/llms.txt`: resumo do projeto e das campanhas abertas em Markdown, para ChatGPT, Claude, Perplexity e Gemini.
- `robots.txt` libera buscadores e robôs de IA; só fecha pedido, imagem de criança, API e painel.
- Imagens de compartilhamento: `public/og-home.jpg` e `public/natal/og-natal.jpg`.

Depois de publicar:

1. **Google Search Console** (search.google.com/search-console): adicionar a propriedade de domínio
   `pazkidsemacao.com`, verificar pelo DNS (a Cloudflare tem o atalho) e enviar `https://pazkidsemacao.com/sitemap.xml`.
2. **Bing Webmaster Tools** (bing.com/webmasters): importar do Search Console. O Bing alimenta o ChatGPT e o Copilot.
3. **Perfil da Empresa no Google** (business.google.com): cadastrar "Paz Kids em Ação" como
   organização sem fins lucrativos em Heliópolis, com o site. É o que aparece no Maps e nas buscas locais.
4. Pôr o link do site na bio do Instagram e no site da Paz Church: link de sites conhecidos é o que mais pesa.

## Rodando local

```bash
npm install
npm run db:migrate:local      # cria o D1 local (com o primeiro admin e a campanha de Natal em rascunho)
npx wrangler d1 execute pazkidsemacao --local --file=seed/demo.sql       # opcional: demonstração
npx wrangler d1 execute pazkidsemacao --local --file=seed/demo-300.sql   # opcional: escala de 300 crianças
npm run dev                   # site em http://localhost:3000, painel em http://painel.localhost:3000
```

No `next dev` o painel abre sem login, como o admin do `ADMIN_EMAIL`. Para testar o pagamento online,
copie `.dev.vars.example` para `.dev.vars` com a chave do **sandbox** do Asaas.

`npm run preview` roda o build de produção no runtime da Cloudflare (`http://localhost:8787`). Lá o
painel já exige o Access; para simular o subdomínio: `npx wrangler dev --host painel.pazkidsemacao.com`.

## Publicar (primeira vez)

1. **Banco e arquivos**
   ```bash
   npx wrangler d1 create pazkidsemacao           # copie o database_id para o wrangler.jsonc
   npx wrangler r2 bucket create pazkidsemacao-arquivos
   ```
2. **Login do painel (Cloudflare Zero Trust → Access)**
   - Em *Settings → Authentication*, ative o **One-time PIN** (código por e-mail).
   - Crie uma aplicação *Self-hosted* para `painel.pazkidsemacao.com`, com uma política **Allow** para
     **Everyone** (qualquer e-mail que receba o código). Quem entra de fato é decidido pelo painel, na
     tabela de usuários; assim, liberar alguém é só cadastrar o e-mail em *Usuários*.
   - Copie o *team domain* (`https://<time>.cloudflareaccess.com`) e o *Application Audience (AUD) tag*
     para `ACCESS_TEAM_DOMAIN` e `ACCESS_AUD` no `wrangler.jsonc`. Vazios, o painel responde 403.
3. **Asaas** (comece no sandbox: `ASAAS_ENV` já vem como `"sandbox"`)
   ```bash
   npx wrangler secret put ASAAS_API_KEY          # chave da conta (sandbox ou produção, conforme ASAAS_ENV)
   npx wrangler secret put ASAAS_WEBHOOK_TOKEN    # texto longo aleatório, inventado por você
   npx wrangler secret put RESEND_API_KEY         # e-mails
   npx wrangler secret put CRON_SECRET            # texto longo aleatório (rotina diária)
   npx wrangler secret put INSTAGRAM_TOKEN        # opcional, veja docs/instagram-mensagem.md
   ```
   Com o Asaas pronto, mude `PAGAMENTO_MODO` para `"asaas"` no `wrangler.jsonc`.
   Depois do deploy, em *Painel → Configurações*, clique em **Cadastrar webhook**.
4. **Deploy**: `npm run deploy` (aplica as migrations, builda e publica). Precisa de
   `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`, ou `npx wrangler login`. Os domínios do
   `wrangler.jsonc` (`pazkidsemacao.com`, `www` e `painel`) são ligados ao Worker no deploy.
5. **No painel**: cadastre os pontos de coleta, importe as crianças, abra a campanha *Sacolinha de Natal*,
   preencha valor e data limite, adicione as crianças e mude para **Ativa**.

## Antes de abrir a campanha

O que ainda depende da equipe (nada disso foi inventado no código):

- **Valor da sacolinha**: sem ele, o site só oferece montar e entregar.
- **Pontos de coleta** com endereço e horários (cadastro no painel).
- **Data limite** de entrega no balcão: sem ela, o site só oferece o pagamento online.
- **Conta do Asaas** (sandbox para testar; produção para valer) e o webhook.
- **Importação**: a planilha (.xlsx ou .csv) é lida no navegador, com as colunas casadas automaticamente
  pelo nome. Quem já existe (mesmo código, ou mesmo nome e nascimento) é atualizado, não duplicado.
  Fotos não vêm pela planilha: suba pelo painel, criança por criança.

## Onde mexer

| O quê | Onde |
|---|---|
| Textos do projeto, Pix, redes | `src/content/site.ts` |
| Cores e fontes | `src/app/globals.css` |
| Regras de reserva e pagamento | `src/lib/reservas.ts`, `src/app/(site)/[slug]/finalizar/actions.ts` |
| Limite de crianças por pedido | `src/lib/regras.ts` |
| Estrutura do banco | `src/db/schema.ts` → `npm run db:generate -- --name o_que_mudou` |

## Backup

O D1 guarda 30 dias de histórico (Time Travel). Para ter cópia fora da Cloudflare:
`npm run db:backup` (salva em `backups/`, que não vai para o git, porque tem dados de crianças).
