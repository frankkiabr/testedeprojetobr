// Envia os e-mails automáticos da fila avisos_email (boas-vindas, teste acabando/terminou, pagamento,
// renovação recusada, assinatura cancelada). Chamada pelo banco a cada 5 minutos (pg_cron).
// Não recebe dados nem devolve nada sensível: só manda o que já está na fila.
import { admin, json } from "../_shared/comum.ts";
import { emailFrankkia, esc } from "../_shared/email.ts";

const SITE = "https://frankkia.com";
const WHATSAPP = "(91) 98095-9265";
const forte = (s: string) => `<strong style="color:#0f1a33">${esc(s)}</strong>`;
const dia = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Belem", day: "2-digit", month: "2-digit" }) : "");

type Dados = { nome?: string; imobiliaria?: string; teste_ate?: string; plano?: string; limite?: number; ciclo?: string; cancela_em?: string };

function montar(tipo: string, d: Dados): { assunto: string; html: string } | null {
  const imob = d.imobiliaria ?? "sua imobiliária";
  const ola = d.nome ? `, ${esc(d.nome)}` : "";
  switch (tipo) {
    case "boas_vindas":
      return {
        assunto: "Bem-vindo(a) à Frankkia",
        html: emailFrankkia({
          previa: "Seu teste grátis começou. Veja por onde começar.",
          etiqueta: "Boas-vindas",
          titulo: `Seu teste grátis começou${ola}!`,
          texto: `A conta da ${forte(imob)} está pronta e você pode usar tudo até ${forte(dia(d.teste_ate))}. Para aproveitar o teste:<br><br>1. Cadastre seu primeiro imóvel e publique no portal<br>2. Lance seus leads no funil<br>3. Convide sua equipe`,
          botao: { rotulo: "Entrar na Frankkia", link: `${SITE}/login` },
          nota: `Quer ajuda para configurar? Chame o Luiz no WhatsApp ${WHATSAPP}.`,
        }),
      };
    case "teste_acabando":
      return {
        assunto: "Seu teste na Frankkia está acabando",
        html: emailFrankkia({
          previa: "Contrate um plano para não perder o acesso.",
          etiqueta: "Teste grátis",
          titulo: "Seu teste está acabando",
          texto: `O teste grátis da ${forte(imob)} termina em ${forte(dia(d.teste_ate))}. Para continuar usando sem interrupção, contrate um plano: tudo o que vocês cadastraram continua lá.`,
          botao: { rotulo: "Ver os planos", link: `${SITE}/app/configuracoes?aba=plano` },
          nota: "Plano anual: 12 meses pelo preço de 10.",
        }),
      };
    case "teste_terminou":
      return {
        assunto: "Seu teste na Frankkia terminou",
        html: emailFrankkia({
          previa: "Seus dados continuam guardados.",
          etiqueta: "Teste grátis",
          titulo: "Seu teste grátis terminou",
          texto: `O acesso da ${forte(imob)} está pausado, mas nada foi apagado: leads, imóveis e negócios continuam guardados. Contrate um plano e o acesso volta na hora.`,
          botao: { rotulo: "Contratar um plano", link: `${SITE}/login` },
          nota: `Ficou com alguma dúvida? Chame o Luiz no WhatsApp ${WHATSAPP}.`,
        }),
      };
    case "pagamento_confirmado": {
      const plano = d.plano ?? "seu plano";
      const vagas = plano === "Solo" ? "para você usar sozinho(a)" : d.limite ? `com vagas para até ${d.limite} corretores` : "";
      return {
        assunto: `Pagamento confirmado: plano ${plano} liberado`,
        html: emailFrankkia({
          previa: "Seu plano já está liberado.",
          etiqueta: "Pagamento",
          titulo: `Plano ${esc(plano)} liberado`,
          texto: `Recebemos o pagamento da ${forte(imob)}. O plano ${esc(plano)}${d.ciclo === "anual" ? " (anual)" : ""} já está ativo${vagas ? `, ${vagas}` : ""}.`,
          botao: { rotulo: "Entrar na Frankkia", link: `${SITE}/login` },
          nota: "O recibo do pagamento chega em outro e-mail, enviado pela Stripe.",
        }),
      };
    }
    case "renovacao_recusada":
      return {
        assunto: "Não conseguimos renovar sua assinatura",
        html: emailFrankkia({
          previa: "Atualize o cartão para não perder o acesso.",
          etiqueta: "Pagamento",
          titulo: "Não conseguimos renovar sua assinatura",
          texto: `O cartão recusou a cobrança da renovação da ${forte(imob)}. O acesso continua por enquanto e a Stripe vai tentar de novo nos próximos dias. Para resolver agora, atualize o cartão.`,
          botao: { rotulo: "Atualizar cartão", link: `${SITE}/app/configuracoes?aba=plano` },
        }),
      };
    case "assinatura_cancelada":
      return {
        assunto: "Sua assinatura foi cancelada",
        html: emailFrankkia({
          previa: "O acesso continua até o fim do período pago.",
          etiqueta: "Assinatura",
          titulo: "Assinatura cancelada",
          texto: `A assinatura da ${forte(imob)} foi cancelada.${d.cancela_em ? ` O acesso continua até ${forte(dia(d.cancela_em))}` : " O acesso continua até o fim do período já pago"} e não haverá nova cobrança.`,
          botao: { rotulo: "Manter minha assinatura", link: `${SITE}/app/configuracoes?aba=plano` },
          nota: "Cancelou nos primeiros 7 dias? Você tem direito a reembolso integral: escreva para frankkiabr@gmail.com.",
        }),
      };
  }
  return null;
}

Deno.serve(async () => {
  const chave = Deno.env.get("RESEND_API_KEY");
  const remetente = Deno.env.get("EMAIL_REMETENTE");
  if (!chave || !remetente) return json({ erro: "EMAIL_NAO_CONFIGURADO" }, 503);

  const db = admin();
  const { data: fila } = await db
    .from("avisos_email")
    .select("id, tipo, para, dados, tentativas")
    .is("enviado_em", null)
    .lt("tentativas", 5)
    .order("criado_em")
    .limit(30);

  let enviados = 0;
  for (const a of fila ?? []) {
    const email = montar(a.tipo, (a.dados ?? {}) as Dados);
    if (!email) continue;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: remetente, to: [a.para], subject: email.assunto, html: email.html }),
    });
    if (r.ok) {
      enviados++;
      await db.from("avisos_email").update({ enviado_em: new Date().toISOString(), erro: null }).eq("id", a.id);
    } else {
      const erro = `${r.status} ${(await r.text()).slice(0, 300)}`;
      console.error("Resend", erro);
      await db.from("avisos_email").update({ tentativas: a.tentativas + 1, erro }).eq("id", a.id);
    }
  }
  return json({ enviados });
});
