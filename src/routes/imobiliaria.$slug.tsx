import { createFileRoute } from "@tanstack/react-router";
import { buscarImobiliaria } from "@/portal/api";
import { PaginaImobiliaria } from "@/portal/PaginaPerfil";
import { NaoEncontrado } from "@/portal/ui";

/** Página pública da imobiliária (portal). */
export const Route = createFileRoute("/imobiliaria/$slug")({
  loader: ({ params }) => buscarImobiliaria(params.slug).catch(() => null),
  head: ({ loaderData: i }) => {
    if (!i)
      return { meta: [{ title: "Página indisponível" }, { name: "robots", content: "noindex" }] };
    const titulo = `${i.nome} · Imóveis`;
    const descricao = `${i.anuncios.length} imóveis à venda e para alugar com ${i.nome}${i.cidade ? `, ${i.cidade}` : ""}.`;
    const imagem = i.logo ?? i.anuncios[0]?.capa;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        ...(imagem ? [{ property: "og:image", content: imagem }] : []),
      ],
    };
  },
  component: () => {
    const i = Route.useLoaderData();
    return i ? (
      <PaginaImobiliaria i={i} />
    ) : (
      <NaoEncontrado texto="Esta imobiliária não tem imóveis anunciados no momento." />
    );
  },
});
