import { createFileRoute } from "@tanstack/react-router";
import { buscarTodos } from "@/portal/api";
import { ImoveisComFiltro } from "@/portal/Filtros";
import { CidadesComImoveis, PortalShell } from "@/portal/ui";

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
    <PortalShell rotulo="Imóveis">
      {/* Título da página fica só para o Google (o visitante vai direto à busca) */}
      <h1 className="sr-only">Imóveis à venda e para alugar</h1>
      {anuncios.length ? (
        <>
          <ImoveisComFiltro anuncios={anuncios} busca />
          <CidadesComImoveis anuncios={anuncios} />
        </>
      ) : (
        <div className="rounded-3xl bg-canvas p-10 text-center">
          <p className="font-semibold">Ainda não há imóveis anunciados</p>
          <p className="mt-1 text-sm text-muted">Volte em breve.</p>
        </div>
      )}
    </PortalShell>
  );
}
