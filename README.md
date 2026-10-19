# Frankkia — Seu universo imobiliário, em um só lugar.

Site de apresentação + plataforma (área logada) para imobiliárias, em **versão demonstrativa**:
todas as telas funcionam com **dados de exemplo** (somem ao recarregar a página).

## Stack

Vite + React 18 + TypeScript + Tailwind CSS 3 · `react-router-dom` (rotas) · `framer-motion` (animações) · `lenis` (rolagem suave) · `lucide-react` (ícones).

```bash
npm install
npm run dev     # http://localhost:8080
npm run build   # verificação de tipos + build de produção
```

## Onde fica cada coisa

| Pasta / arquivo | O que é |
| --- | --- |
| `src/content.ts` | Textos do site público (hero, funções, planos, dúvidas, demonstração) |
| `src/pages/` | Site público (`Landing`), login, convite (primeiro acesso) e pagamento do upgrade |
| `src/components/` | Seções do site público e os mockups animados |
| `src/app/` | Plataforma: menu, páginas internas, agenda, formulários e componentes visuais |
| `src/app/admin/` | Painel Frankkia (criador): imobiliárias, upgrades, chamados, erros, agenda |
| `src/data/types.ts` | **Formato dos dados** — cada tipo vira uma tabela no banco |
| `src/data/demo.ts` / `platform.ts` | **Dados de exemplo** (substituir pelo banco real) |
| `src/data/queries.ts` | Cálculos: VGV, locação, VGC, rankings, mercado, aniversários |
| `src/data/store.tsx` | Ações (criar, editar, registrar...) — cada uma vira uma gravação no banco |
| `PENDENTES.md` | Próximas etapas (Google Agenda real, Stripe real) |

## Perfis de acesso (demonstração)

Use o seletor **"Ver como"** no topo (ou os botões da tela de login):

- **Administrador** da imobiliária — vê toda a equipe, registra vendas/locações, gerencia equipe e plano.
- **Corretor** — vê só os próprios dados; informa fechamentos para o administrador registrar.
- **Frankkia** — painel do criador (`/admin`): imobiliárias, pedidos de upgrade, chamados, erros.

## Próxima fase (Lovable Cloud)

1. Login real (e-mail/senha), convites e papéis (administrador/corretor/Frankkia).
2. Trocar `src/data/demo.ts` e `platform.ts` por tabelas do banco, seguindo `src/data/types.ts`.
3. Transformar as ações de `src/data/store.tsx` em gravações no banco.
4. Stripe (upgrade de plano) e Google Agenda (OAuth) — detalhes em `PENDENTES.md`.
