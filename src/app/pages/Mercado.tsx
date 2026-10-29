import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Info, MapPin, Ruler, Scale, TrendingUp } from "lucide-react";
import { CATEGORIAS, imobiliaria } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { bairrosMercado, imovelNome, mercado, type FiltroMercado } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Finalidade } from "@/data/types";
import { brl, int } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { AnimatedNumber, Card, CardHeader, PageHeader, Segmented, Select, stagger } from "../kit";
import { EmptyState } from "../forms";
import { ListaEstudos } from "./estudos/Lista";

function Kpi({ label, icon: Icon, value, format, hint }: { label: string; icon: typeof Ruler; value: number; format: (n: number) => string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-muted">
        {label}
        <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[1.75rem] font-semibold leading-none tracking-tight">
        <AnimatedNumber value={value} format={format} />
      </p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

/** Banco de dados de preços a partir das vendas e locações registradas pela imobiliária. */
export default function Mercado() {
  useStore();
  // Estudos: valor de um imóvel por amostras (como o BrokerApp). Panorama: preços dos fechamentos da imobiliária.
  const [aba, setAba] = useState<"estudos" | "panorama">("estudos");
  // Começa em Apartamento: misturar categorias (ex.: galpões e terrenos) distorce o preço médio do m².
  const [f, setF] = useState<FiltroMercado>({ tipo: "venda", categoria: "Apartamento", bairro: "", meses: 12 });
  const m = useMemo(() => mercado(f), [f]);
  const loc = f.tipo === "locacao";
  const fmtValor = (n: number) => (loc ? `${brl(n)}/mês` : brl(n));
  const fmtM2 = (n: number) => (loc ? `${brl(n)}/m²·mês` : `${brl(n)}/m²`);
  const negociacao = m.resumo.ofertaM2 && m.resumo.m2Medio ? (1 - m.resumo.m2Medio / m.resumo.ofertaM2) * 100 : null;
  const maxM2 = Math.max(...m.porBairro.map((b) => b.m2Medio), 1);

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Estudo de mercado" subtitle="Preços reais de fechamento para embasar avaliações e conversas com proprietários." />
      </motion.div>

      <motion.div {...stagger(1)}>
        <Segmented
          id="mercado-aba"
          value={aba}
          onChange={setAba}
          options={[
            { value: "estudos", label: "Estudos" },
            { value: "panorama", label: ehSolo(imobiliaria.plano) ? "Panorama dos seus negócios" : "Panorama da imobiliária" },
          ]}
        />
      </motion.div>

      {aba === "estudos" ? (
        <ListaEstudos />
      ) : (
      <>

      <motion.div {...stagger(1)} className="flex flex-wrap items-center gap-2">
        <Segmented
          id="mercado-tipo"
          value={f.tipo}
          onChange={(v: Finalidade) => setF({ ...f, tipo: v })}
          options={[
            { value: "venda", label: "Vendas" },
            { value: "locacao", label: "Locações" },
          ]}
        />
        <Select label="Categoria" value={f.categoria} onChange={(v) => setF({ ...f, categoria: v })} options={[{ value: "", label: "Todas as categorias" }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]} />
        <Select label="Bairro" icon={<MapPin className="size-4" />} value={f.bairro} onChange={(v) => setF({ ...f, bairro: v })} options={[{ value: "", label: "Todos os bairros" }, ...bairrosMercado().map((b) => ({ value: b, label: b }))]} />
        <Select
          label="Período"
          value={String(f.meses)}
          onChange={(v) => setF({ ...f, meses: Number(v) })}
          options={[
            { value: "3", label: "Últimos 3 meses" },
            { value: "6", label: "Últimos 6 meses" },
            { value: "12", label: "Últimos 12 meses" },
            { value: "0", label: "Todo o histórico" },
          ]}
        />
      </motion.div>

      <motion.p {...stagger(2)} className="flex items-start gap-2 text-sm text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        Baseado nas {loc ? "locações" : "vendas"} registradas pela {imobiliaria.nome}. Compare sempre a mesma categoria: misturar apartamentos com galpões ou terrenos distorce o
        preço do m². Quanto mais negócios forem registrados, mais preciso fica o estudo.
      </motion.p>

      {m.resumo.qtd === 0 ? (
        <Card>
          <EmptyState icon={<TrendingUp className="size-6" />} title="Sem fechamentos para este filtro" text="Amplie o período ou remova filtros de categoria e bairro." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <motion.div {...stagger(3)}>
              <Kpi label={loc ? "Preço médio do m² (aluguel)" : "Preço médio do m²"} icon={Ruler} value={m.resumo.m2Medio} format={fmtM2} hint={`${m.resumo.qtd} fechamentos`} />
            </motion.div>
            <motion.div {...stagger(4)}>
              <Kpi label={loc ? "Aluguel médio" : "Valor médio"} icon={TrendingUp} value={m.resumo.valorMedio} format={fmtValor} hint={`Área média de ${int(m.resumo.areaMedia)} m²`} />
            </motion.div>
            <motion.div {...stagger(5)}>
              <Kpi label={loc ? "Tempo médio para alugar" : "Tempo médio para vender"} icon={Clock} value={m.resumo.diasMedio} format={(n) => `${Math.round(n)} dias`} hint="Da captação ao fechamento" />
            </motion.div>
            <motion.div {...stagger(6)}>
              <Kpi
                label="Margem de negociação"
                icon={Scale}
                value={negociacao ?? 0}
                format={(n) => (negociacao === null ? "—" : `${n.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`)}
                hint={m.resumo.ofertaQtd ? `Pedido atual: ${fmtM2(m.resumo.ofertaM2)} (${m.resumo.ofertaQtd} ofertas)` : "Sem ofertas ativas para comparar"}
              />
            </motion.div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <motion.div {...stagger(7)}>
              <Card className="h-full">
                <CardHeader title="Preço do m² por bairro" subtitle="Média dos fechamentos, do mais caro ao mais barato." />
                <ul className="space-y-4 px-6 pb-6 pt-5">
                  {m.porBairro.map((b, i) => (
                    <li key={b.nome}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-semibold">{b.nome}</span>
                        <span className="text-muted">
                          <span className="font-semibold text-ink">{fmtM2(b.m2Medio)}</span> · {b.qtd} {b.qtd === 1 ? "fechamento" : "fechamentos"} · {Math.round(b.diasMedio)} dias
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-canvas-deep">
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          initial={{ width: 0 }}
                          animate={{ width: `${(b.m2Medio / maxM2) * 100}%` }}
                          transition={{ duration: 0.9, delay: 0.2 + i * 0.05, ease: EASE_OUT_EXPO }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>

            <motion.div {...stagger(8)}>
              <Card className="h-full">
                <CardHeader title="Por categoria" subtitle="Valor médio e preço do m²." />
                <ul className="mt-2 divide-y divide-line px-6 pb-4">
                  {m.porCategoria.map((c) => (
                    <li key={c.nome} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <div>
                        <p className="font-semibold">{c.nome}</p>
                        <p className="text-xs text-muted">
                          {c.qtd} {c.qtd === 1 ? "fechamento" : "fechamentos"} · {Math.round(c.diasMedio)} dias em média
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{fmtValor(c.valorMedio)}</p>
                        <p className="text-xs text-muted">{fmtM2(c.m2Medio)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </motion.div>
          </div>

          <motion.div {...stagger(9)}>
            <Card className="overflow-hidden">
              <CardHeader title="Fechamentos recentes" subtitle="Sem nomes de clientes ou corretores: só os dados do imóvel." />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[46rem] text-sm">
                  <thead>
                    <tr className="border-y border-line text-left text-xs text-muted">
                      <th className="px-6 py-3 font-semibold">Data</th>
                      <th className="px-3 py-3 font-semibold">Imóvel</th>
                      <th className="px-3 py-3 font-semibold">Bairro</th>
                      <th className="px-3 py-3 text-right font-semibold">Área</th>
                      <th className="px-3 py-3 text-right font-semibold">{loc ? "Aluguel" : "Valor"}</th>
                      <th className="px-3 py-3 text-right font-semibold">Preço/m²</th>
                      <th className="px-6 py-3 text-right font-semibold">Tempo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {m.linhas.slice(0, 40).map((r) => (
                      <tr key={r.t.id} className="border-b border-line last:border-0">
                        <td className="whitespace-nowrap px-6 py-3 text-muted">{new Date(r.t.data).toLocaleDateString("pt-BR")}</td>
                        <td className="px-3 py-3">
                          <p className="font-medium">{r.c.unidade ? `${r.c.unidade} · ${imovelNome(r.im)}` : `${r.im.categoria} · ${imovelNome(r.im)}`}</p>
                          <p className="text-xs text-muted">{r.im.categoria}</p>
                        </td>
                        <td className="px-3 py-3 text-muted">{r.im.endereco.bairro}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{r.c.areaM2} m²</td>
                        <td className="px-3 py-3 text-right font-semibold tabular-nums">{fmtValor(r.t.valor)}</td>
                        <td className="px-3 py-3 text-right tabular-nums">{fmtM2(r.m2)}</td>
                        <td className="px-6 py-3 text-right tabular-nums text-muted">{Math.round(r.dias)} dias</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </>
      )}
      </>
      )}
    </div>
  );
}
