import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Plus, UserRound, Users } from "lucide-react";
import { CHECKLIST_MARKETING, proprietarios } from "@/data/demo";
import { fotoCapa, captacaoCategoria, captacaoTitulo, captacoesDoProprietario, corretoresAtivos, done, proprietariosOf, pessoa, userById } from "@/data/queries";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { Avatar, Card, ProgressBar, Select } from "../../kit";
import { btn, Drawer, EmptyState, formatPhone, SearchInput, waLink } from "../../forms";
import { ImovelCover, ProprietarioFormModal, StatusBadge, valorLabel } from "./shared";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";

function ProprietarioDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const navigate = useNavigate();
  const { isAdmin } = useScope();
  const p = id ? proprietarios.find((x) => x.id === id) : undefined;
  const lista = p ? captacoesDoProprietario(p.id) : [];

  return (
    <Drawer open={!!p} onClose={onClose} title={p?.nome} subtitle={p && formatPhone(p.whatsapp)}>
      {p && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <a href={waLink(p.whatsapp)} target="_blank" rel="noreferrer" className={btn.whatsapp}>
              <WhatsAppIcon className="size-4" /> Conversar no WhatsApp
            </a>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3.5 text-sm">
              <Avatar user={pessoa(p.corretorId)} className="size-8 text-[0.625rem]" />
              <div>
                <p className="text-xs text-muted">Cadastrado por</p>
                <p className="font-semibold">{userById(p.corretorId)?.nome}</p>
              </div>
            </div>
          )}
          <div>
            <p className="mb-3 font-display text-lg font-semibold">Captações ({lista.length})</p>
            {lista.length ? (
              <ul className="space-y-2">
                {lista.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/app/negocios/captacoes?captacao=${c.id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line p-2.5 text-left transition hover:border-line-strong hover:bg-canvas"
                    >
                      <ImovelCover categoria={captacaoCategoria(c)} foto={fotoCapa(c.id)} className="size-14 shrink-0 rounded-xl [&_svg]:size-6" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{captacaoTitulo(c)}</p>
                        <p className="text-xs text-muted">{valorLabel(c.finalidade, c.valor)}</p>
                        <ProgressBar value={done(c) / CHECKLIST_MARKETING.length} className="mt-1.5 h-1 w-28" />
                      </div>
                      <StatusBadge status={c.status} />
                      <ChevronRight className="size-4 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhuma captação vinculada ainda. Cadastre uma “Nova captação” e escolha este proprietário.</p>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default function Proprietarios() {
  useStore();
  const { scope, isAdmin } = useScope();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [corretor, setCorretor] = useState("");

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const all = proprietariosOf(isAdmin && corretor ? { corretorId: corretor } : scope);
  const list = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return all.filter((p) => !q || `${p.nome} ${p.whatsapp}`.toLowerCase().includes(q));
  }, [all, busca]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar proprietário..." />
          {isAdmin && corretoresAtivos().length > 0 && (
            <Select
              label="Corretor"
              icon={<Users className="size-4" />}
              value={corretor}
              onChange={setCorretor}
              options={[{ value: "", label: "Toda a equipe" }, ...corretoresAtivos().map((c) => ({ value: c.id, label: c.nome }))]}
            />
          )}
        </div>
        <button onClick={() => setParam("novo", "1")} className={btn.accent}>
          <Plus className="size-4" /> Novo proprietário
        </button>
      </div>

      <Card className="overflow-hidden">
        {list.length === 0 ? (
          <EmptyState icon={<UserRound className="size-6" />} title="Nenhum proprietário encontrado" text="Ajuste a busca ou cadastre um novo proprietário." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs text-muted">
                  <th className="px-5 py-3 font-semibold">Proprietário</th>
                  <th className="px-3 py-3 font-semibold">WhatsApp</th>
                  <th className="px-3 py-3 font-semibold">Captações</th>
                  {isAdmin && <th className="px-3 py-3 font-semibold">Corretor</th>}
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.slice(0, 150).map((p, i) => {
                  const ims = captacoesDoProprietario(p.id);
                  const c = pessoa(p.corretorId);
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: Math.min(i, 15) * 0.02, ease: EASE_OUT_EXPO }}
                      onClick={() => setParam("proprietario", p.id)}
                      className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas/70"
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-3">
                          <Avatar user={{ id: p.id, iniciais: p.nome.split(" ").map((x) => x[0]).join("").slice(0, 2) }} className="size-9 text-xs" />
                          <span className="font-semibold">{p.nome}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <a
                          href={waLink(p.whatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f8ec] px-2.5 py-1 text-xs font-semibold text-[#128c4a] hover:bg-[#d3f3dd]"
                        >
                          <WhatsAppIcon className="size-3.5" /> {formatPhone(p.whatsapp)}
                        </a>
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-muted">
                          {ims.length} {ims.length === 1 ? "captação" : "captações"}
                          {ims.some((x) => x.status !== "ativa") && <span className="ml-1.5 text-xs font-semibold text-verified">· fechada</span>}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-3">
                          <span className="flex items-center gap-2">
                            <Avatar user={c} className="size-6 text-[0.5625rem]" />
                            {c.nome.split(" ")[0]}
                          </span>
                        </td>
                      )}
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

      <ProprietarioDrawer id={params.get("proprietario")} onClose={() => setParam("proprietario", null)} />
      <ProprietarioFormModal open={params.get("novo") === "1"} onClose={() => setParam("novo", null)} />
    </div>
  );
}
