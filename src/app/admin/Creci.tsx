import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Copy, ExternalLink, ShieldAlert, Undo2, UserRound } from "lucide-react";
import { useStore } from "@/data/store";
import { mensagemErro, supabase } from "@/integrations/frankkia/client";
import { useSession } from "../session";
import { Badge, Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState, inputCls, SearchInput } from "../forms";

type Status = "pendente" | "verificado" | "irregular";
type Linha = {
  usuarioId: string;
  nome: string;
  email: string;
  creci: string;
  uf: string;
  status: Status;
  conferidoEm: string | null;
  obs: string | null;
  imobiliaria: string;
  plano: string;
  desde: string;
};

const ROTULO: Record<Status, string> = { pendente: "A conferir", verificado: "Verificado", irregular: "Irregular" };
const TOM = { pendente: "warn", verificado: "verified", irregular: "danger" } as const;

/**
 * Não há API oficial do COFECI/CRECI e cada estado tem o seu site de consulta.
 * O botão abre a busca pela consulta pública do CRECI do estado (o primeiro resultado é o site oficial).
 */
const linkConsulta = (l: Linha) =>
  `https://www.google.com/search?q=${encodeURIComponent(`CRECI-${l.uf || ""} consulta corretor inscrito ${l.creci}`)}`;

const data = (s: string | null) => (s ? new Date(s).toLocaleDateString("pt-BR") : "");

/**
 * CRECI a conferir: a Frankkia consulta o número no site do conselho do estado e marca.
 * Verificado = selo "CRECI verificado" no portal. Irregular = anúncios saem do portal e o corretor vê um aviso
 * para corrigir. Se o corretor trocar o CRECI, volta para "A conferir".
 */
