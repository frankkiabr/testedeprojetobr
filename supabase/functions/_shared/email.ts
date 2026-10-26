// Layout dos e-mails da Frankkia (mesmas cores e fontes do site).
// Os e-mails do login (confirmação, nova senha, troca de e-mail) usam este mesmo layout em
// supabase/templates/*.html, colados no painel do Supabase (Authentication → Emails → Templates).

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const FONTE = "'Inter',Arial,Helvetica,sans-serif";
const TITULO = "'Space Grotesk','Inter',Arial,Helvetica,sans-serif";

/**
 * Monta um e-mail da Frankkia.
 * `texto` e `nota` já devem vir escapados (podem ter <strong> e <br>); `link` vai no botão e no endereço de reserva.
 */
export function emailFrankkia(o: {
  previa: string;
  etiqueta: string;
  titulo: string;
  texto: string;
  botao?: { rotulo: string; link: string };
  nota?: string;
}) {
  const botao = o.botao
    ? `<tr><td style="padding:28px 0 8px">
        <a href="${o.botao.link}" style="display:inline-block;background:#2f5bea;color:#ffffff;text-decoration:none;font-family:${FONTE};font-size:15px;font-weight:600;line-height:20px;padding:14px 28px;border-radius:999px">${o.botao.rotulo} &rarr;</a>
      </td></tr>
      <tr><td style="padding:16px 0 0;font-family:${FONTE};font-size:12px;line-height:18px;color:#98a2b3">
        Se o botão não abrir, copie e cole este endereço no navegador:<br>
        <a href="${o.botao.link}" style="color:#5f6b80;word-break:break-all">${o.botao.link}</a>
      </td></tr>`
    : "";
  const nota = o.nota
    ? `<tr><td style="padding:24px 0 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#f3f5f9;border-radius:16px;padding:14px 16px;font-family:${FONTE};font-size:13px;line-height:20px;color:#5f6b80">${o.nota}</td>
      </tr></table></td></tr>`
    : "";
  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${o.titulo}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Space+Grotesk:wght@600&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f3f5f9">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${o.previa}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9">
<tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
    <tr><td style="background:#0f1a33;background-image:linear-gradient(135deg,#0f1a33 55%,#2f5bea 140%);border-radius:24px 24px 0 0;padding:28px 32px">
      <span style="font-family:${TITULO};font-size:26px;font-weight:600;letter-spacing:-0.5px;color:#ffffff">frankkia</span>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e8ebf1;border-top:0;border-radius:0 0 24px 24px;padding:32px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-family:${FONTE};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;color:#2f5bea">${o.etiqueta}</td></tr>
        <tr><td style="padding:10px 0 0;font-family:${TITULO};font-size:26px;font-weight:600;line-height:32px;letter-spacing:-0.4px;color:#0f1a33">${o.titulo}</td></tr>
        <tr><td style="padding:14px 0 0;font-family:${FONTE};font-size:15px;line-height:24px;color:#5f6b80">${o.texto}</td></tr>
        ${botao}
        ${nota}
      </table>
    </td></tr>
    <tr><td align="center" style="padding:24px 16px 0;font-family:${FONTE};font-size:12px;line-height:18px;color:#98a2b3">
      <strong style="color:#5f6b80">Frankkia</strong> · Seu universo imobiliário, em um só lugar.<br>
      <a href="https://frankkia.com" style="color:#98a2b3">frankkia.com</a> · <a href="mailto:frankkiabr@gmail.com" style="color:#98a2b3">frankkiabr@gmail.com</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
