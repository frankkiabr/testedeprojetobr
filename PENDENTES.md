# Pendências da Frankkia

## Integrações

**Falta:**
- Google Agenda: a conexão real (Frankkia → Google) foi feita em 28/10/2026; falta testar, pedir a verificação do app ao Google
  (sem ela: só usuários de teste e reconexão a cada 7 dias) e, numa fase 2, trazer de volta as mudanças feitas no Google.
- Zap/OLX/VivaReal: feito em 28/10/2026 o "colar link do anúncio" nas Avaliações (como o BrokerApp). Falta, se quiser: feed para o
  Canal Pro (enviar os anúncios) e dados prontos de mercado (DataZAP+ é pago, sob consulta; FipeZAP é público).

## Revisão de segurança

**Falta:** fazer a revisão de segurança (/security-review) junto com o Claude — combinado para depois (semana de 26/10/2026).

## Termos de Uso, Política de Privacidade e lançamento (revisão legal de 27/10/2026)

**Feito:** cancelar assinatura pelo app, cartão e faturas (portal da Stripe), renovação recusada e assinatura encerrada no webhook;
textos do plano anual, renovação automática, prazo do teste (7 dias), arrependimento de 7 dias, link dos Termos no
pagamento, transferência internacional, cláusula de operador, prazos de guarda, encarregado e campo CRECI-J (Configurações).
**Falta (depende do dono):**
- Abrir o CNPJ (provável ME no Simples; confirmar com contador) e pôr nome/razão social, CPF ou CNPJ e endereço no rodapé e nos Termos.
- Revisão de um advogado (inclusive a regra de reembolso).
- Teste com uma compra real na Stripe (o teste com o cartão 4242 foi no modo de teste) — opcional.
- Depois do CNPJ: guardar os registros de acesso por 6 meses (Marco Civil, art. 15).

## Cadastro pelo site (/cadastro)

**Feito:** a pessoa cria a conta sozinha e entra em teste grátis (`criar_conta_teste`, ajustes em `config_cadastro`).
**Falta:** concluir a verificação do domínio frankkia.com no Resend (adicionado em 27/10/2026; faltam os registros DNS) e usá-lo como SMTP do Supabase (sem isso o e-mail de confirmação só chega
para a equipe do projeto).

## E-mails do login (convites, confirmação, nova senha)

**Feito:** login real, convite por link, primeiro acesso, "Esqueceu a senha?".
Função `enviar-convite` (Resend) publicada: envia o convite sozinho quando os segredos `RESEND_API_KEY` e
`EMAIL_REMETENTE` estiverem no Supabase (Edge Functions → Secrets). Sem eles, o app mostra o link para copiar.
**Falta:**
- Um domínio próprio verificado no Resend (sem ele, o Resend só entrega para o e-mail do dono da conta).
- Configurar um serviço de e-mail próprio no Supabase (ex.: Resend — Authentication → Emails → SMTP).
  O e-mail padrão do Supabase é só para testes: poucos envios por hora e apenas para e-mails da equipe do projeto.
- Envio automático do convite por e-mail (hoje o administrador copia o link e envia por WhatsApp/e-mail).
- Textos dos e-mails em português (Authentication → Emails → Templates).

## Upgrade de plano com Stripe

**Feito:** escolher plano (ou contratar ao fim do teste grátis) → pedido gravado no banco → no painel Frankkia,
"Confirmar pagamento" (à mão, para PIX/transferência) → "Liberar plano" (vagas extras na hora).

**Feito (Stripe, modo de teste):** funções `criar-checkout` (abre a página da Stripe, assinatura mensal em reais)
e `stripe-webhook` (pagamento aprovado → "Pagamento confirmado" no painel). Segredos no Supabase:
`STRIPE_SECRET_KEY` (sk_test_...) e `STRIPE_WEBHOOK_SECRET` (whsec_...). Webhook na Stripe apontando para
`https://yvbbktrufoyhtiotholf.supabase.co/functions/v1/stripe-webhook`.

**Ideias para depois:**
- Feito em 27/10/2026: modo real (chave restrita rk_live, webhook com eventos de checkout, fatura e assinatura, portal do cliente).
- Decidir: liberar manualmente (como hoje) ou automaticamente ao confirmar o pagamento.
- PIX/boleto para assinaturas e trocar de plano direto na assinatura da Stripe.
- Cobrança proporcional (proration) da diferença no mês do upgrade, se desejado.

## Agenda

**Fase A — feita (demonstração):**
- Aba "Agenda" para corretor, administrador (própria + equipe) e painel Frankkia.
- Visões dia, semana e mês; criar clicando num horário vazio; arrastar para mover.
- Tipos: visita, captação, reunião, ligação e outro; vínculo com leads e captações.
- Visita ligada a um lead fica sincronizada com a data de visita do lead (nos dois sentidos).
- "Adicionar ao Google Agenda" em cada compromisso (funciona de verdade, mão única).
- "Conectar Google Agenda" simulado (mostra como ficará).

**Fase B — no Lovable (Lovable Cloud):**
- OAuth 2.0 com Google (projeto no Google Cloud, tela de consentimento, escopo de agenda).
- Tokens guardados no servidor (Lovable Cloud), sincronização nos dois sentidos.
- Verificação do app pelo Google antes de liberar para todos (até 100 usuários de teste sem verificação).
- Custo: API do Google gratuita; nenhum token de IA no uso diário.
- Observação: Firecrawl não serve para agenda/notificações (é ferramenta de leitura de sites).
