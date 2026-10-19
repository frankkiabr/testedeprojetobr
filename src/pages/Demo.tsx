import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { Logo } from "@/components/ui";
import { useSession } from "@/app/session";
import { supabase } from "@/integrations/frankkia/client";

/**
 * ENTRADA DA DEMONSTRAÇÃO (/demo/<código>).
 * Só abre com um link liberado pela equipe Frankkia (aba "Interessados"), dentro do prazo.
 */
export default function Demo() {
  const { token = "" } = useParams();
  const { entrarNaDemo, modo } = useSession();
  const [estado, setEstado] = useState<"conferindo" | "ok" | "invalido">("conferindo");

  useEffect(() => {
    let vivo = true;
    supabase.rpc("validar_demo", { p_token: token }).then(({ data }) => {
      if (!vivo) return;
      if (data) {
        entrarNaDemo(data);
        setEstado("ok");
      } else setEstado("invalido");
    });
    return () => {
      vivo = false;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  if (estado === "ok" && modo !== "nenhuma") return <Navigate to="/app/visao-geral" replace />;

  return (
    <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg p-10 text-center">
        <Link to="/" className="inline-block">
          <Logo className="text-[1.75rem]" />
        </Link>
        {estado === "invalido" ? (
          <>
            <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-canvas text-accent">
              <Clock className="size-6" />
            </span>
            <h1 className="type-title mt-6 !text-[1.75rem]">Link de demonstração expirado</h1>
            <p className="mt-3 text-muted">Este link não é mais válido. Fale com a equipe Frankkia para receber um novo acesso.</p>
            <Link
              to="/apresentacao"
              className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85"
            >
              Falar com a Frankkia
            </Link>
          </>
        ) : (
          <p className="mt-8 text-muted">Abrindo a demonstração...</p>
        )}
      </div>
    </div>
  );
}
