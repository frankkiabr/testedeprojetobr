import { useCallback, useEffect, useState } from "react";
import { admin, convites as convitesDemo, imobiliaria } from "@/data/demo";
import { corretoresAtivos, corretoresInativos } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Usuario } from "@/data/types";
import { mensagemErro, supabase } from "@/integrations/supabase/client";
import { recarregarDados } from "@/data/sync";
import { useSession } from "./session";

export type ConviteEquipe = { id: string; email: string; enviadoEm: string; link: string };
export type Equipe = {
  pronto: boolean;
  plano: string;
  limite: number;
  admins: Usuario[];
  convites: ConviteEquipe[];
  ativos: Usuario[];
  inativos: Usuario[];
  /** Convida um corretor. Devolve o erro (texto) ou o link do convite. */
  convidar: (email: string) => Promise<{ erro?: string; link?: string }>;
  reenviar: (id: string) => Promise<string | null>;
  cancelar: (id: string) => Promise<void>;
  setAtivo: (usuarioId: string, ativo: boolean) => Promise<string | null>;
};

const linkDe = (token: string) => `${window.location.origin}/convite/${token}`;

/**
 * Dados da tela Equipe.
 * Login real: membros, convites e plano vêm do banco (o limite de vagas é conferido pelo próprio banco).
 * Demonstração: dados de exemplo.
 */
export function useEquipe(): Equipe {
  const store = useStore();
  const { modo, conta } = useSession();
  const imobId = conta?.imobiliaria?.id;
  const real = modo === "real" && !!imobId;

  const [dados, setDados] = useState<{ membros: Usuario[]; convites: ConviteEquipe[]; plano: string; limite: number } | null>(null);

  const carregar = useCallback(async () => {
    if (!real || !imobId) return;
    const [m, c, i] = await Promise.all([
      supabase.from("membros").select("usuario_id, papel, ativo, meta_mensal_vgv").eq("imobiliaria_id", imobId),
      supabase.from("convites").select("id, email, enviado_em, token").eq("imobiliaria_id", imobId).eq("status", "pendente").order("enviado_em"),
      supabase.from("imobiliarias").select("plano, limite_corretores").eq("id", imobId).maybeSingle(),
    ]);
    const ids = (m.data ?? []).map((x) => x.usuario_id);
    const p = ids.length ? await supabase.from("perfis").select("*").in("id", ids) : { data: [] };
    const perfil = new Map((p.data ?? []).map((x) => [x.id, x]));
    const membros: Usuario[] = (m.data ?? []).map((x) => {
      const pf = perfil.get(x.usuario_id);
      return {
        id: x.usuario_id,
        imobiliariaId: imobId,
        nome: pf?.nome || pf?.email || "Sem nome",
        email: pf?.email ?? "",
        telefone: pf?.telefone ?? undefined,
        papel: x.papel as "admin" | "corretor",
        iniciais: pf?.iniciais || (pf?.email ?? "?").slice(0, 2).toUpperCase(),
        metaMensalVGV: x.meta_mensal_vgv ?? undefined,
        ativo: x.ativo,
        aniversario: pf?.aniversario ?? undefined,
        creci: pf?.creci ?? undefined,
        creciUF: pf?.creci_uf ?? undefined,
        estagiario: pf?.estagiario ?? false,
      };
    });
    setDados({
      membros: membros.sort((a, b) => a.nome.localeCompare(b.nome)),
      convites: (c.data ?? []).map((x) => ({ id: x.id, email: x.email, enviadoEm: x.enviado_em, link: linkDe(x.token) })),
      plano: i.data?.plano ?? "",
      limite: i.data?.limite_corretores ?? 0,
    });
  }, [real, imobId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (!real) {
    return {
      pronto: true,
      plano: imobiliaria.plano,
      limite: imobiliaria.limiteCorretores,
      admins: [admin],
      convites: convitesDemo.map((c) => ({ ...c, link: `/convite/${c.id}` })),
      ativos: corretoresAtivos(),
      inativos: corretoresInativos(),
      convidar: async (email) => {
        const erro = store.invite(email);
        return erro ? { erro } : {};
      },
      reenviar: async (id) => {
        store.resendInvite(id);
        return null;
      },
      cancelar: async (id) => store.cancelInvite(id),
      setAtivo: async (id, ativo) => {
        store.setCorretorAtivo(id, ativo);
        return null;
      },
    };
  }

  const membros = dados?.membros ?? [];
  return {
    pronto: !!dados,
    plano: dados?.plano ?? "",
    limite: dados?.limite ?? 0,
    admins: membros.filter((u) => u.papel === "admin" && u.ativo),
    convites: dados?.convites ?? [],
    ativos: membros.filter((u) => u.papel === "corretor" && u.ativo),
    inativos: membros.filter((u) => u.papel === "corretor" && !u.ativo),
    convidar: async (bruto) => {
      const email = bruto.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { erro: "Digite um e-mail válido." };
      if (membros.some((u) => u.email.toLowerCase() === email && u.ativo)) return { erro: "Este e-mail já faz parte da equipe." };
      const { data, error } = await supabase
        .from("convites")
        .insert({ imobiliaria_id: imobId!, email, papel: "corretor", criado_por: conta!.usuarioId })
        .select("token")
        .single();
      if (error) return { erro: error.code === "23505" ? "Já existe um convite pendente para este e-mail." : mensagemErro(error) };
      await carregar();
      recarregarDados();
      return { link: linkDe(data.token) };
    },
    reenviar: async (id) => dados?.convites.find((c) => c.id === id)?.link ?? null,
    cancelar: async (id) => {
      await supabase.from("convites").update({ status: "cancelado" }).eq("id", id);
      await carregar();
      recarregarDados();
    },
    setAtivo: async (usuarioId, ativo) => {
      const { error } = await supabase.from("membros").update({ ativo }).eq("imobiliaria_id", imobId!).eq("usuario_id", usuarioId);
      await carregar();
      recarregarDados();
      return error ? mensagemErro(error) : null;
    },
  };
}
