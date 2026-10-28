import { createFileRoute } from "@tanstack/react-router";
import { buscarEstudo } from "@/portal/api";
import PaginaEstudo, { valoresDoEstudo } from "@/portal/PaginaEstudo";
import { NaoEncontrado } from "@/portal/ui";

/** Apresentação do estudo de mercado para o proprietário. Vem pronta do servidor (prévia bonita no WhatsApp). */
export const Route = createFileRoute("/estudo/$token")({
  loader: ({ params }) => buscarEstudo(params.token).catch(() => null),
  head: ({ loaderData: e }) => {
    if (!e) return { meta: [{ title: "Estudo indisponível" }, { name: "robots", content: "noindex" }] };
    const r = valoresDoEstudo(e);
    const titulo = `Estudo de mercado · ${e.categoria}${e.bairro ? ` em ${e.bairro}` : ""}`;
    const descricao =
      r && e.mostrar_mercado
        ? `Valor de mercado estimado: ${r.mercado.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}. Preparado por ${e.corretor.nome}.`
        : `Estudo preparado por ${e.corretor.nome}${e.imobiliaria.solo ? "" : `, ${e.imobiliaria.nome}`}.`;
    const capa = e.amostras.find((s) => s.foto)?.foto;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        ...(capa ? [{ property: "og:image", content: capa }] : []),
      ],
    };
  },
  component: Pagina,
});

function Pagina() {
  const e = Route.useLoaderData();
  if (!e) return <NaoEncontrado texto="Este estudo não está disponível. Peça um novo link ao corretor." />;
  return <PaginaEstudo e={e} />;
}
