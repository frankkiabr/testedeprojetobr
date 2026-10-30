import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpDown, Check, ChevronDown, ChevronRight, ChevronUp, MapPin, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import type { CartaoAnuncio } from "./api";
import { GradeImoveis } from "./ui";
import { GRUPOS_CARACTERISTICAS, LANCAMENTOS, TIPOS_IMOVEL, type GrupoImovel } from "@/lib/imovel";

/**
 * BUSCA DO PORTAL (/imoveis, por cidade, corretor e imobiliária), no estilo do VivaReal/ZAP:
 * barra com cidade (sugere enquanto digita), Comprar/Alugar/Imóvel novo e Tipo de imóvel; "Filtros" abre a janela
 * completa (quartos, banheiros, vagas, preço, condomínio, área, lançamento, características e código), que mostra
 * quantos imóveis vai achar antes de buscar. "Ordenar por" abre as opções de ordem. Tudo filtra no navegador.
 */

type Negocio = "comprar" | "alugar" | "novo";
type Ordem = "relevantes" | "recentes" | "menor" | "maior" | "area";
type Local = { tipo: "cidade" | "bairro"; cidade: string; uf: string; bairro?: string };
type Filtro = {
  local: Local | null;
  negocio: Negocio;
  tipos: string[];
  quartos: number;
  banheiros: number;
  vagas: number;
  precoMin: string;
  precoMax: string;
  condMin: string;
  condMax: string;
  areaMin: string;
  areaMax: string;
  lancamentos: string[];
  caracteristicas: string[];
  codigo: string;
};

const NEGOCIOS: { valor: Negocio; rotulo: string }[] = [
  { valor: "comprar", rotulo: "Comprar" },
  { valor: "alugar", rotulo: "Alugar" },
  { valor: "novo", rotulo: "Imóvel novo" },
];
const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "relevantes", rotulo: "Mais relevantes" },
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "menor", rotulo: "Menor preço" },
  { valor: "maior", rotulo: "Maior preço" },
  { valor: "area", rotulo: "Maior área" },
];

const vazio = (negocio: Negocio, local: Local | null = null): Filtro => ({
  local,
  negocio,
  tipos: [],
  quartos: 0,
  banheiros: 0,
  vagas: 0,
  precoMin: "",
  precoMax: "",
  condMin: "",
  condMax: "",
  areaMin: "",
  areaMax: "",
  lancamentos: [],
  caracteristicas: [],
  codigo: "",
});

const numero = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const mascara = (s: string) => {
  const n = numero(s);
  return n ? n.toLocaleString("pt-BR") : "";
};
/** Sem acento e minúsculo, para "belem" achar "Belém". */
const simples = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
const alterna = (l: string[], v: string) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
const textoLocal = (l: Local) => (l.tipo === "bairro" ? `${l.bairro}, ${l.cidade} - ${l.uf}` : `${l.cidade} - ${l.uf}`);

/** O imóvel passa pelo filtro? */
function passa(a: CartaoAnuncio, f: Filtro) {
  if (f.negocio === "alugar" ? a.finalidade !== "locacao" : a.finalidade !== "venda") return false;
  if (f.negocio === "novo" && !a.lancamento) return false;
  if (f.local) {
    if (a.cidade !== f.local.cidade || a.uf !== f.local.uf) return false;
    if (f.local.tipo === "bairro" && a.bairro !== f.local.bairro) return false;
  }
  if (f.tipos.length && !f.tipos.includes(a.categoria)) return false;
  if (f.quartos && (a.quartos ?? 0) < f.quartos) return false;
  if (f.banheiros && (a.banheiros ?? 0) < f.banheiros) return false;
  if (f.vagas && (a.vagas ?? 0) < f.vagas) return false;
  if (numero(f.precoMin) && a.valor < numero(f.precoMin)) return false;
  if (numero(f.precoMax) && a.valor > numero(f.precoMax)) return false;
  if (numero(f.condMin) && (a.condominio ?? 0) < numero(f.condMin)) return false;
  if (numero(f.condMax) && (a.condominio ?? 0) > numero(f.condMax)) return false;
  if (numero(f.areaMin) && a.area < numero(f.areaMin)) return false;
  if (numero(f.areaMax) && a.area > numero(f.areaMax)) return false;
  if (f.lancamentos.length && !f.lancamentos.includes(a.lancamento ?? "")) return false;
  if (f.caracteristicas.length && !f.caracteristicas.every((c) => a.caracteristicas?.includes(c))) return false;
  if (f.codigo.trim() && !simples(a.codigo).includes(simples(f.codigo.trim()))) return false;
  return true;
}

