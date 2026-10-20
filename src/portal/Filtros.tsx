import { useMemo, useState } from "react";
import { Check, Search, Share2 } from "lucide-react";
import type { CartaoAnuncio } from "./api";
import { GradeImoveis } from "./ui";

type Ordem = "recentes" | "menor" | "maior";
type Filtro = {
  texto: string;
  tipo: string;
  ordem: Ordem;
  uf: string;
  cidade: string;
  bairro: string;
  finalidade: "" | "venda" | "locacao";
  quartos: number;
  banheiros: number;
  min: string;
  max: string;
};
const VAZIO: Filtro = {
  texto: "",
  tipo: "",
  ordem: "recentes",
  uf: "",
  cidade: "",
  bairro: "",
  finalidade: "",
  quartos: 0,
  banheiros: 0,
  min: "",
  max: "",
};

const ESTADOS: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const numero = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const mascara = (s: string) => {
  const n = numero(s);
  return n ? n.toLocaleString("pt-BR") : "";
};
const unicos = (l: string[]) =>
  [...new Set(l.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

const caixa =
  "h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none transition focus:border-accent";

function Escolha({
  rotulo,
  valor,
  onChange,
  opcoes,
  todos,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  opcoes: { valor: string; texto: string }[];
  todos: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{rotulo}</span>
      <select
        className={`${caixa} cursor-pointer`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{todos}</option>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.texto}
          </option>
        ))}
      </select>
    </label>
  );
}

