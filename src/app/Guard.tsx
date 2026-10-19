import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LogOut, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/ui";
import { inicioDe, useSession } from "./session";

/** Tela neutra enquanto a sessão é verificada (evita piscar a tela de login). */
export const Carregando = () => <div className="min-h-screen bg-canvas/50" />;

/** Conta criada, mas sem acesso ativo a nenhuma imobiliária (desativada ou convite ainda não aceito). */
function SemAcesso() {
  const { conta, sair } = useSession();
  return (
    <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg p-10 text-center">
        <Link to="/" className="inline-block">
          <Logo className="text-[1.75rem]" />
        </Link>
        <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-canvas text-accent">
          <ShieldAlert className="size-6" />
        </span>
        <h1 className="type-title mt-6 !text-[1.75rem]">Sem acesso no momento</h1>
        <p className="mt-3 text-muted">
          A conta <span className="font-semibold text-ink">{conta?.email}</span> não está ligada a nenhuma imobiliária ativa. Peça um convite (ou a
          reativação do seu acesso) ao administrador da sua imobiliária.
        </p>
        <button
          onClick={() => sair()}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85"
        >
          <LogOut className="size-4" /> Sair
        </button>
      </div>
    </div>
  );
}

/** Protege a área da imobiliária ("app") e o painel do criador ("admin"). */
export function Guard({ area, children }: { area: "app" | "admin"; children: ReactNode }) {
  const { modo, carregando, role, conta } = useSession();
  const loc = useLocation();

  if (carregando) return <Carregando />;
  if (modo === "nenhuma") return <Navigate to="/login" replace state={{ de: loc.pathname + loc.search }} />;

  if (area === "admin") return role === "frankkia" ? <>{children}</> : <Navigate to={inicioDe(role)} replace />;

  if (role === "frankkia") return <Navigate to="/admin" replace />;
  if (modo === "real" && !conta?.papel) return <SemAcesso />;
  return <>{children}</>;
}
