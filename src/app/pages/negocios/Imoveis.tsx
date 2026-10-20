import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ChevronRight, LineChart, MapPin, Plus } from "lucide-react";
import { CATEGORIAS, imoveis, transacoes } from "@/data/demo";
import { LocalImovel } from "./LocalImovel";
import { fotoDoImovel, captacaoById, captacaoTitulo, captacoesDoImovel, enderecoCompleto, imovelById, imovelNome } from "@/data/queries";
import { useStore } from "@/data/store";
import type { CategoriaImovel } from "@/data/types";
import { brl } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { Card, Select } from "../../kit";
import { btn, Drawer, EmptyState, SearchInput } from "../../forms";
import { CategoriaIcon, FinalidadeBadge, ImovelCover, ImovelFormModal, StatusBadge, valorLabel } from "./shared";

function ImovelDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { scope, isAdmin } = useScope();
  const im = id ? imovelById(id) : undefined;
  const caps = im ? captacoesDoImovel(im.id) : [];
  // O corretor vê as próprias captações; o histórico de fechamentos aparece como dado de mercado (sem nomes).
  const minhas = isAdmin ? caps : caps.filter((c) => c.corretorId === scope.corretorId);
  const fechamentos = im
    ? transacoes.filter((t) => captacaoById(t.captacaoId)?.imovelId === im.id).sort((a, b) => b.data.localeCompare(a.data))
    : [];

  return (
    <Drawer open={!!im} onClose={onClose} title={im && imovelNome(im)} subtitle={im?.categoria}>
      {im && (
        <div className="space-y-7">
          {/* Com posição no mapa, o mapa aparece no lugar da ilustração */}
          {im.lat === undefined && (
            <div className="overflow-hidden rounded-3xl">
              <ImovelCover categoria={im.categoria} foto={fotoDoImovel(im.id)} className="aspect-[16/7]" />
            </div>
          )}
          <p className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
            {enderecoCompleto(im.endereco)}
          </p>
          <LocalImovel im={im} className="h-64" />

          <div>
            <p className="mb-3 font-display text-lg font-semibold">
              {isAdmin ? "Captações neste imóvel" : "Suas captações neste imóvel"} ({minhas.length})
            </p>
            {minhas.length ? (
              <ul className="space-y-2">
                {minhas.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/app/negocios/captacoes?captacao=${c.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-line-strong hover:bg-canvas"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{c.unidade ?? captacaoTitulo(c)}</p>
                        <p className="text-xs text-muted">
                          {valorLabel(c.finalidade, c.valor)} · {c.areaM2} m²
                        </p>
                      </div>
                      <FinalidadeBadge finalidade={c.finalidade} />
                      <StatusBadge status={c.status} />
                      <ChevronRight className="size-4 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhuma captação ainda. Use “Nova captação” e escolha este imóvel.</p>
            )}
          </div>

          <div>
            <p className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
              <LineChart className="size-4 text-accent" /> Histórico de fechamentos
            </p>
            {fechamentos.length ? (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {fechamentos.map((t) => {
                  const c = captacaoById(t.captacaoId)!;
                  return (
                    <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {c.unidade ?? im.categoria} · {c.areaM2} m²
                        </p>
                        <p className="text-xs text-muted">
                          {t.tipo === "venda" ? "Vendido" : "Alugado"} em {new Date(t.data).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{valorLabel(t.tipo, t.valor)}</p>
                        <p className="text-xs text-muted">{brl(t.valor / c.areaM2)}/m²</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Ainda não há vendas ou locações registradas neste imóvel.</p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Imoveis() {
  useStore();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const list = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return imoveis
      .filter((i) => (!categoria || i.categoria === categoria) && (!q || `${imovelNome(i)} ${enderecoCompleto(i.endereco)}`.toLowerCase().includes(q)))
      .sort((a, b) => imovelNome(a).localeCompare(imovelNome(b)));
  }, [busca, categoria, imoveis.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar edifício, rua ou bairro..." />
          <Select label="Categoria" value={categoria} onChange={setCategoria} options={[{ value: "", label: "Todas as categorias" }, ...CATEGORIAS.map((c) => ({ value: c, label: c }))]} />
        </div>
        <button onClick={() => setParam("novo", "1")} className={btn.accent}>
          <Plus className="size-4" /> Novo imóvel
        </button>
      </div>

      <p className="text-sm text-muted">
        Cadastro dos lugares físicos (edifícios, casas, galpões...). Compartilhado por toda a imobiliária e usado nas captações.
      </p>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<Building2 className="size-6" />} title="Nenhum imóvel encontrado" text="Ajuste a busca ou cadastre um novo imóvel." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Imóvel</th>
                  <th className="px-3 py-3 font-semibold">Categoria</th>
                  <th className="px-3 py-3 font-semibold">Bairro</th>
                  <th className="px-3 py-3 font-semibold">Captações</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 200).map((im, i) => {
                  const caps = captacoesDoImovel(im.id);
                  return (
                    <motion.tr
                      key={im.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: Math.min(i, 15) * 0.02, ease: EASE_OUT_EXPO }}
                      onClick={() => setParam("imovel", im.id)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/70"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                            <CategoriaIcon categoria={im.categoria as CategoriaImovel} />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{imovelNome(im)}</span>
                            <span className="block truncate text-xs text-muted">
                              {im.nome ? `${im.endereco.logradouro}, ${im.endereco.numero}` : `${im.endereco.cidade}, ${im.endereco.uf}`}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-muted">{im.categoria}</td>
                      <td className="px-3 py-3 text-muted">{im.endereco.bairro}</td>
                      <td className="px-3 py-3 text-muted">
                        {caps.length} {caps.length === 1 ? "captação" : "captações"}
                        {caps.some((c) => c.status === "ativa") && <span className="ml-1.5 text-xs font-semibold text-accent">· ativa</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChevronRight className="ml-auto size-4 text-muted" />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ImovelDrawer id={params.get("imovel")} onClose={() => setParam("imovel", null)} />
      <ImovelFormModal
        open={params.get("novo") === "1"}
        onClose={() => setParam("novo", null)}
        // Fecha o formulário e abre o imóvel criado numa única mudança de endereço.
        onCreated={(id) => setParams(new URLSearchParams({ imovel: id }), { replace: true })}
      />
    </div>
  );
}