function Opcoes({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-10 min-w-9 rounded-xl border px-1.5 text-sm font-medium transition ${n === 0 ? "flex-[1.8]" : "flex-1"} ${
            valor === n ? "border-ink bg-ink text-bg" : "border-line bg-bg hover:border-line-strong"
          }`}
        >
          {n === 0 ? "Todos" : `${n}+`}
        </button>
      ))}
    </div>
  );
}

/** Sem acento e minúsculo, para a busca por texto achar "Umarizal" com "umarizal". */
const simples = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/**
 * Lista de imóveis com filtros sempre à mostra. Estado, cidade e bairro só oferecem o que existe
 * nos imóveis anunciados (e um depende do outro), para o cliente escolher em vez de digitar.
 */
export function ImoveisComFiltro({
  anuncios,
  busca = false,
  inicial,
}: {
  anuncios: CartaoAnuncio[];
  /** Filtro já escolhido ao abrir (ex.: páginas por cidade). */
  inicial?: { uf?: string; cidade?: string; bairro?: string };
  busca?: boolean;
}) {
  const [f, setF] = useState<Filtro>({ ...VAZIO, ...inicial });
  const temVendaEAluguel = new Set(anuncios.map((a) => a.finalidade)).size > 1;
  const ativos = JSON.stringify({ ...f, ordem: "" }) !== JSON.stringify({ ...VAZIO, ordem: "" });

  const estados = unicos(anuncios.map((a) => a.uf));
  const tipos = unicos(anuncios.map((a) => a.categoria));
  const cidades = unicos(anuncios.filter((a) => !f.uf || a.uf === f.uf).map((a) => a.cidade));
  const bairros = unicos(
    anuncios
      .filter((a) => (!f.uf || a.uf === f.uf) && (!f.cidade || a.cidade === f.cidade))
      .map((a) => a.bairro),
  );

  const lista = useMemo(
    () =>
      anuncios
        .filter(
          (a) =>
            (!f.texto.trim() ||
              simples(
                `${a.codigo} ${a.titulo} ${a.bairro} ${a.cidade} ${a.categoria} ${a.anunciante ?? ""}`,
              ).includes(simples(f.texto.trim()))) &&
            (!f.tipo || a.categoria === f.tipo) &&
            (!f.uf || a.uf === f.uf) &&
            (!f.cidade || a.cidade === f.cidade) &&
            (!f.bairro || a.bairro === f.bairro) &&
            (!f.finalidade || a.finalidade === f.finalidade) &&
            (!f.quartos || (a.quartos ?? 0) >= f.quartos) &&
            (!f.banheiros || (a.banheiros ?? 0) >= f.banheiros) &&
            (!numero(f.min) || a.valor >= numero(f.min)) &&
            (!numero(f.max) || a.valor <= numero(f.max)),
        )
        .sort((a, b) =>
          f.ordem === "menor"
            ? a.valor - b.valor
            : f.ordem === "maior"
              ? b.valor - a.valor
              : (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""),
        ),
    [anuncios, f],
  );

  return (
    <div>
      <div className="mb-6 space-y-4 rounded-3xl border border-line p-5">
        {/* 1ª linha: busca (só na busca geral) e onde fica; 2ª linha: como é e quanto custa */}
        <div
          className={`grid gap-3 sm:grid-cols-3 ${busca ? "lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]" : ""}`}
        >
          {busca && (
            <label className="block min-w-0 sm:col-span-3 lg:col-span-1">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Buscar</span>
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  className={`${caixa} pl-10`}
                  placeholder="Código (FK-...), bairro, cidade ou imobiliária"
                  value={f.texto}
                  onChange={(e) => setF({ ...f, texto: e.target.value })}
                />
              </span>
            </label>
          )}
          <Escolha
            rotulo="Estado"
            todos="Todos os estados"
            valor={f.uf}
            onChange={(uf) => setF({ ...f, uf, cidade: "", bairro: "" })}
            opcoes={estados.map((uf) => ({ valor: uf, texto: ESTADOS[uf] ?? uf }))}
          />
          <Escolha
            rotulo="Cidade"
            todos="Todas as cidades"
            valor={f.cidade}
            onChange={(cidade) => setF({ ...f, cidade, bairro: "" })}
            opcoes={cidades.map((c) => ({ valor: c, texto: c }))}
          />
          <Escolha
            rotulo="Bairro"
            todos="Todos os bairros"
            valor={f.bairro}
            onChange={(bairro) => setF({ ...f, bairro })}
            opcoes={bairros.map((b) => ({ valor: b, texto: b }))}
          />
        </div>
        <div
          className={`grid gap-3 sm:grid-cols-2 ${temVendaEAluguel ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}
        >
          <Escolha
            rotulo="Tipo de imóvel"
            todos="Todos os tipos"
            valor={f.tipo}
            onChange={(tipo) => setF({ ...f, tipo })}
            opcoes={tipos.map((t) => ({ valor: t, texto: t }))}
          />
          {temVendaEAluguel && (
            <Escolha
              rotulo="Negócio"
              todos="Venda e aluguel"
              valor={f.finalidade}
              onChange={(v) => setF({ ...f, finalidade: v as Filtro["finalidade"] })}
              opcoes={[
                { valor: "venda", texto: "Venda" },
                { valor: "locacao", texto: "Aluguel" },
              ]}
            />
          )}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Dormitórios</span>
            <Opcoes valor={f.quartos} onChange={(v) => setF({ ...f, quartos: v })} />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Banheiros</span>
            <Opcoes valor={f.banheiros} onChange={(v) => setF({ ...f, banheiros: v })} />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Preço (R$)</span>
            <div className="flex items-center gap-2">
              <input
                className={caixa}
                inputMode="numeric"
                placeholder="Mínimo"
                value={f.min}
                onChange={(e) => setF({ ...f, min: mascara(e.target.value) })}
              />
              <span className="text-subtle">–</span>
              <input
                className={caixa}
                inputMode="numeric"
                placeholder="Máximo"
                value={f.max}
                onChange={(e) => setF({ ...f, max: mascara(e.target.value) })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {lista.length} de {anuncios.length} {anuncios.length === 1 ? "imóvel" : "imóveis"}
        </p>
        <div className="flex items-center gap-4">
          {ativos && (
            <button
              onClick={() => setF({ ...VAZIO, ordem: f.ordem })}
              className="text-sm font-semibold text-accent"
            >
              Limpar filtros
            </button>
          )}
          <select
            aria-label="Ordenar"
            className="h-9 cursor-pointer rounded-full border border-line bg-bg px-3 text-sm font-medium outline-none focus:border-accent"
            value={f.ordem}
            onChange={(e) => setF({ ...f, ordem: e.target.value as Ordem })}
          >
            <option value="recentes">Mais recentes</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </div>
      </div>

      {lista.length ? (
        <GradeImoveis anuncios={lista} anunciante={busca} />
      ) : (
        <div className="rounded-3xl bg-canvas p-10 text-center">
          <p className="font-semibold">Nenhum imóvel com esses filtros</p>
          <button onClick={() => setF(VAZIO)} className="mt-2 text-sm font-semibold text-accent">
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

/** Compartilhar a página: abre o menu do celular ou, no computador, copia o link. */
export function BotaoCompartilhar({
  titulo,
  texto,
  className = "",
}: {
  titulo: string;
  texto: string;
  className?: string;
}) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title: titulo, text: texto, url });
            return;
          } catch (e) {
            if ((e as Error).name === "AbortError") return; // a pessoa fechou o menu
          }
        }
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          window.prompt("Copie o link:", url);
          return;
        }
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2200);
      }}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border border-line-strong bg-bg px-5 text-sm font-semibold transition hover:bg-canvas ${className}`}
    >
      {copiado ? <Check className="size-4 text-verified" /> : <Share2 className="size-4" />}
      {copiado ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}
