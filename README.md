# Paz Kids em Ação: site e painel

Site das campanhas do Paz Kids em Ação (Igreja da Paz, Heliópolis) e painel da equipe, num Worker da
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

Next.js 15 (App Router, server actions) · Tailwind 4 · Drizzle · Cloudflare D1 + R2 · OpenNext · Asaas.

## Rodando local

```bash
npm install
npm run db:migrate:local      # cria o D1 local (com o primeiro admin e a campanha de Natal em rascunho)
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
   ```
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
