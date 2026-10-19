# Instruções para agentes (Lovable e outros)

## O que é este projeto
Frankkia: site de apresentação + plataforma para imobiliárias (área do administrador, do corretor e painel do criador "Frankkia").
Hoje é uma **versão demonstrativa**: as telas funcionam com dados de exemplo em memória (somem ao recarregar).

## Regra principal: preservar o layout
O visual foi aprovado pelo dono do projeto. **Não redesenhe, não troque cores, fontes, espaçamentos, animações ou textos**
sem pedido explícito. Mudanças devem ser pontuais e seguir os padrões já existentes.

## Arquitetura (importante)
- Modelo Lovable **TanStack Start** (`vite.config.ts` usa `@lovable.dev/vite-tanstack-config`).
- O app inteiro roda no navegador: `src/routes/__root.tsx` monta `<App />` (`src/App.tsx`) uma única vez dentro de `ClientOnly`.
- **As telas usam `react-router-dom`** (rotas declaradas em `src/App.tsx`). As rotas do TanStack
  (`src/routes/index.tsx` e `src/routes/$.tsx`) só aceitam qualquer endereço e não desenham nada.
  Para criar uma página nova, adicione a rota em `src/App.tsx`, não em `src/routes/`.
- Estilo: **Tailwind 4** carregando a configuração de `tailwind.config.ts` via `@config` em `src/index.css`.
  Cores da marca: `bg`, `ink`, `muted`, `subtle`, `line`, `canvas`, `accent` (#2f5bea) etc. Fontes: Space Grotesk (títulos), Inter (texto), JetBrains Mono.
- Animações: `framer-motion`. Evite `<AnimatePresence mode="wait">` em trocas de página/aba (já causou tela em branco em cliques rápidos).

## Onde fica cada coisa
- `src/content.ts` — textos do site público.
- `src/pages/` — site público (Landing), login, convite (primeiro acesso), pagamento do upgrade.
- `src/components/` — seções do site público e mockups animados.
- `src/app/` — plataforma (menu, páginas, agenda, formulários, componentes `kit.tsx`, `forms.tsx`, `charts.tsx`).
- `src/app/admin/` — painel Frankkia (imobiliárias, upgrades, chamados, erros, agenda).
- `src/data/types.ts` — formato dos dados (cada tipo = uma tabela no banco).
- `src/data/demo.ts` e `src/data/platform.ts` — dados de exemplo.
- `src/data/queries.ts` — cálculos (VGV, locação, VGC, rankings, mercado, aniversários).
- `src/data/store.tsx` — ações (criar/editar/registrar) — cada uma vira uma gravação no banco.
- `PENDENTES.md` — próximas etapas (Stripe real, Google Agenda real).

## Regras de negócio que não podem mudar
- Comissão (VGC) é visível só para o próprio corretor e o administrador.
- Cada corretor vê apenas os próprios leads, captações, proprietários e vendas; o administrador vê todos.
- Só o administrador registra vendas e locações; o corretor apenas "informa o fechamento".
- O painel Frankkia nunca mostra dados internos das imobiliárias (só conta, plano e volumes de uso).

## Banco de dados (Supabase próprio, não Lovable Cloud)
- Projeto Supabase `yvbbktrufoyhtiotholf` (São Paulo). Estrutura e regras de segurança (RLS) em `supabase/migrations/`.
- Tipos gerados em `src/integrations/supabase/types.ts` (`npx supabase gen types typescript --linked --schema public`).
- As regras de negócio acima são garantidas **no banco** (RLS, gatilhos e funções). Não as contorne no app.
  Ranking, estudo de mercado, registrar venda/locação, aceitar convite e liberar upgrade usam funções do banco
  (`ranking_mes`, `estudo_mercado`, `ofertas_mercado`, `registrar_transacao`, `aceitar_convite`, `liberar_upgrade`).
- Login: `src/integrations/supabase/client.ts` (conexão) e `src/app/session.tsx` (sessão: modo "real" pelo banco ou "demo"
  pelos perfis de exemplo). `src/app/Guard.tsx` protege `/app` e `/admin`.
- Dados: no login real, `src/data/sync.ts` preenche as mesmas listas de `demo.ts` com os dados do banco, e cada ação de
  `store.tsx` grava no banco com `gravar(...)` (em ordem, por uma fila). Ao criar uma ação nova, siga esse padrão.
  Corretor: ranking e estudo de mercado vêm de `ranking_mes`/`estudo_mercado`/`ofertas_mercado` (sem dados dos colegas).
- Arquivos: vídeos da Academy são links do YouTube/Vimeo ("não listado", tocam em iframe); PDFs/Word vão para o
  armazenamento `academy` (privado, até 20 MB) e a logo para `marca` (pública, PNG até 5 MB), na pasta `<id da imobiliária>/`.
- Painel Frankkia no login real: `painel_imobiliarias()` traz só dados de conta e volumes de uso.
- Teste grátis: `imobiliarias.teste_dias` (definido pela Frankkia) vira `teste_ate` no 1º acesso do administrador;
  vencido, o banco bloqueia os dados (`imob_liberada`) e o app mostra a tela de contratar plano.
- Pagamento: Stripe em modo de teste (funções `criar-checkout` e `stripe-webhook` em `supabase/functions/`). O webhook marca
  o pedido como pago; a Frankkia libera o plano. Sem Stripe configurada, a Frankkia pode confirmar o pagamento à mão.
- E-mail: função `enviar-convite` (Resend). Segredos ficam no Supabase (Edge Functions → Secrets), nunca no código.
- Nunca coloque a chave secreta (service_role) no app ou no repositório; só a chave publicável vai no `.env`.

## Próxima fase
Login real e papéis; trocar `demo.ts`/`platform.ts` pelas tabelas; transformar as ações de `store.tsx`
em gravações; Stripe e Google Agenda conforme `PENDENTES.md`.
