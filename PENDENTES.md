# Pendências da Frankkia

## E-mails do login (convites, confirmação, nova senha)

**Feito:** login real, convite por link, primeiro acesso, "Esqueceu a senha?".
**Falta:**
- Configurar um serviço de e-mail próprio no Supabase (ex.: Resend — Authentication → Emails → SMTP).
  O e-mail padrão do Supabase é só para testes: poucos envios por hora e apenas para e-mails da equipe do projeto.
- Envio automático do convite por e-mail (hoje o administrador copia o link e envia por WhatsApp/e-mail).
- Textos dos e-mails em português (Authentication → Emails → Templates).

## Upgrade de plano com Stripe

**Feito (demonstração):** escolher plano → tela de pagamento simulada (cartão/PIX/boleto) → status para o administrador → "Pedidos de upgrade" no painel Frankkia → botão "Liberar plano" (vagas extras na hora).

**No Lovable (Stripe real):**
- Conectar a Stripe pelo Lovable e criar os 3 planos como produtos/preços de assinatura.
- "Ir para pagamento" cria uma sessão do Stripe Checkout (página segura da Stripe; a Frankkia nunca vê o cartão).
- Webhook da Stripe (`checkout.session.completed` / pagamentos de boleto) atualiza o status do pedido sozinho.
- Decidir: liberar manualmente (como hoje) ou automaticamente ao confirmar o pagamento.
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
