import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, UserRound } from "lucide-react";
import { admin, corretores, imobiliaria } from "@/data/demo";
import { useStore } from "@/data/store";
import { supabase } from "@/integrations/frankkia/client";
import { useSession } from "../session";
import { Avatar, Badge, Card, PageHeader, Segmented, stagger } from "../kit";
import { btn, EmptyState, SearchInput } from "../forms";

type Linha = {
  usuarioId: string;
  nome: string;
  email: string;
  imobiliariaId: string;
  imobiliaria: string;
  plano: string;
  papel: "admin" | "corretor";
  ativo: boolean;
  desde: string;
};
type Filtro = "todos" | "ativos" | "desativados";

const iniciais = (s: string) =>
  s
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/**
 * Corretores de todas as imobiliárias (só dados de conta: nome, e-mail, imobiliária e situação).
 * Reativar um corretor desativado é feito aqui, pela Frankkia (o administrador pede por chamado).
 */
export default function Corretores() {
  const { modo } = useSession();
  const { reativarCorretor, toast } = useStore();
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [reativando, setReativando] = useState("");

  const carregar = useCallback(async () => {
    if (modo !== "real") {
      setLinhas(
        [admin, ...corretores].map((u) => ({
          usuarioId: u.id,
          nome: u.nome,
          email: u.email,
          imobiliariaId: imobiliaria.id,
          imobiliaria: imobiliaria.nome,
          plano: imobiliaria.plano,
          papel: u.papel,
          ativo: u.ativo !== false,
          desde: new Date().toISOString(),
        })),
      );
      return;
    }
    const { data, error } = await supabase.rpc("painel_corretores");
    if (error) {
      toast("Não foi possível carregar os corretores.");
      setLinhas([]);
      return;
    }
    setLinhas(
      (data ?? []).map((r) => ({
        usuarioId: r.usuario_id,
        nome: r.nome,
        email: r.email,
        imobiliariaId: r.imobiliaria_id,
        imobiliaria: r.imobiliaria,
        plano: r.plano,
        papel: r.papel as Linha["papel"],
        ativo: r.ativo,
        desde: r.desde,
      })),
    );
  }, [modo, toast]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (linhas ?? []).filter(
      (l) =>
        (filtro === "todos" || (filtro === "ativos" ? l.ativo : !l.ativo)) &&
        (!q || `${l.nome} ${l.email} ${l.imobiliaria}`.toLowerCase().includes(q)),
    );
  }, [linhas, busca, filtro]);
  const desativados = (linhas ?? []).filter((l) => !l.ativo).length;

  return (
    <div className="space-y-5">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Corretores"
          subtitle="Todas as pessoas com acesso às imobiliárias. Pedidos de reativação chegam em Chamados; reative aqui (a vaga precisa estar livre no plano)."
        />
      </motion.div>

      <motion.div
        {...stagger(1)}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <Segmented
          id="corretores-painel"
          value={filtro}
          onChange={setFiltro}
          options={[
            { value: "todos", label: `Todos (${linhas?.length ?? 0})` },
            { value: "ativos", label: "Ativos" },
            { value: "desativados", label: `Desativados (${desativados})` },
          ]}
        />
        <div className="sm:w-80">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome, e-mail ou imobiliária..."
          />
        </div>
      </motion.div>

      <motion.div {...stagger(2)}>
        <Card className="overflow-hidden">
          {linhas && lista.length === 0 ? (
            <EmptyState
              icon={<UserRound className="size-6" />}
              title="Ninguém por aqui"
              text="Ajuste a busca ou o filtro."
            />
          ) : (
            <ul className="divide-y divide-line">
              {lista.map((l) => (
                <li
                  key={`${l.imobiliariaId}-${l.usuarioId}`}
                  className="flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6"
                >
                  <Avatar
                    user={{ id: l.usuarioId, iniciais: iniciais(l.nome) }}
                    className={`size-10 text-xs ${l.ativo ? "" : "opacity-50"}`}
                  />
                  <div className={`min-w-0 flex-1 ${l.ativo ? "" : "opacity-60"}`}>
                    <p className="truncate font-semibold">{l.nome}</p>
                    <p className="truncate text-sm text-muted">
                      {l.email} · {l.imobiliaria} <span className="text-subtle">({l.plano})</span>
                    </p>
                  </div>
                  <Badge tone={l.papel === "admin" ? "accent" : "neutral"}>
                    {l.papel === "admin" ? "Administrador" : "Corretor"}
                  </Badge>
                  {l.ativo ? (
                    <Badge tone="verified">Ativo</Badge>
                  ) : l.papel === "corretor" ? (
                    <button
                      disabled={reativando === l.usuarioId}
                      onClick={async () => {
                        setReativando(l.usuarioId);
                        const e = await reativarCorretor(l.imobiliariaId, l.usuarioId);
                        setReativando("");
                        if (e) toast(e);
                        else carregar();
                      }}
                      className={`${btn.outline} h-9 px-3 text-xs`}
                    >
                      <RotateCcw className="size-3.5" />{" "}
                      {reativando === l.usuarioId ? "Reativando..." : "Reativar"}
                    </button>
                  ) : (
                    <Badge tone="neutral">Desativado</Badge>
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
