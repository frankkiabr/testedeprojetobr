// Arquivo XML dos portais (ZAP Imóveis, VivaReal e OLX) de uma imobiliária, lido pelo Canal Pro.
// GET ?t=<código secreto do link> → XML no padrão VRSync com os imóveis ativos marcados para os portais.
// O código vem de Configurações → Portais (função link_portais); trocar o código desativa o link antigo.
import { admin } from "../_shared/comum.ts";
import { gerarVRSync, type DadosFeed } from "../_shared/vrsync.ts";

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  if (!/^[0-9a-f]{32}$/.test(token)) return new Response("Link inválido", { status: 404 });
  try {
    const { data, error } = await admin().rpc("feed_portais", { p_token: token });
    if (error) throw error;
    if (!data) return new Response("Link inválido ou desativado", { status: 404 });
    const { xml, enviados, fora } = gerarVRSync(data as DadosFeed);
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
        "X-Imoveis-Enviados": String(enviados),
        "X-Imoveis-Pendentes": String(fora),
      },
    });
  } catch (e) {
    console.error(e);
    return new Response("Falha ao gerar o arquivo", { status: 500 });
  }
});