/** "Mais relevantes": anúncio completo (fotos, descrição, características) e recente vem primeiro. */
function relevancia(a: CartaoAnuncio) {
  const dias = a.publicado_em ? (Date.now() - new Date(a.publicado_em).getTime()) / 864e5 : 999;
  return (
    Math.min(a.fotos ?? 0, 20) * 2 +
    Math.min((a.descricao_tamanho ?? 0) / 200, 5) +
    Math.min(a.caracteristicas?.length ?? 0, 10) * 0.5 +
    (a.quartos != null ? 1 : 0) +
    (dias < 7 ? 3 : dias < 30 ? 1 : 0)
  );
}
function ordenar(l: CartaoAnuncio[], o: Ordem) {
  const c = [...l];
  if (o === "menor") return c.sort((a, b) => a.valor - b.valor);
  if (o === "maior") return c.sort((a, b) => b.valor - a.valor);
  if (o === "area") return c.sort((a, b) => b.area - a.area);
  if (o === "recentes") return c.sort((a, b) => (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""));
  return c.sort((a, b) => relevancia(b) - relevancia(a) || (b.publicado_em ?? "").localeCompare(a.publicado_em ?? ""));
}

/** Quantos filtros da janela estão em uso (para o número no botão "Filtros"). */
const emUso = (f: Filtro) =>
  [f.quartos, f.banheiros, f.vagas].filter(Boolean).length +
  [f.precoMin || f.precoMax, f.condMin || f.condMax, f.areaMin || f.areaMax, f.codigo.trim()].filter(Boolean).length +
  f.lancamentos.length +
  f.caracteristicas.length;

// ---------- Peças ----------

const marcado = "border-accent bg-accent-soft text-accent-deep";
const desmarcado = "border-line bg-bg hover:border-line-strong";

/** Janela no meio da tela (no celular, sobe de baixo). Fica por cima de tudo. */
function Janela({ aberta, onFechar, titulo, children, rodape }: { aberta: boolean; onFechar: () => void; titulo: string; children: ReactNode; rodape: ReactNode }) {
  useEffect(() => {
    if (!aberta) return;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", esc);
    };
  }, [aberta]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!aberta) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onFechar}>
      <div
        role="dialog"
        aria-modal
        aria-label={titulo}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-bg shadow-float sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-6 pb-3 pt-5">
          <h2 className="font-display text-xl font-semibold">{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">{rodape}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Menu que abre embaixo do botão e fecha ao clicar fora. */
function Suspenso({ rotulo, ativo, children, largura = "w-64" }: { rotulo: ReactNode; ativo?: boolean; children: (fechar: () => void) => ReactNode; largura?: string }) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const f = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [aberto]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((x) => !x)}
        className={`inline-flex h-12 items-center gap-2 whitespace-nowrap rounded-2xl border px-4 text-sm font-semibold transition ${ativo ? marcado : desmarcado}`}
      >
        {rotulo} <ChevronDown className={`size-4 transition ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className={`absolute left-0 top-full z-40 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-bg p-2 shadow-float ${largura}`}>
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  );
}

function Caixa({ marcada, children, onClick }: { marcada: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${marcada ? "bg-accent-soft text-accent-deep" : "hover:bg-canvas"}`}>
      <span className={`grid size-5 shrink-0 place-items-center rounded-md border ${marcada ? "border-accent bg-accent text-white" : "border-line-strong bg-bg"}`}>
        {marcada && <Check className="size-3.5" />}
      </span>
      {children}
    </button>
  );
}

