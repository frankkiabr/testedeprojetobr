import { createFileRoute, Link } from "@tanstack/react-router";
import { buscarTodos } from "@/portal/api";
import { ImoveisComFiltro } from "@/portal/Filtros";
import { CidadesComImoveis, NaoEncontrado, PortalShell, slugCidade } from "@/portal/ui";

/**
 * Imóveis de uma cidade (ex.: /imoveis/belem-pa). Mesma busca de /imoveis, já filtrada pela cidade.
 * Vem pronta do servidor: é a página que o Google mostra para "imóveis em Belém".
 */
export const Route = createFileRoute("/imoveis_/$cidade")({
  loader: async ({ params }) => {
    const todos = (await buscarTodos().catch(() => null)) ?? [];
    const daCidade = todos.filter((a) => slugCidade(a.cidade, a.uf) === params.cidade);
    if (!daCidade.length) return null;
    return { todos, cidade: daCidade[0].cidade, uf: daCidade[0].uf, total: daCidade.length };
  },
  head: ({ loaderData: d }) => {
    if (!d)
      return { meta: [{ title: "Imóveis · Frankkia" }, { name: "robots", content: "noindex" }] };
    const titulo = `Imóveis em ${d.cidade} - ${d.uf} à venda e para alugar · Frankkia`;
    const descricao = `${d.total} ${d.total === 1 ? "imóvel" : "imóveis"} em ${d.cidade} - ${d.uf}: casas, apartamentos, salas e terrenos anunciados por imobiliárias e corretores credenciados.`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descricao },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descricao },
      ],
    };
  },
  component: Pagina,
});

function Pagina() {
  const d = Route.useLoaderData();
  if (!d)
    return (
      <NaoEncontrado texto="Ainda não há imóveis anunciados nesta cidade.">
        <Link to="/imoveis" className="mt-3 block text-sm font-semibold text-accent">
          Ver todos os imóveis
        </Link>
      </NaoEncontrado>
    );
  return (
    <PortalShell rotulo="Imóveis">
      <h1 className="sr-only">
        Imóveis em {d.cidade} - {d.uf}
      </h1>
      <ImoveisComFiltro
        key={`${d.cidade}-${d.uf}`}
        anuncios={d.todos}
        busca
        inicial={{ uf: d.uf, cidade: d.cidade }}
      />
      <CidadesComImoveis anuncios={d.todos} />
    </PortalShell>
  );
}
