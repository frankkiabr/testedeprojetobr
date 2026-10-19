import { createContext, useContext, useState, type ReactNode } from "react";
import { admin, corretorDemo } from "@/data/demo";
import type { Role, Usuario } from "@/data/types";
import type { Scope } from "@/data/queries";

/**
 * SESSÃO DE DEMONSTRAÇÃO.
 * Hoje o perfil é escolhido no seletor "Ver como". Na próxima fase, o login do Lovable Cloud
 * define o usuário e o papel (administrador ou corretor) automaticamente.
 */
type Ctx = { role: Role; setRole: (r: Role) => void; user: Usuario };
const SessionContext = createContext<Ctx | null>(null);
const KEY = "frankkia-demo-role";

function readRole(): Role {
  try {
    const r = localStorage.getItem(KEY);
    if (r === "admin" || r === "corretor" || r === "frankkia") return r;
  } catch {
    /* armazenamento indisponível */
  }
  return "admin";
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(readRole);
  const setRole = (r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* armazenamento indisponível */
    }
  };
  const user = role === "corretor" ? corretorDemo : admin;
  return <SessionContext.Provider value={{ role, setRole, user }}>{children}</SessionContext.Provider>;
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
