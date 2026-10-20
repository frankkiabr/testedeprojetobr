import { createFileRoute } from "@tanstack/react-router";
import { buscarTodos } from "@/portal/api";
import { Surge } from "@/portal/anim";
import { ImoveisComFiltro } from "@/portal/Filtros";
import { PortalShell } from "@/portal/ui";

const TITULO = "Imóveis à venda e para alugar · Frankkia";
const DESCRICAO =
  "Encontre casas, apartamentos, salas e terrenos anunciados por imobiliárias e corretores credenciados.";

/** Busca geral do portal: todos os imóveis publicados, com filtros. Vem pronta do servidor (Google). */
export const Route = createFileRoute("/imoveis")({
  loader: () => buscarTodos().catch(() => []),
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  const anuncios = Route.useLoaderData() ?? [];
  return (
    <PortalShell>
      <Surge y={16} className="mb-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Encontre seu imóvel
        </h1>
        <p className="mt-2 text-muted">
          Imóveis anunciados por imobiliárias e corretores credenciados.
        </p>
      </Surge>
      {anuncios.length ? (
        <ImoveisComFiltro anuncios={anuncios} busca />
      ) : (
        <div className="rounded-3xl bg-canvas p-10 text-center">
          <p className="font-semibold">Ainda não há imóveis anunciados</p>
          <p className="mt-1 text-sm text-muted">Volte em breve.</p>
        </div>
      )}
    </PortalShell>
  );
}
