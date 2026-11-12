# Ki Charme

Aplicação React com TanStack Start, Tailwind CSS e Supabase. Execute os comandos abaixo na pasta que contém o package.json (Cliente).

## Executar no Windows

Use Node.js 22.12 ou superior da linha 22.x. No PowerShell:

```powershell
cd "C:\Users\caue\Documents\Loja Ki-charme\Cliente"
npm.cmd ci --legacy-peer-deps
npm.cmd run dev
```

Abra http://127.0.0.1:5173/ e, para o painel, http://127.0.0.1:5173/admin/login.
Mantenha o terminal aberto. Para encerrar, pressione Ctrl+C.
O npm.cmd evita o bloqueio de execução de scripts npm.ps1 em algumas instalações do PowerShell.
A opção --legacy-peer-deps contorna a falha do resolvedor de peers do npm observada nesta máquina; o package-lock.json fixa a instalação utilizada nos testes.

## Variáveis de ambiente

O arquivo original chamado env foi renomeado para .env.local, que o Vite carrega automaticamente. Os valores existentes foram preservados. Em outra máquina, copie .env.example para .env.local e preencha:

| Variável                      | Uso                                              |
| ----------------------------- | ------------------------------------------------ |
| VITE_SUPABASE_URL             | URL do projeto para o navegador                  |
| VITE_SUPABASE_PUBLISHABLE_KEY | Chave pública para o navegador                   |
| SUPABASE_URL                  | Mesma URL, para as funções de servidor           |
| SUPABASE_PUBLISHABLE_KEY      | Mesma chave pública, para as funções de servidor |

Obtenha URL e chave pública no painel Connect/API Keys do seu projeto Supabase. Reinicie o servidor depois de alterar .env.local.
As funções administrativas usam a sessão do usuário e as políticas RLS; elas não precisam da service role.
SUPABASE_SERVICE_ROLE_KEY só é necessária se uma nova função usar explicitamente client.server.ts. Nunca coloque uma chave service_role ou sb_secret_ em variáveis VITE_, que são enviadas ao navegador.
O .gitignore exclui .env.local e demais arquivos de ambiente; .env.example pode ser versionado.

## Acesso administrativo e fotos

Entre com um usuário existente em Supabase Authentication. Além do login, o usuário precisa do papel admin na tabela public.user_roles. As funções do painel verificam esse papel no banco em cada chamada.
Se o login funcionar mas o painel negar acesso, confira o papel no Supabase. Não desative RLS para contornar esse erro.

As migrações em supabase/migrations definem tabelas e políticas. As tabelas categories, products e store_settings já responderam às consultas públicas neste ambiente; não reaplique os scripts de criação num banco existente sem conferir o histórico.
O código de fotos usa o bucket product-photos e URLs públicas: confira no Supabase Storage se esse bucket existe e permite leitura pública das fotos da loja. As políticas das migrações restringem envio, alteração e remoção a administradores.

## Testar e compilar

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

O build local usa o preset node-server do Nitro. Para conferir a saída da Vercel localmente:

```powershell
$env:NITRO_PRESET = "vercel"
npm.cmd run build
Remove-Item Env:NITRO_PRESET
```

## Teste na Vercel

1. Envie o código e package-lock.json ao seu repositório. Não envie .env.local.
2. Importe o repositório na Vercel. Se ele contém a pasta Cliente, selecione Cliente como Root Directory; se package.json já está na raiz do repositório, use a raiz.
3. Use Node.js 22.x e o framework TanStack Start. O vercel.json define a instalação com npm ci --legacy-peer-deps e o build com npm run build. Deixe Output Directory no padrão do framework; não use dist.
4. Em Environment Variables, cadastre as quatro variáveis acima nos ambientes Preview e Production, copiando os valores de .env.local. Configure-as antes do build e refaça o deploy se forem alteradas.
5. A Vercel define VERCEL automaticamente; vite.config.ts seleciona o preset vercel do Nitro, que gera .vercel/output.
6. Confira /, /catalogo e /admin/login no endereço publicado. Faça o login com sua conta e teste o painel. O build local não verifica as permissões da sua conta.
7. Em Supabase Authentication > URL Configuration, use o domínio publicado como Site URL e inclua os endereços locais/preview usados em fluxos de confirmação e recuperação de senha na lista de URLs permitidas.

Documentação: [TanStack Start na Vercel](https://vercel.com/docs/frameworks/full-stack/tanstack-start) e [Supabase com React](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs).

## Estado atual do catálogo

O painel administrativo usa o Supabase. A vitrine pública em src/data/catalog.ts ainda importa demo-data.ts. Por isso, salvar uma peça no painel ainda não a publica automaticamente na vitrine desta versão. Para isso, falta adaptar o carregamento público para buscar o catálogo do banco e alimentar os componentes; não se trata de uma configuração da Vercel.