function TiposPorGrupo({ tipos, onChange }: { tipos: string[]; onChange: (t: string[]) => void }) {
  return (
    <>
      {(["Residencial", "Comercial"] as GrupoImovel[]).map((g) => (
        <div key={g} className="mb-1">
          <p className="px-3 pb-1 pt-2 text-sm font-semibold">{g}</p>
          {TIPOS_IMOVEL.filter((t) => t.grupo === g).map((t) => (
            <Caixa key={t.valor} marcada={tipos.includes(t.valor)} onClick={() => onChange(alterna(tipos, t.valor))}>
              {t.rotulo}
            </Caixa>
          ))}
        </div>
      ))}
    </>
  );
}

/** Campo de cidade/bairro que sugere enquanto digita ("Bel" → Belém, Cidade, PA). */
function BuscaLocal({ anuncios, local, onChange }: { anuncios: CartaoAnuncio[]; local: Local | null; onChange: (l: Local | null) => void }) {
  const [texto, setTexto] = useState(local ? textoLocal(local) : "");
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setTexto(local ? textoLocal(local) : ""), [local]);
  useEffect(() => {
    if (!aberto) return;
    const f = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, [aberto]);

  const lugares = useMemo(() => {
    const m = new Map<string, Local>();
    for (const a of anuncios) {
      m.set(`c|${a.cidade}|${a.uf}`, { tipo: "cidade", cidade: a.cidade, uf: a.uf });
      if (a.bairro) m.set(`b|${a.bairro}|${a.cidade}|${a.uf}`, { tipo: "bairro", cidade: a.cidade, uf: a.uf, bairro: a.bairro });
    }
    return [...m.values()];
  }, [anuncios]);
  const q = simples(texto.trim());
  const sugestoes = q
    ? lugares
        .map((l) => ({ l, nome: l.tipo === "bairro" ? l.bairro! : l.cidade }))
        .filter((x) => simples(x.nome).includes(q))
        .sort((a, b) => Number(simples(b.nome).startsWith(q)) - Number(simples(a.nome).startsWith(q)) || (a.l.tipo === "cidade" ? -1 : 1))
        .slice(0, 8)
    : lugares.filter((l) => l.tipo === "cidade").map((l) => ({ l, nome: l.cidade })).slice(0, 8);

  const destaque = (nome: string) => {
    const i = simples(nome).indexOf(q);
    if (!q || i < 0) return <span className="font-semibold">{nome}</span>;
    return (
      <>
        {nome.slice(0, i)}
        <span className="font-bold">{nome.slice(i, i + q.length)}</span>
        {nome.slice(i + q.length)}
      </>
    );
  };

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        className="h-12 w-full rounded-2xl border border-line bg-bg pl-11 pr-10 text-sm outline-none transition focus:border-accent"
        placeholder="Digite uma cidade ou bairro"
        value={texto}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => e.key === "Escape" && setAberto(false)}
        onChange={(e) => {
          setTexto(e.target.value);
          setAberto(true);
          if (local) onChange(null);
        }}
      />
      {texto && (
        <button
          type="button"
          aria-label="Limpar local"
          onClick={() => {
            setTexto("");
            onChange(null);
          }}
          className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-canvas"
        >
          <X className="size-4" />
        </button>
      )}
      {aberto && sugestoes.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-bg p-2 shadow-float">
          {sugestoes.map(({ l, nome }) => (
            <li key={`${l.tipo}-${nome}-${l.cidade}-${l.uf}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(l);
                  setAberto(false);
                }}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent-soft"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted" />
                <span className="min-w-0">
                  <span className="block text-sm">
                    {destaque(nome)} <span className="text-muted">- {l.tipo === "cidade" ? "Cidade" : "Bairro"}</span>
                  </span>
                  <span className="block text-xs text-muted">{l.tipo === "cidade" ? l.uf : `${l.cidade}, ${l.uf}`}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Contador({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{rotulo}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(valor === n ? 0 : n)}
            className={`size-14 rounded-xl border text-sm font-semibold transition ${valor === n ? marcado : desmarcado}`}
          >
            {n}+
          </button>
        ))}
      </div>
    </div>
  );
}

function Faixa({ rotulo, min, max, onMin, onMax, prefixo, sufixo }: { rotulo: string; min: string; max: string; onMin: (v: string) => void; onMax: (v: string) => void; prefixo?: string; sufixo?: string }) {
  const campo = (v: string, on: (v: string) => void, ph: string) => (
    <label className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-sm">{ph}</span>
      <span className="flex h-12 items-center gap-1.5 rounded-xl border border-line px-3 focus-within:border-accent">
        {prefixo && <span className="text-sm text-subtle">{prefixo}</span>}
        <input className="w-full min-w-0 bg-transparent text-sm outline-none" inputMode="numeric" placeholder="0" value={v} onChange={(e) => on(mascara(e.target.value))} />
        {sufixo && <span className="text-sm text-subtle">{sufixo}</span>}
      </span>
    </label>
  );
  return (
    <div>
      <p className="mb-2 text-sm text-muted">{rotulo}</p>
      <div className="flex gap-3">
        {campo(min, onMin, "Mínimo")}
        {campo(max, onMax, "Máximo")}
      </div>
    </div>
  );
}

function Secao({ titulo, children, inicial = true }: { titulo: string; children: ReactNode; inicial?: boolean }) {
  const [aberta, setAberta] = useState(inicial);
  return (
    <div className="border-t border-line pt-4">
      <button type="button" onClick={() => setAberta((x) => !x)} className="flex w-full items-center justify-between text-sm text-muted">
        {titulo} {aberta ? <ChevronUp className="size-5 text-ink" /> : <ChevronDown className="size-5 text-ink" />}
      </button>
      {aberta && <div className="mt-2">{children}</div>}
    </div>
  );
}

// ---------- Busca ----------

export function ImoveisComFiltro({
  anuncios,
  busca = false,
  inicial,
}: {
  anuncios: CartaoAnuncio[];
  /** Filtro já escolhido ao abrir (ex.: páginas por cidade). */
  inicial?: { uf?: string; cidade?: string; bairro?: string };
  /** Busca geral (mostra quem anuncia em cada cartão). */
  busca?: boolean;
}) {
  // Começa em "Comprar" quando há imóvel à venda; senão em "Alugar"
  const negocioInicial: Negocio = anuncios.some((a) => a.finalidade === "venda") ? "comprar" : "alugar";
  const localInicial: Local | null = inicial?.cidade && inicial.uf ? { tipo: "cidade", cidade: inicial.cidade, uf: inicial.uf } : null;
  const [f, setF] = useState<Filtro>(() => vazio(negocioInicial, localInicial));
  const [ordem, setOrdem] = useState<Ordem>("relevantes");
  const [janela, setJanela] = useState<"" | "filtros" | "ordem">("");
  const [rascunho, setRascunho] = useState<Filtro>(f);
  const [ordemRascunho, setOrdemRascunho] = useState<Ordem>(ordem);
  const [todosTipos, setTodosTipos] = useState(false);

  const lista = useMemo(() => ordenar(anuncios.filter((a) => passa(a, f)), ordem), [anuncios, f, ordem]);
  const previa = useMemo(() => anuncios.filter((a) => passa(a, rascunho)).length, [anuncios, rascunho]);
  const qtdFiltros = emUso(f);
  const mudou = JSON.stringify(f) !== JSON.stringify(vazio(negocioInicial, localInicial));
  const rotuloNegocio = NEGOCIOS.find((n) => n.valor === f.negocio)!.rotulo;
  const rotuloTipos = f.tipos.length === 0 ? "Tipo de imóvel" : f.tipos.length === 1 ? TIPOS_IMOVEL.find((t) => t.valor === f.tipos[0])?.rotulo : `${f.tipos.length} tipos`;
  const r = rascunho;
  const setR = (p: Partial<Filtro>) => setRascunho((x) => ({ ...x, ...p }));
  const plural = (n: number) => `${n} ${n === 1 ? "imóvel" : "imóveis"}`;

  return (
    <div>
      {/* Barra: local, negócio, tipo e filtros */}
      <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-center">
        <BuscaLocal anuncios={anuncios} local={f.local} onChange={(local) => setF({ ...f, local })} />
        <div className="flex flex-wrap gap-2">
          <Suspenso rotulo={rotuloNegocio} ativo largura="w-52">
            {(fechar) =>
              NEGOCIOS.map((n) => (
                <button
                  key={n.valor}
                  type="button"
                  onClick={() => {
                    setF({ ...f, negocio: n.valor, lancamentos: n.valor === "novo" ? f.lancamentos : [] });
                    fechar();
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${f.negocio === n.valor ? "bg-accent-soft text-accent-deep" : "hover:bg-canvas"}`}
                >
                  {n.rotulo} {f.negocio === n.valor && <Check className="size-4" />}
                </button>
              ))
            }
          </Suspenso>
          <Suspenso rotulo={<span className="max-w-40 truncate">{rotuloTipos}</span>} ativo={f.tipos.length > 0} largura="w-72">
            {() => <TiposPorGrupo tipos={f.tipos} onChange={(tipos) => setF({ ...f, tipos })} />}
          </Suspenso>
          <button
            type="button"
            onClick={() => {
              setRascunho(f);
              setTodosTipos(false);
              setJanela("filtros");
            }}
            className={`inline-flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${qtdFiltros ? marcado : desmarcado}`}
          >
            <SlidersHorizontal className="size-4" /> Filtros
            {qtdFiltros > 0 && <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] text-white">{qtdFiltros}</span>}
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          <span className="font-semibold text-ink">{plural(lista.length)}</span>
          {f.local ? ` em ${textoLocal(f.local)}` : ""}
          {mudou && (
            <button onClick={() => setF(vazio(negocioInicial, null))} className="ml-3 font-semibold text-accent">
              Limpar filtros
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            setOrdemRascunho(ordem);
            setJanela("ordem");
          }}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold transition hover:border-line-strong"
        >
          <ArrowUpDown className="size-4" /> Ordenar por: <span className="text-accent">{ORDENS.find((o) => o.valor === ordem)!.rotulo}</span>
        </button>
      </div>

      {lista.length ? (
        <GradeImoveis anuncios={lista} anunciante={busca} />
      ) : (
        <div className="rounded-3xl bg-canvas p-10 text-center">
          <p className="font-semibold">Nenhum imóvel com esses filtros</p>
          <button onClick={() => setF(vazio(negocioInicial, null))} className="mt-2 text-sm font-semibold text-accent">
            Limpar filtros
          </button>
        </div>
      )}

      {/* Ordenar por */}
      <Janela
        aberta={janela === "ordem"}
        onFechar={() => setJanela("")}
        titulo="Ordenar por"
        rodape={
          <button
            type="button"
            onClick={() => {
              setOrdem(ordemRascunho);
              setJanela("");
            }}
            className="h-12 w-full rounded-full bg-accent text-sm font-semibold text-white transition hover:bg-accent-deep"
          >
            Aplicar
          </button>
        }
      >
        <div className="space-y-2">
          {ORDENS.map((o) => (
            <button
              key={o.valor}
              type="button"
              onClick={() => setOrdemRascunho(o.valor)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold transition ${ordemRascunho === o.valor ? marcado : desmarcado}`}
            >
              {o.rotulo} {ordemRascunho === o.valor && <Check className="size-4" />}
            </button>
          ))}
        </div>
      </Janela>

      {/* Filtros completos */}
      <Janela
        aberta={janela === "filtros"}
        onFechar={() => setJanela("")}
        titulo="Filtros"
        rodape={
          <>
            <button type="button" onClick={() => setRascunho(vazio(r.negocio, null))} className="px-2 text-sm font-semibold underline underline-offset-4">
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                setF(rascunho);
                setJanela("");
              }}
              className="h-12 flex-1 rounded-full bg-accent-soft px-5 text-sm font-semibold text-accent-deep transition hover:bg-accent hover:text-white sm:flex-none"
            >
              Buscar {plural(previa)}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="-mx-6 flex border-b border-line px-6">
            {NEGOCIOS.map((n) => (
              <button
                key={n.valor}
                type="button"
                onClick={() => setR({ negocio: n.valor, lancamentos: n.valor === "novo" ? r.lancamentos : [] })}
                className={`flex-1 border-b-2 pb-3 text-sm font-semibold transition ${r.negocio === n.valor ? "border-accent text-accent" : "border-transparent text-ink hover:text-accent"}`}
              >
                {n.rotulo}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm text-muted">Localização</p>
            <BuscaLocal anuncios={anuncios} local={r.local} onChange={(local) => setR({ local })} />
          </div>

          <div>
            <p className="mb-1 text-sm text-muted">Tipo de imóvel</p>
            {todosTipos ? (
              <TiposPorGrupo tipos={r.tipos} onChange={(tipos) => setR({ tipos })} />
            ) : (
              <>
                {TIPOS_IMOVEL.slice(0, 3).map((t) => (
                  <Caixa key={t.valor} marcada={r.tipos.includes(t.valor)} onClick={() => setR({ tipos: alterna(r.tipos, t.valor) })}>
                    {t.rotulo}
                  </Caixa>
                ))}
                <button type="button" onClick={() => setTodosTipos(true)} className="mt-1 flex items-center gap-1 px-3 py-2 text-sm font-semibold">
                  Todos os tipos de imóveis <ChevronRight className="size-4" />
                  {r.tipos.length > 3 && <span className="ml-1 text-accent">({r.tipos.length})</span>}
                </button>
              </>
            )}
          </div>

          <div className="space-y-5 border-t border-line pt-5">
            <Contador rotulo="Quartos" valor={r.quartos} onChange={(quartos) => setR({ quartos })} />
            <Contador rotulo="Banheiros" valor={r.banheiros} onChange={(banheiros) => setR({ banheiros })} />
            <Contador rotulo="Vagas" valor={r.vagas} onChange={(vagas) => setR({ vagas })} />
          </div>

          <div className="space-y-5 border-t border-line pt-5">
            <Faixa rotulo="Preço" prefixo="R$" min={r.precoMin} max={r.precoMax} onMin={(precoMin) => setR({ precoMin })} onMax={(precoMax) => setR({ precoMax })} />
            <Faixa rotulo="Preço do condomínio" prefixo="R$" min={r.condMin} max={r.condMax} onMin={(condMin) => setR({ condMin })} onMax={(condMax) => setR({ condMax })} />
            <Faixa rotulo="Área do imóvel" sufixo="m²" min={r.areaMin} max={r.areaMax} onMin={(areaMin) => setR({ areaMin })} onMax={(areaMax) => setR({ areaMax })} />
          </div>

          <Secao titulo="Tipos de lançamento">
            {LANCAMENTOS.map((l) => (
              <Caixa key={l.valor} marcada={r.lancamentos.includes(l.valor)} onClick={() => setR({ lancamentos: alterna(r.lancamentos, l.valor) })}>
                {l.rotulo}
              </Caixa>
            ))}
          </Secao>

          {GRUPOS_CARACTERISTICAS.map((g) => (
            <Secao key={g.titulo} titulo={g.titulo}>
              {g.itens.map((c) => (
                <Caixa key={c} marcada={r.caracteristicas.includes(c)} onClick={() => setR({ caracteristicas: alterna(r.caracteristicas, c) })}>
                  {c}
                </Caixa>
              ))}
            </Secao>
          ))}

          <div className="border-t border-line pt-5">
            <p className="mb-2 text-sm">Código do imóvel</p>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <input
                className="h-12 w-full rounded-xl border border-line pl-10 pr-3 text-sm outline-none focus:border-accent"
                placeholder="Digite o código do imóvel (FK-...)"
                value={r.codigo}
                onChange={(e) => setR({ codigo: e.target.value })}
              />
            </span>
          </div>
        </div>
      </Janela>
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
