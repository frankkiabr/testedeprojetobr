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

## ⚠️ Regra do banco (leia antes de mexer em qualquer coisa de dados)
- O banco da Frankkia é o **Supabase próprio** do dono, projeto `yvbbktrufoyhtiotholf`. **Não é o Lovable Cloud.**
- O app conecta por `src/integrations/frankkia/client.ts` (endereço e chave publicável fixos no código, de propósito).
  Os tipos do banco ficam em `src/integrations/frankkia/types.ts`.
- `src/integrations/supabase/` e o `.env` são reescritos pelo Lovable Cloud e apontam para outro banco (vazio, com
  outras tabelas: organizations, memberships...). **Não use esse banco, não gere tipos a partir dele e não "migre" as
  telas para ele.** Se o build acusar tabelas inexistentes, o problema é olhar para o banco errado — não mude o código
  da Frankkia. Pedidos visuais (ícones, textos, cores) não devem mexer em nada de banco.

## Banco de dados (Supabase próprio, não Lovable Cloud)
- Projeto Supabase `yvbbktrufoyhtiotholf` (São Paulo). Estrutura e regras de segurança (RLS) em `supabase/migrations/`.
- Tipos gerados em `src/integrations/frankkia/types.ts` (`npx supabase gen types typescript --linked --schema public > src/integrations/frankkia/types.ts`).
- As regras de negócio acima são garantidas **no banco** (RLS, gatilhos e funções). Não as contorne no app.
  Ranking, estudo de mercado, registrar venda/locação, aceitar convite e liberar upgrade usam funções do banco
  (`ranking_mes`, `estudo_mercado`, `ofertas_mercado`, `registrar_transacao`, `aceitar_convite`, `liberar_upgrade`).
