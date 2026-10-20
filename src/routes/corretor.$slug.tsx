import { createFileRoute } from "@tanstack/react-router";
import { buscarCorretor } from "@/portal/api";
import { PaginaCorretor } from "@/portal/PaginaPerfil";
import { creciTexto, NaoEncontrado } from "@/portal/ui";

/** Página pública do corretor (portal). */
export const Route = createFileRoute("/corretor/$slug")({
  loader: ({ params }) => buscarCorretor(params.slug).catch(() => null),
  head: ({ loaderData: c }) => {
    if (!c)
      return { meta: [{ title: "Página indisponível" }, { name: "robots", content: "noindex" }] };
    const titulo = `${c.nome} · Corretor de imóveis`;
    const descricao = `Imóveis anunciados por ${c.nome}${c.creci ? ` (${creciTexto(c)})` : ""}${c.imobiliaria.solo ? "" : ` · ${c.imobiliaria.nome}`}.`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
        ...((c.foto ?? c.anuncios[0]?.capa)
          ? [{ property: "og:image", content: (c.foto ?? c.anuncios[0]?.capa)! }]
          : []),
      ],
    };
  },
  component: () => {
    const c = Route.useLoaderData();
    return c ? (
      <PaginaCorretor c={c} />
    ) : (
      <NaoEncontrado texto="Este corretor não tem imóveis anunciados no momento." />
    );
  },
});
