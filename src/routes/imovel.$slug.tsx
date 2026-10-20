import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { buscarAnuncio } from "@/portal/api";
import PaginaAnuncio, { enderecoAnuncio } from "@/portal/PaginaAnuncio";
import { NaoEncontrado, preco } from "@/portal/ui";

/** Página pública do anúncio (portal). Vem pronta do servidor, para o Google e a prévia do WhatsApp. */
export const Route = createFileRoute("/imovel/$slug")({
  loader: ({ params }) => buscarAnuncio(params.slug).catch(() => null),
  head: ({ loaderData: a }) => {
    if (!a) return { meta: [{ title: "Imóvel indisponível" }, { name: "robots", content: "noindex" }] };
    const titulo = `${a.titulo} · ${preco(a.finalidade, a.valor)}`;
    const descricao = `${a.categoria} ${a.finalidade === "venda" ? "à venda" : "para alugar"} em ${a.bairro}, ${a.cidade} - ${a.uf}. ${enderecoAnuncio(a)}. Cód. ${a.codigo}.`;
    const capa = a.fotos[0]?.url;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        ...(capa ? [{ property: "og:image", content: capa }] : []),
      ],
    };
  },
  component: Pagina,
});

function Pagina() {
  const a = Route.useLoaderData();
  const [url, setUrl] = useState("");
  useEffect(() => setUrl(window.location.href), []);
  if (!a) return <NaoEncontrado texto="Este imóvel foi retirado do portal, já foi negociado ou o endereço está incorreto." />;
  return <PaginaAnuncio a={a} url={url} />;
}
