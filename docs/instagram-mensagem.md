# Conectar o Instagram ao site

O site mostra os últimos posts do @pazkidsemacao. Para isso precisa de um token da API oficial do
Instagram, gerado por quem administra a conta. Enquanto ele não existe, a seção mostra fotos das
ações no lugar dos posts.

## Mensagem para a Taísa (copiar e mandar)

> Oi, Taísa! Tudo bem? Estou fazendo o novo site do Paz Kids em Ação e ele vai mostrar os últimos
> posts do nosso Instagram (@pazkidsemacao) automaticamente. Pra isso preciso de uma "chave" que só
> quem administra a conta consegue gerar. São uns 10 minutos:
>
> 1. No app do Instagram, confere se a conta é Profissional: Configurações › Tipo de conta e
>    ferramentas. Se for pessoal, muda para "Criador" ou "Empresa" (não perde nada).
> 2. Entra em developers.facebook.com com o Facebook que administra o Instagram e clica em
>    "Meus apps" › "Criar app" › caso de uso "Outro" › tipo "Empresa". Nome: Site Paz Kids em Ação.
> 3. No app, adiciona o produto "Instagram" e escolhe "API configuration with Instagram login".
> 4. Em "Generate access tokens", clica em "Add account", entra com o @pazkidsemacao e autoriza.
> 5. Aparece um botão "Generate token": copia o token (um texto bem grande) e me manda por aqui.
>
> Se preferir, me adiciona como administrador nesse app (Funções do app › Administradores) com o meu
> Facebook, que eu gero por lá. O token só lê os posts públicos, não posta nada e não acessa
> mensagens. Obrigado!

## Depois de receber o token

```bash
npx wrangler secret put INSTAGRAM_TOKEN   # cola o token
```

No painel, em Configurações › Instagram, clique em **Atualizar agora**. Daí em diante o cron diário
busca os posts novos e renova o token sozinho (ele vale 60 dias e é renovado toda semana).
