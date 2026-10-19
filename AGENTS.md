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

## Próxima fase (Lovable Cloud)
Login real e papéis; trocar `demo.ts`/`platform.ts` por tabelas seguindo `types.ts`; transformar as ações de `store.tsx`
em gravações; Stripe e Google Agenda conforme `PENDENTES.md`.
