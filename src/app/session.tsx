import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { admin, corretorDemo, corretores } from "@/data/demo";
import { frankkiaUser } from "@/data/platform";
import type { Role, Usuario } from "@/data/types";
import { userById, type Scope } from "@/data/queries";
import { aoMudar, carregarReal, usarDemo } from "@/data/sync";
import { supabase } from "@/integrations/frankkia/client";

/**
 * SESSÃO.
 * - "real": login com e-mail e senha no Supabase. O papel vem do banco (Frankkia, administrador ou corretor).
 * - "demo": perfis de exemplo escolhidos em "Explorar a demonstração" / "Ver como".
 * - "nenhuma": ninguém entrou.
 * No login real, `carregarReal` preenche as telas com os dados do banco antes de mostrá-las.
 */
export type Modo = "real" | "demo" | "nenhuma";

export type ImobiliariaConta = { id: string; nome: string; plano: string; limite: number; status: string; testeAte: string | null };

/** Teste grátis vencido: a imobiliária fica bloqueada até contratar um plano. */
export const testeEncerrado = (i: ImobiliariaConta | null | undefined) =>
  !!i && i.status === "teste" && !!i.testeAte && new Date(i.testeAte).getTime() < Date.now();
export type Conta = {
  usuarioId: string;
  email: string;
  nome: string;
  iniciais: string;
  frankkia: boolean;
  papel: "admin" | "corretor" | null;
  imobiliaria: ImobiliariaConta | null;
};

type Ctx = {
  modo: Modo;
  /** Verificando o login ou carregando os dados do banco. */
  carregando: boolean;
  /** Os dados do banco não carregaram (ex.: sem internet). */
  erroDados: boolean;
  /** Motivo técnico do erro ao carregar (mostrado em letra pequena). */
  erroDetalhe: string;
  tentarDeNovo: () => void;
  role: Role;
  /** Só na demonstração: troca o perfil de exemplo. */
  setRole: (r: Role) => void;
  user: Usuario;
  conta: Conta | null;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
  /** Abre a demonstração depois que o link /demo/<código> foi conferido no banco. */
  entrarNaDemo: (ate: string) => void;
};
const SessionContext = createContext<Ctx | null>(null);
const KEY = "frankkia-demo-role";
/** Até quando vale a demonstração liberada pela Frankkia (link /demo/<código>). */
const KEY_ATE = "frankkia-demo-ate";

/** A demonstração só abre com um link liberado pela Frankkia e dentro do prazo. */
export function demoLiberadaAte(): number | null {
  try {
    const ate = Number(localStorage.getItem(KEY_ATE));
    return ate > Date.now() ? ate : null;
  } catch {
    return null;
  }
}

function readDemoRole(): Role | null {
  try {
    if (!demoLiberadaAte()) {
      localStorage.removeItem(KEY);
      return null;
    }
    const r = localStorage.getItem(KEY);
    // O painel do criador (Frankkia) não faz parte da demonstração
    if (r === "corretor") return r;
    return "admin";
  } catch {
    /* armazenamento indisponível */
  }
  return null;
}
function writeDemoRole(r: Role | null) {
  try {
    if (r) localStorage.setItem(KEY, r);
    else {
      localStorage.removeItem(KEY);
      localStorage.removeItem(KEY_ATE);
    }
  } catch {
    /* armazenamento indisponível */
  }
}

