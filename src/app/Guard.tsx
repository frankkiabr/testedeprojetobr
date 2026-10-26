import { useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Hourglass, LogOut, Rocket, ShieldAlert } from "lucide-react";
import { Logo } from "@/components/ui";
import { pedidoAberto } from "@/data/platform";
import { useStore } from "@/data/store";
import { inicioDe, lerErroCadastro, testeEncerrado, useSession } from "./session";
import { mensagemErro } from "@/integrations/frankkia/client";
import { PedidoUpgradeStatus, UpgradeModal } from "./upgrade";

/** Tela neutra enquanto a sessão é verificada (evita piscar a tela de login). */
export const Carregando = () => <div className="min-h-screen bg-canvas/50" />;

/** Conta criada, mas sem acesso ativo a nenhuma imobiliária (desativada ou convite ainda não aceito). */
function SemAcesso() {
  const { conta, sair } = useSession();
  // Cadastro pelo site recusado no primeiro login (ex.: teste grátis já usado)
  const [erroCadastro] = useState(() => lerErroCadastro());
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
        {erroCadastro ? (
          <p className="mt-3 text-muted">Não foi possível criar a sua conta de teste: {mensagemErro(erroCadastro)}</p>
        ) : (
          <p className="mt-3 text-muted">
            A conta <span className="font-semibold text-ink">{conta?.email}</span> não está ligada a nenhuma imobiliária ativa. Peça um convite (ou a
            reativação do seu acesso) ao administrador da sua imobiliária.
          </p>
        )}
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

/** Fim do teste grátis: o administrador contrata um plano; o corretor é avisado. Os dados ficam guardados. */
function TesteEncerrado() {
  const { conta, sair } = useSession();
  const [planos, setPlanos] = useState(false);
  const admin = conta?.papel === "admin";
  const pedido = conta?.imobiliaria ? pedidoAberto(conta.imobiliaria.id) : undefined;
  useStore();
  return (
    <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
      <div className="w-full max-w-md rounded-3xl border border-line bg-bg p-10 text-center">
        <Link to="/" className="inline-block">
          <Logo className="text-[1.75rem]" />
        </Link>
        <span className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Hourglass className="size-6" />
        </span>
        <h1 className="type-title mt-6 !text-[1.75rem]">O teste grátis terminou</h1>
        <p className="mt-3 text-muted">
          {admin
            ? `Gostou da Frankkia? Contrate um plano para a ${conta?.imobiliaria?.nome} continuar usando. Tudo o que vocês cadastraram continua guardado.`
            : `O período de teste da ${conta?.imobiliaria?.nome} terminou. Assim que o administrador contratar um plano, seu acesso volta com todos os seus dados.`}
        </p>
        {admin && pedido && <div className="mt-6 text-left">{<PedidoUpgradeStatus />}</div>}
        {admin && !pedido && (
          <button onClick={() => setPlanos(true)} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition hover:bg-accent-deep">
            <Rocket className="size-4" /> Contratar um plano
          </button>
        )}
        <button onClick={() => sair()} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <LogOut className="size-4" /> Sair
        </button>
      </div>
      {admin && <UpgradeModal open={planos} onClose={() => setPlanos(false)} />}
    </div>
  );
}

/** Protege a área da imobiliária ("app") e o painel do criador ("admin"). */
export function Guard({ area, children }: { area: "app" | "admin"; children: ReactNode }) {
  const { modo, carregando, role, conta, erroDados, erroDetalhe, tentarDeNovo, sair } = useSession();
  const loc = useLocation();

  if (carregando) return <Carregando />;
  if (modo === "real" && erroDados)
    return (
      <div className="grid min-h-screen place-items-center bg-canvas/60 px-4">
        <div className="w-full max-w-md rounded-3xl border border-line bg-bg p-10 text-center">
          <h1 className="type-title !text-[1.75rem]">Não foi possível carregar seus dados</h1>
          <p className="mt-3 text-muted">Verifique sua conexão com a internet e tente de novo.</p>
          {erroDetalhe && <p className="mt-4 rounded-xl bg-canvas px-3 py-2 font-mono text-[0.6875rem] text-subtle">Detalhe: {erroDetalhe}</p>}
          <button onClick={tentarDeNovo} className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85">
            Tentar de novo
          </button>
          <button onClick={() => sair()} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted hover:text-ink">
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </div>
    );
  if (modo === "nenhuma") return <Navigate to="/login" replace state={{ de: loc.pathname + loc.search }} />;

  if (area === "admin") return role === "frankkia" ? <>{children}</> : <Navigate to={inicioDe(role)} replace />;

  if (role === "frankkia") return <Navigate to="/admin" replace />;
  if (modo === "real" && !conta?.papel) return <SemAcesso />;
  if (modo === "real" && testeEncerrado(conta?.imobiliaria)) return <TesteEncerrado />;
  return <>{children}</>;
}