export default function Creci() {
  const { modo } = useSession();
  const { toast } = useStore();
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Status | "todos">("pendente");
  const [salvando, setSalvando] = useState("");
  const [motivo, setMotivo] = useState<{ id: string; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    if (modo !== "real") {
      setLinhas([]);
      return;
    }
    const { data: rows, error } = await supabase.rpc("painel_creci");
    if (error) {
      toast("Não foi possível carregar os CRECIs.");
      setLinhas([]);
      return;
    }
    setLinhas(
      (rows ?? []).map((r) => ({
        usuarioId: r.usuario_id,
        nome: r.nome,
        email: r.email,
        creci: r.creci,
        uf: r.creci_uf ?? "",
        status: r.status as Status,
        conferidoEm: r.conferido_em,
        obs: r.obs,
        imobiliaria: r.imobiliaria,
        plano: r.plano,
        desde: r.desde,
      })),
    );
  }, [modo, toast]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const marcar = async (id: string, status: Status, obs?: string) => {
    setSalvando(id);
    const { error } = await supabase.rpc("conferir_creci", { p_usuario: id, p_status: status, p_obs: obs ?? null } as never);
    setSalvando("");
    if (error) return toast(mensagemErro(error));
    setMotivo(null);
    toast(status === "verificado" ? "CRECI verificado. O selo já aparece no portal." : status === "irregular" ? "Marcado como irregular. Os anúncios saíram do portal." : "Voltou para a fila.");
    carregar();
  };

  const conta = (s: Status) => (linhas ?? []).filter((l) => l.status === s).length;
  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (linhas ?? [])
      .filter((l) => (filtro === "todos" || l.status === filtro) && (!q || `${l.nome} ${l.email} ${l.creci} ${l.imobiliaria}`.toLowerCase().includes(q)))
      .sort((a, b) => b.desde.localeCompare(a.desde));
  }, [linhas, busca, filtro]);

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="CRECI"
          subtitle="Confira cada CRECI no site do conselho do estado. Verificado ganha o selo no portal; irregular tira os anúncios do portal até o corretor corrigir."
        />
      </motion.div>

      <motion.div {...stagger(1)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          id="creci-painel"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "pendente", label: `A conferir (${conta("pendente")})` },
            { value: "verificado", label: `Verificados (${conta("verificado")})` },
            { value: "irregular", label: `Irregulares (${conta("irregular")})` },
            { value: "todos", label: "Todos" },
          ]}
        />
        <div className="sm:w-80">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, CRECI ou imobiliária..." />
        </div>
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {linhas && lista.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-6" />}
              title={filtro === "pendente" ? "Nenhum CRECI a conferir" : "Ninguém por aqui"}
              text={filtro === "pendente" ? "Quando alguém criar conta ou trocar o CRECI, aparece aqui." : "Ajuste a busca ou o filtro."}
            />
          ) : (
            <ul className="divide-y divide-line">
              {lista.map((l) => (
                <li key={l.usuarioId} className="px-5 py-4 sm:px-6">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{l.nome}</p>
                      <p className="truncate text-sm text-muted">
                        {l.email} · {l.imobiliaria} <span className="text-subtle">({l.plano})</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        CRECI {l.creci}
                        {l.uf ? `-${l.uf}` : ""}
                      </span>
                      <button
                        title="Copiar o número"
                        onClick={() => navigator.clipboard?.writeText(l.creci).then(() => toast("Número copiado."))}
                        className="grid size-8 place-items-center rounded-full text-muted transition hover:bg-canvas hover:text-ink"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <Badge tone={TOM[l.status]}>{ROTULO[l.status]}</Badge>
                  </div>

                  {l.status !== "pendente" && (
                    <p className="mt-1 text-xs text-subtle">
                      {ROTULO[l.status]} em {data(l.conferidoEm)}
                      {l.obs ? ` · ${l.obs}` : ""}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <a href={linkConsulta(l)} target="_blank" rel="noreferrer" className={`${btn.outline} h-9 px-3 text-xs`}>
                      <ExternalLink className="size-3.5" /> Consultar no CRECI{l.uf ? `-${l.uf}` : ""}
                    </a>
                    {l.status !== "verificado" && (
                      <button disabled={salvando === l.usuarioId} onClick={() => marcar(l.usuarioId, "verificado")} className={`${btn.outline} h-9 px-3 text-xs text-verified`}>
                        <BadgeCheck className="size-3.5" /> Verificado
                      </button>
                    )}
                    {l.status !== "irregular" && (
                      <button
                        disabled={salvando === l.usuarioId}
                        onClick={() => setMotivo({ id: l.usuarioId, texto: "" })}
                        className={`${btn.outline} h-9 px-3 text-xs text-rose-700`}
                      >
                        <ShieldAlert className="size-3.5" /> Irregular
                      </button>
                    )}
                    {l.status !== "pendente" && (
                      <button disabled={salvando === l.usuarioId} onClick={() => marcar(l.usuarioId, "pendente")} className={`${btn.outline} h-9 px-3 text-xs`}>
                        <Undo2 className="size-3.5" /> Voltar para a fila
                      </button>
                    )}
                  </div>

                  {motivo?.id === l.usuarioId && (
                    <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4">
                      <p className="text-sm font-semibold">Por que está irregular?</p>
                      <p className="text-xs text-muted">O corretor vê este motivo no aviso. Os anúncios dele saem do portal na hora.</p>
                      <input
                        autoFocus
                        className={`${inputCls} mt-2`}
                        maxLength={300}
                        placeholder="Ex.: número não encontrado no CRECI-PA; inscrição cancelada; nome diferente"
                        value={motivo.texto}
                        onChange={(e) => setMotivo({ ...motivo, texto: e.target.value })}
                      />
                      <div className="mt-3 flex gap-2">
                        <button disabled={salvando === l.usuarioId} onClick={() => marcar(l.usuarioId, "irregular", motivo.texto)} className={`${btn.primary} h-9 px-4 text-xs`}>
                          {salvando === l.usuarioId ? "Salvando..." : "Marcar como irregular"}
                        </button>
                        <button onClick={() => setMotivo(null)} className="h-9 rounded-full px-3 text-xs font-semibold text-muted transition hover:bg-canvas hover:text-ink">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
