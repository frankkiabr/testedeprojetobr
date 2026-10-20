import { useMemo, useState } from "react";
import { Check, Share2, SlidersHorizontal } from "lucide-react";
import type { CartaoAnuncio } from "./api";
import { GradeImoveis } from "./ui";

type Filtro = {
  finalidade: "" | "venda" | "locacao";
  quartos: number;
  banheiros: number;
  min: string;
  max: string;
};
const VAZIO: Filtro = { finalidade: "", quartos: 0, banheiros: 0, min: "", max: "" };

const numero = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const mascara = (s: string) => {
  const n = numero(s);
  return n ? n.toLocaleString("pt-BR") : "";
};

function Opcoes({ valor, onChange }: { valor: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2, 3, 4].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`h-9 min-w-9 rounded-full border px-3 text-sm font-medium transition ${
            valor === n ? "border-ink bg-ink text-bg" : "border-line bg-bg hover:border-line-strong"
          }`}
        >
          {n === 0 ? "Todos" : `${n}+`}
        </button>
      ))}
    </div>
  );
}

/** Lista de imóveis com filtros: venda/aluguel, dormitórios, banheiros e faixa de preço. */
export function ImoveisComFiltro({ anuncios }: { anuncios: CartaoAnuncio[] }) {
  const [f, setF] = useState<Filtro>(VAZIO);
  const [aberto, setAberto] = useState(false);
  const temVendaEAluguel = new Set(anuncios.map((a) => a.finalidade)).size > 1;
  const ativos =
    (f.finalidade ? 1 : 0) + (f.quartos ? 1 : 0) + (f.banheiros ? 1 : 0) + (f.min || f.max ? 1 : 0);

  const lista = useMemo(
    () =>
      anuncios.filter(
        (a) =>
          (!f.finalidade || a.finalidade === f.finalidade) &&
          (!f.quartos || (a.quartos ?? 0) >= f.quartos) &&
          (!f.banheiros || (a.banheiros ?? 0) >= f.banheiros) &&
          (!numero(f.min) || a.valor >= numero(f.min)) &&
          (!numero(f.max) || a.valor <= numero(f.max)),
      ),
    [anuncios, f],
  );

  const campo =
    "h-10 w-full rounded-xl border border-line bg-bg px-3 text-sm outline-none transition focus:border-accent";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {lista.length} de {anuncios.length} {anuncios.length === 1 ? "imóvel" : "imóveis"}
        </p>
        <div className="flex items-center gap-3">
          {ativos > 0 && (
            <button
              onClick={() => setF(VAZIO)}
              className="text-sm font-semibold text-muted hover:text-ink"
            >
              Limpar
            </button>
          )}
          <button
            onClick={() => setAberto(!aberto)}
            className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
              aberto || ativos
                ? "border-ink bg-ink text-bg"
                : "border-line-strong bg-bg hover:bg-canvas"
            }`}
          >
            <SlidersHorizontal className="size-4" /> Filtros{ativos ? ` (${ativos})` : ""}
          </button>
        </div>
      </div>

      {aberto && (
        <div className="mb-6 grid gap-5 rounded-3xl border border-line p-5 sm:grid-cols-2 lg:grid-cols-4">
          {temVendaEAluguel && (
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">Negócio</p>
              <div className="flex gap-1.5">
                {(
                  [
                    ["", "Todos"],
                    ["venda", "Venda"],
                    ["locacao", "Aluguel"],
                  ] as const
                ).map(([v, rotulo]) => (
                  <button
                    key={v}
                    onClick={() => setF({ ...f, finalidade: v })}
                    className={`h-9 rounded-full border px-3 text-sm font-medium transition ${
                      f.finalidade === v
                        ? "border-ink bg-ink text-bg"
                        : "border-line bg-bg hover:border-line-strong"
                    }`}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Dormitórios</p>
            <Opcoes valor={f.quartos} onChange={(v) => setF({ ...f, quartos: v })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Banheiros</p>
            <Opcoes valor={f.banheiros} onChange={(v) => setF({ ...f, banheiros: v })} />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">Preço (R$)</p>
            <div className="flex items-center gap-2">
              <input
                className={campo}
                inputMode="numeric"
                placeholder="Mínimo"
                value={f.min}
                onChange={(e) => setF({ ...f, min: mascara(e.target.value) })}
              />
              <span className="text-subtle">–</span>
              <input
                className={campo}
                inputMode="numeric"
                placeholder="Máximo"
                value={f.max}
                onChange={(e) => setF({ ...f, max: mascara(e.target.value) })}
              />
            </div>
          </div>
        </div>
      )}

      {lista.length ? (
        <GradeImoveis anuncios={lista} />
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