- Login: `src/integrations/frankkia/client.ts` (conexão) e `src/app/session.tsx` (sessão: modo "real" pelo banco ou "demo"
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
- Planos: Solo (R$ 99, 1 corretor dono da conta, sem equipe, limite 0) e Equipe 5/10/30/60 (1 administrador + N corretores;
  o administrador não ocupa vaga). `planos.anuncios` = limite de imóveis publicados no portal (em breve), compartilhado pela
  equipe; o CRM é ilimitado. Solo não faz upgrade de vagas: vira plano de equipe com a Frankkia. Use `ehSolo()` no app.
- Uso do Supabase no painel Frankkia: `uso_supabase()` (banco, arquivos e contas contra os limites do plano gratuito).
- Cadastro único: "Novo imóvel" (CaptacaoFormModal) já tem endereço, CEP, mapa e cômodos; o imóvel (lugar físico) é criado
  por trás ou reaproveitado se o endereço já existe. Cada captação tem `codigo` único global (FK-XXXXXX, `gerar_codigo_imovel`).
- Portal (fase 1): aba "Anúncio" na captação (`anuncios`, `anuncio_fotos`). Fotos vão direto do navegador para o
  Cloudflare R2 por um endereço assinado da função `fotos-r2` (segredos R2_* no Supabase). Publicar só por `publicar_anuncio`
  (confere limite do plano, CRECI, foto e título). Vendido/alugado sai do portal sozinho. Endereço completo e preço sempre visíveis.
- Portal (fase 2): páginas públicas `/imovel/<slug ou código>`, `/corretor/<slug>`, `/imobiliaria/<slug>` são rotas do
  TanStack (`src/routes/imovel.$slug.tsx` etc., código em `src/portal/`), renderizadas no servidor para o Google e a prévia
  do WhatsApp; nelas o `<App />` não é montado. Dados só pelas funções `portal_anuncio`, `portal_corretor`,
  `portal_imobiliaria`; o formulário usa `portal_contato`, que cria o lead (origem "Portal") do corretor do imóvel.
- Busca do portal: `/imoveis` e por cidade `/imoveis/<cidade-uf>` (ex.: `/imoveis/belem-pa`, rota `src/routes/imoveis_.$cidade.tsx`),
  dados de `portal_busca`. Home: seção "Seus imóveis na vitrine" (`src/components/Vitrine.tsx`); "Quem já usa" só com 3+ clientes.
- Termos de Uso e Política de Privacidade: `/termos` e `/privacidade` (`src/pages/Legal.tsx`), com links no rodapé, no
  portal, no formulário de contato, na apresentação e no primeiro acesso.
- CRECI: obrigatório para corretor de equipe (ou estagiário) e sempre para o dono da conta Solo (`checar_creci`, `aceitar_convite`).
- Plano anual: 12 meses pelo preço de 10 (-17%, `src/lib/planos.ts`); `pedidos_upgrade.ciclo` (mensal/anual) e `tipo`
  (upgrade/reducao). O preço vem sempre da tabela `planos` (gatilho `preco_do_pedido`; a função `criar-checkout` cobra por ano no anual).
- Plano menor: `solicitar_reducao` (só se ativos + convites cabem no plano novo) → a Frankkia aplica em Upgrades (`aplicar_reducao`).
- Reativar corretor desativado é só com a Frankkia (`proteger_reativacao`): o administrador usa "Pedir reativação" (`pedir_reativacao`,
  vira chamado) e a Frankkia reativa em Painel → Corretores (`painel_corretores`, `reativar_corretor`).
- Plano Solo no app: use `useScope().solo` (dono da conta no Solo). Solo não tem Equipe nem Academy (menu e rotas), nem a aba
  "Imobiliária" em Configurações (nome e cidade da conta vêm do perfil); textos de "equipe/imobiliária" viram "você/seus".
  No portal, Solo sem logo mostra a foto e o nome do corretor no topo. O topo do portal tem o menu Início/Planos/Imóveis/Sobre.
- Páginas por público: `/para-imobiliarias` e `/para-corretores` (`src/pages/ParaPublico.tsx`, textos em `publicos` de `src/content.ts`),
  com o seletor "Qual é o seu caso?" logo abaixo do topo da home (`src/components/Publicos.tsx`).
- Ferramentas grátis: `/simulador-de-financiamento` e `/calculadora-de-comissao` (`src/pages/Ferramentas.tsx`; contas em
  `src/lib/financiamento.ts`, sem dado externo). O componente `Simulador` também aparece no anúncio do portal (venda) e na
  captação ("Simular financiamento"). Páginas avulsas usam a moldura `src/components/PaginaSimples.tsx`.
- `/exclusao-de-dados` (`src/pages/ExclusaoDados.tsx`): pedido LGPD grava em `interessados` com origem `lgpd` (Painel → Interessados).
- Rodapé: "Pergunte à IA" (`src/components/PergunteIA.tsx`); resumo para IAs em `public/llms.txt` (atualize se mudar preço ou plano).
- Campos de R$: `mascaraMoeda` (ao digitar) e `moeda` (valor inicial) de `src/lib/moeda.ts` (reexportados em `src/app/forms.tsx`) → "1.000.000,00". Botão com
  confirmação "Salvo": `BotaoSalvar` (mesmo arquivo).
- Follow-up de leads: `leads.ultimo_contato` muda ao marcar passo do checklist, mudar etapa/visita/observação, abrir WhatsApp ou
  ligar, ou em "Registrei um contato" (`registrarContato`). Em aberto há mais de 5 dias = "Atrasado" (`atrasado`, `DIAS_ATRASO` em
  `queries.ts`): selo no cartão, filtro "Atrasados" (`?atrasados=1`) e aviso diário no sino.
- Importar leads (Leads → "Importar", `?importar=1`): `src/app/pages/negocios/ImportarLeads.tsx` + `src/lib/planilha.ts`
  (lê .xlsx sem biblioteca, CSV em UTF-8/Windows-1252 e texto colado). Pula telefone inválido, repetido e já cadastrado;
  grava com `importarLeads` em lotes de 200. Até 2.000 linhas por vez.
- Documentos por cliente (lead e proprietário): `src/app/Documentos.tsx` + `src/data/documentos.ts`; tabela `documentos` e
  armazenamento privado `documentos` (`<imobiliária>/<corretor>/<tipo>/<cliente>/`, até 15 MB, PDF/foto/Word/Excel). Quem vê o
  cliente vê os documentos (RLS + `documento_valido`); abre por link temporário. `excluir-imobiliaria` apaga os arquivos da imobiliária.
- Rodízio de leads (só planos de equipe): Equipe → "Rodízio de leads" (`src/app/Rodizio.tsx`, `configurar_rodizio`; colunas
  `imobiliarias.rodizio_*`). No Novo lead e na importação, o corretor "Rodízio" (`RODIZIO` em `negocios/shared.tsx`) usa
  `fila_rodizio` (quem recebeu há mais tempo primeiro). Com prazo, `rodizio_repassar()` (pg_cron a cada 5 min) passa o lead sem
  primeiro contato para o próximo e, depois de todos, devolve ao administrador (`leads.passou_por`, `voltou_ao_admin`). Esse
  repasse é a única exceção do `proteger_dono` (flag `frankkia.repasse`). Leads do portal não entram no rodízio.
- Portais ZAP/VivaReal/OLX (beta): o administrador copia o link em Configurações → Portais (`src/app/Portais.tsx`, `link_portais`,
  tabela `feeds_portais`) e cola no Canal Pro da imobiliária. A função `feed-portais?t=<código>` gera o XML VRSync
  (`supabase/functions/_shared/vrsync.ts`, regras e mapeamentos; o app usa o mesmo arquivo para mostrar o que falta). Cada anúncio
  liga `anuncios.portais` e o destaque; só entram captações ativas com 5+ fotos JPG (`anuncio_fotos.url_jpg`, gerada no envio da foto),
  título 10–100, descrição 50–3.000, CEP. Não testado com conta real do Canal Pro.
- Visão geral: "Primeiros passos" (`src/app/PrimeirosPassos.tsx`) e sino de avisos (`src/app/Notificacoes.tsx`), calculados dos dados.
- Página de captura dos anúncios: `/conheca-a-frankkia` (`src/pages/Captura.tsx`), tudo leva ao WhatsApp de `contato` em
  `src/content.ts` (`?utm_source=instagram|youtube` entra na mensagem). Página `/sobre` (`src/pages/Sobre.tsx`, dados em `criador`;
  foto em `public/luiz-horizonte.jpg`, sem ela mostra as iniciais).
- Estudo de mercado (no estilo do BrokerApp): aba "Estudos" (lista + funil, `src/app/pages/estudos/`), "Novo estudo" em
  `/app/mercado/estudos/novo` (tipo, CEP+mapa, todos os dados do imóvel, proprietário, título; atalho a partir de uma captação) e
  a página `/app/mercado/estudos/:id` (acompanhamento, Improvável/Valor de mercado/Urgência com ajustes, amostras por link de
  portal, radar Frankkia ou manual). Dados em `src/data/avaliacoes.ts` (tabelas `avaliacoes` e `avaliacao_amostras`). O link é lido
  pela função `ler-anuncio`; os portais bloqueiam o servidor (403), então vale o que o próprio link informa. Aba "Panorama da imobiliária" = antigo painel.
  Fase B: apresentação pública `/estudo/<token>` (rota TanStack `src/routes/estudo.$token.tsx`, `src/portal/PaginaEstudo.tsx`, dados de
  `estudo_publico`, só com `link_liberado`), envio por WhatsApp/e-mail (função `enviar-estudo`), "Imóveis vendidos na região"
  (`vendidos_regiao`: vendas da imobiliária + `vendas_externas`, sem cliente/comissão; nome do corretor só com
  `imobiliarias.mostrar_corretor_vendidos`, chave em Configurações) e "Criar captação com estes dados" (abre o Novo imóvel preenchido).
  Fase C: lembretes e comentários (`avaliacao_notas`; com data viram compromisso na Agenda), histórico do valor pedido
  (`avaliacao_precos`, gravado por gatilho) e ajuste por características (`src/lib/estudo-calculo.ts`, usado pelo app e pela
  apresentação; liga/desliga em `avaliacoes.usar_variaveis`).
- Google Agenda: função `google-agenda` (OAuth com volta por `/google-agenda/retorno`, fila `google_sync_fila` a cada minuto e
  conferência de volta a cada 5 min só dos eventos criados pela Frankkia). Excluir imobiliária passa por `excluir-imobiliaria`
  (também cancela a assinatura na Stripe). E-mails automáticos: fila `avisos_email` + função `enviar-avisos`.
- Páginas públicas: o servidor entrega o texto principal e os links (`src/components/ConteudoServidor.tsx`) e cada uma tem
  título/descrição em `src/routes/<pagina>.tsx` (component null; quem desenha é o `<App />`).
- Interessados: `/apresentacao` e o formulário do site gravam em `interessados` (visitante só envia; só a Frankkia lê).
- Demonstração: NÃO é pública. Só abre por `/demo/<código>` liberado pela Frankkia (`acessos_demo`, com validade;
  `validar_demo`). Não recoloque botões de demonstração na tela de login.
- Tokens de serviços externos guardados no banco (ex.: `google_conexoes.refresh_token`) vão criptografados com AES-256-GCM
  por `supabase/functions/_shared/cofre.ts` (`cifrar`/`decifrar`, chave no segredo `TOKENS_CHAVE`). Nunca grave token sem cifrar.
- Nunca coloque a chave secreta (service_role) no app ou no repositório; só a chave publicável vai no `.env`.

## Próxima fase
Login real e papéis; trocar `demo.ts`/`platform.ts` pelas tabelas; transformar as ações de `store.tsx`
em gravações; Stripe e Google Agenda conforme `PENDENTES.md`.
