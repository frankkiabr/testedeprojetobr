# Pendências da Frankkia

## Revisão de segurança

**Falta:** fazer a revisão de segurança (/security-review) junto com o Claude — combinado para depois (semana de 26/10/2026).

## Termos de Uso e Política de Privacidade

**Falta:** completar a razão social, o CNPJ e o endereço da empresa em `src/pages/Legal.tsx` (páginas `/termos` e `/privacidade`)
e pedir a revisão de um advogado antes de divulgar em larga escala.

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
- Passar para o modo real (chaves sk_live) quando a conta Stripe estiver ativada.
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