const iniciaisDe = (nome: string, email: string) => {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length) return ((p[0][0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  return email.slice(0, 2).toUpperCase();
};

/** Primeiro acesso por convite com confirmação de e-mail: os dados do cadastro ficam guardados na conta
 *  e o convite é aceito automaticamente no primeiro login. */
async function aceitarConvitePendente(u: User) {
  const m = u.user_metadata ?? {};
  if (!m.convite_token) return;
  const { error } = await supabase.rpc("aceitar_convite", {
    p_token: m.convite_token,
    p_nome: m.nome ?? "",
    p_telefone: m.telefone ?? "",
    p_aniversario: m.aniversario || null,
    p_creci: m.creci ?? "",
    p_creci_uf: m.creci_uf ?? "",
    p_estagiario: !!m.estagiario,
  } as never);
  // aceito ou inválido: de qualquer forma, não tenta de novo
  if (!error || /CONVITE_INVALIDO|EMAIL_DIFERENTE/.test(error.message)) {
    await supabase.auth.updateUser({ data: { convite_token: null } });
  }
}

/** Cadastro pelo site (/cadastro) com confirmação de e-mail: a conta de teste é criada no primeiro login. */
async function criarContaPendente(u: User) {
  const c = u.user_metadata?.cadastro as Record<string, string> | undefined;
  if (!c) return;
  const { error } = await supabase.rpc("criar_conta_teste", {
    p_plano: c.plano ?? "",
    p_imobiliaria: c.imobiliaria ?? "",
    p_cidade: c.cidade ?? "",
    p_nome: c.nome ?? "",
    p_telefone: c.telefone ?? "",
    p_creci: c.creci ?? "",
    p_creci_uf: c.creci_uf ?? "",
  } as never);
  // criada ou recusada de vez: não tenta de novo (o motivo aparece na tela de login)
  if (!error || !/Failed to fetch|NetworkError|EMAIL_NAO_CONFIRMADO/i.test(error.message)) {
    await supabase.auth.updateUser({ data: { cadastro: null } });
  }
  if (error) guardarErroCadastro(error.message);
}

/** Motivo de um cadastro recusado no primeiro login, para a tela mostrar. */
const CHAVE_ERRO_CADASTRO = "frankkia:erro-cadastro";
function guardarErroCadastro(msg: string) {
  try {
    sessionStorage.setItem(CHAVE_ERRO_CADASTRO, msg);
  } catch {
    /* armazenamento indisponível */
  }
}
export function lerErroCadastro() {
  try {
    const m = sessionStorage.getItem(CHAVE_ERRO_CADASTRO);
    sessionStorage.removeItem(CHAVE_ERRO_CADASTRO);
    return m;
  } catch {
    return null;
  }
}

async function carregarConta(u: User): Promise<Conta> {
  await aceitarConvitePendente(u);
  await criarContaPendente(u);
  const [perfil, membros, fk] = await Promise.all([
    supabase.from("perfis").select("nome, iniciais, email").eq("id", u.id).maybeSingle(),
    supabase
      .from("membros")
      .select("papel, imobiliarias(id, nome, plano, limite_corretores, status, teste_ate)")
      .eq("usuario_id", u.id)
      .eq("ativo", true)
      .order("criado_em")
      .limit(1),
    supabase.from("frankkia_admins").select("usuario_id").eq("usuario_id", u.id).maybeSingle(),
  ]);
  const email = perfil.data?.email || u.email || "";
  const nome = perfil.data?.nome || (u.user_metadata?.nome as string) || "";
  const m = membros.data?.[0];
  const i = m?.imobiliarias as { id: string; nome: string; plano: string; limite_corretores: number; status: string; teste_ate: string | null } | null | undefined;
  return {
    usuarioId: u.id,
    email,
    nome,
    iniciais: perfil.data?.iniciais || iniciaisDe(nome, email),
    frankkia: !!fk.data,
    papel: (m?.papel as "admin" | "corretor" | undefined) ?? null,
    imobiliaria: i ? { id: i.id, nome: i.nome, plano: i.plano, limite: i.limite_corretores, status: i.status, testeAte: i.teste_ate } : null,
  };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [demoRole, setDemoRole] = useState<Role | null>(readDemoRole);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [conta, setConta] = useState<Conta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const usuarioAtual = useRef<string | null>(null);

  const carregar = useCallback(async (u: User | null, silencioso = false) => {
    if (!u) {
      setConta(null);
      setCarregando(false);
      return;
    }
    if (!silencioso) setCarregando(true);
    try {
      setConta(await carregarConta(u));
    } catch {
      setConta(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      usuarioAtual.current = data.session?.user?.id ?? null;
      setAuthUser(data.session?.user ?? null);
      carregar(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "INITIAL_SESSION" || evento === "TOKEN_REFRESHED") return;
      const u = sessao?.user ?? null;
      // mesma conta (ex.: outra aba renovou a sessão): atualiza sem esconder a tela
      const mesma = evento === "USER_UPDATED" || (evento === "SIGNED_IN" && u?.id === usuarioAtual.current);
      if (!mesma) setCarregando(true); // já marca antes de trocar o usuário, para não piscar "sem acesso"
      usuarioAtual.current = u?.id ?? null;
      setAuthUser(u);
      // fora do callback (recomendação do Supabase para não travar o login)
      setTimeout(() => carregar(u, mesma), 0);
    });
    return () => {
      vivo = false;
      sub.subscription.unsubscribe();
    };
  }, [carregar]);

  const modo: Modo = authUser ? "real" : demoRole ? "demo" : "nenhuma";

  // Papel: no login real vem do banco; na demonstração, do perfil escolhido.
  const role: Role = modo === "real" ? (conta?.frankkia ? "frankkia" : (conta?.papel ?? "corretor")) : (demoRole ?? "admin");

  const setRole = (r: Role) => {
    if (authUser) return; // no login real o papel não muda pelo seletor
    if (!demoLiberadaAte() || r === "frankkia") return; // demonstração só com link liberado, sem o painel do criador
    setDemoRole(r);
    writeDemoRole(r);
  };

  /** Link de demonstração conferido no banco: abre a demonstração até a data indicada. */
  const entrarNaDemo = (ate: string) => {
    try {
      localStorage.setItem(KEY_ATE, String(new Date(ate).getTime()));
    } catch {
      /* armazenamento indisponível */
    }
    setDemoRole("admin");
    writeDemoRole("admin");
  };

  const sair = async () => {
    setDemoRole(null);
    writeDemoRole(null);
    if (authUser) await supabase.auth.signOut();
  };

  // ---------- Dados das telas: do banco (login real) ou de exemplo (demonstração) ----------
  const [dadosProntos, setDadosProntos] = useState(false);
  const [erroDados, setErroDados] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const [, redesenhar] = useState(0);
  useEffect(() => aoMudar(() => redesenhar((n) => n + 1)), []);

  const chaveConta = conta ? `${conta.usuarioId}|${conta.papel}|${conta.frankkia}|${conta.imobiliaria?.id ?? ""}` : "";
  const carregarDados = useCallback(
    async (silencioso: boolean) => {
      if (!conta) return;
      if (!silencioso) setDadosProntos(false);
      setErroDados(false);
      try {
        await carregarReal({
          usuarioId: conta.usuarioId,
          email: conta.email,
          nome: conta.nome,
          frankkia: conta.frankkia,
          papel: conta.papel,
          imobId: conta.imobiliaria?.id ?? null,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : String(e);
        setErroDetalhe(msg.slice(0, 200));
        setErroDados(true);
        // Registra o motivo no painel Frankkia (Erros), sem dados pessoais
        supabase.rpc("registrar_erro", { p_mensagem: `Carregar dados (${conta.papel ?? "sem papel"}): ${msg}`, p_local: "login" }).then(
          () => undefined,
          () => undefined,
        );
      } finally {
        setDadosProntos(true);
      }
    },
    [chaveConta], // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (modo !== "real") {
      usarDemo();
      setDadosProntos(true);
      return;
    }
    if (carregando) return;
    if (!conta) {
      setDadosProntos(true);
      return;
    }
    carregarDados(false);
  }, [modo, carregando, carregarDados]); // eslint-disable-line react-hooks/exhaustive-deps

  // Uma gravação recusada pelo banco pede para recarregar os dados verdadeiros
  useEffect(() => {
    const f = () => carregarDados(true);
    window.addEventListener("frankkia:recarregar", f);
    return () => window.removeEventListener("frankkia:recarregar", f);
  }, [carregarDados]);

  const demoCorretor = corretores.find((c) => c.id === corretorDemo.id) ?? corretorDemo;
  let user: Usuario = role === "frankkia" ? frankkiaUser : role === "corretor" ? demoCorretor : admin;
  if (modo === "real" && conta && !conta.frankkia) {
    user = userById(conta.usuarioId) ?? {
      id: conta.usuarioId,
      imobiliariaId: conta.imobiliaria?.id ?? "",
      nome: conta.nome || conta.email,
      email: conta.email,
      papel: conta.papel ?? "corretor",
      iniciais: conta.iniciais,
    };
  }

  return (
    <SessionContext.Provider
      value={{
        modo,
        carregando: carregando || (modo === "real" && !dadosProntos),
        erroDados,
        erroDetalhe,
        tentarDeNovo: () => carregarDados(false),
        role,
        setRole,
        user,
        conta,
        sair,
        recarregar: () => carregar(authUser),
        entrarNaDemo,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

/** Escopo dos dados: o administrador vê a equipe toda; o corretor, só os próprios dados. */
export function useScope() {
  const { role, user } = useSession();
  const isAdmin = role === "admin";
  const scope: Scope = isAdmin ? {} : { corretorId: user.id };
  return { isAdmin, user, scope };
}

/** Para onde vai cada papel ao entrar. */
export const inicioDe = (r: Role) => (r === "frankkia" ? "/admin" : "/app/visao-geral");
