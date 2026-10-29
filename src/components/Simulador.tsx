import { useMemo, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { simular, TAXA_REFERENCIA } from "@/lib/financiamento";
import { lerMoeda, lerPct, mascaraMoeda, moeda, reaisCentavos, reaisInteiros } from "@/lib/moeda";

const campo =
  "h-11 w-full rounded-xl border border-line-strong bg-bg px-3.5 text-sm outline-hidden transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";
const PRAZOS = [10, 15, 20, 25, 30, 35];
const ENTRADAS = [10, 20, 30, 50];

function Rotulo({ texto, children, dica }: { texto: string; children: ReactNode; dica?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{texto}</span>
      {children}
      {dica && <span className="mt-1 block text-xs text-subtle">{dica}</span>}
    </label>
  );
}

/**
 * SIMULADOR DE FINANCIAMENTO (SAC e Price). Usado na página pública, no anúncio do portal e na plataforma.
 * `acao` recebe um resumo em texto (para enviar pelo WhatsApp) e desenha um botão abaixo do resultado.
 */
export function Simulador({ valorInicial, fixo, acao }: { valorInicial?: number; fixo?: boolean; acao?: (resumo: string) => ReactNode }) {
  const [valor, setValor] = useState(moeda(valorInicial));
  const [entradaPct, setEntradaPct] = useState(20);
  const [entrada, setEntrada] = useState(moeda(valorInicial ? valorInicial * 0.2 : undefined));
  const [anos, setAnos] = useState(30);
  const [taxa, setTaxa] = useState(String(TAXA_REFERENCIA).replace(".", ","));
  const [itbi, setItbi] = useState("2");
  const [cartorio, setCartorio] = useState("1,5");

  const v = lerMoeda(valor);
  const s = useMemo(
    () => simular({ valor: v, entrada: lerMoeda(entrada), anos, taxaAnual: lerPct(taxa), itbiPct: lerPct(itbi), cartorioPct: lerPct(cartorio) }),
    [v, entrada, anos, taxa, itbi, cartorio],
  );
  const porPct = (pct: number, base = v) => {
    setEntradaPct(pct);
    setEntrada(moeda(Math.round((base * pct) / 100)));
  };

  const resumo = s
    ? [
        `Simulação de financiamento (estimativa)`,
        `Imóvel: ${reaisInteiros(v)} · Entrada: ${reaisInteiros(lerMoeda(entrada))} · ${anos} anos · ${taxa}% ao ano`,
        `SAC: 1ª parcela ${reaisCentavos(s.sac.primeira)}, caindo até ${reaisCentavos(s.sac.ultima)}`,
        `Price: parcela fixa de ${reaisCentavos(s.price.parcela)}`,
        `Renda familiar sugerida: a partir de ${reaisInteiros(s.rendaPrice)} (Price) ou ${reaisInteiros(s.rendaSac)} (SAC)`,
        `ITBI e cartório (estimados): ${reaisInteiros(s.itbi + s.cartorio)}`,
        `Valores aproximados, sem seguros e tarifas. A proposta final é a do banco.`,
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Rotulo texto="Valor do imóvel">
          <input
            className={campo}
            inputMode="numeric"
            value={valor}
            disabled={fixo}
            onChange={(e) => {
              const novo = mascaraMoeda(e.target.value);
              setValor(novo);
              if (entradaPct) porPct(entradaPct, lerMoeda(novo));
            }}
            placeholder="0,00"
          />
        </Rotulo>
        <Rotulo texto="Entrada">
          <input
            className={campo}
            inputMode="numeric"
            value={entrada}
            onChange={(e) => {
              setEntrada(mascaraMoeda(e.target.value));
              setEntradaPct(0);
            }}
            placeholder="0,00"
          />
          <span className="mt-1.5 flex gap-1.5">
            {ENTRADAS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => porPct(p)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${entradaPct === p ? "bg-ink text-bg" : "bg-canvas text-muted hover:text-ink"}`}
              >
                {p}%
              </button>
            ))}
          </span>
        </Rotulo>
        <Rotulo texto="Prazo">
          <select className={campo} value={anos} onChange={(e) => setAnos(Number(e.target.value))}>
            {PRAZOS.map((a) => (
              <option key={a} value={a}>
                {a} anos ({a * 12} meses)
              </option>
            ))}
          </select>
        </Rotulo>
        <Rotulo texto="Juros ao ano (%)" dica="Use a taxa do banco escolhido. A sugestão é só uma referência.">
          <input className={campo} inputMode="decimal" value={taxa} onChange={(e) => setTaxa(e.target.value.replace(/[^\d,]/g, ""))} />
        </Rotulo>
        <Rotulo texto="ITBI (%)" dica="Varia por cidade: confira na prefeitura.">
          <input className={campo} inputMode="decimal" value={itbi} onChange={(e) => setItbi(e.target.value.replace(/[^\d,]/g, ""))} />
        </Rotulo>
        <Rotulo texto="Escritura e registro (%)">
          <input className={campo} inputMode="decimal" value={cartorio} onChange={(e) => setCartorio(e.target.value.replace(/[^\d,]/g, ""))} />
        </Rotulo>
      </div>

      {s ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-accent p-5 text-white">
              <p className="text-sm font-semibold text-white/80">SAC · parcela que diminui</p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{reaisCentavos(s.sac.primeira)}</p>
              <p className="mt-1 text-sm text-white/80">1ª parcela, caindo até {reaisCentavos(s.sac.ultima)}</p>
              <p className="mt-3 text-xs text-white/70">
                Total pago: {reaisInteiros(s.sac.total)} · renda a partir de {reaisInteiros(s.rendaSac)}
              </p>
            </div>
            <div className="rounded-3xl bg-ink p-5 text-bg">
              <p className="text-sm font-semibold text-bg/70">Price · parcela fixa</p>
              <p className="mt-1 font-display text-3xl font-semibold tracking-tight">{reaisCentavos(s.price.parcela)}</p>
              <p className="mt-1 text-sm text-bg/70">igual do início ao fim</p>
              <p className="mt-3 text-xs text-bg/60">
                Total pago: {reaisInteiros(s.price.total)} · renda a partir de {reaisInteiros(s.rendaPrice)}
              </p>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {[
              ["Valor financiado", reaisInteiros(s.financiado)],
              ["Juros ao mês", `${s.taxaMensal.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`],
              ["ITBI + cartório", reaisInteiros(s.itbi + s.cartorio)],
              ["Para ter em mãos", reaisInteiros(s.desembolsoInicial)],
            ].map(([r, x]) => (
              <div key={r} className="rounded-2xl bg-canvas p-3.5">
                <dt className="text-xs text-muted">{r}</dt>
                <dd className="mt-0.5 font-semibold">{x}</dd>
              </div>
            ))}
          </dl>
          {acao?.(resumo)}
        </>
      ) : (
        <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Informe o valor do imóvel e uma entrada menor que ele para ver as parcelas.</p>
      )}

      <p className="flex gap-2 text-xs leading-relaxed text-subtle">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Estimativa sem seguros obrigatórios (MIP e DFI), tarifas e correção pela TR. A renda sugerida considera a parcela em até 30% da renda
        familiar. O valor final é definido pelo banco na análise de crédito.
      </p>
    </div>
  );
}
