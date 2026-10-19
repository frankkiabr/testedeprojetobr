import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSession } from "../session";

/** Bloqueia telas exclusivas do administrador da imobiliária. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { role } = useSession();
  return role === "admin" ? <>{children}</> : <Navigate to="/app/visao-geral" replace />;
}
