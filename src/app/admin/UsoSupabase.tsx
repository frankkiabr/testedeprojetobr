import { useEffect, useState } from "react";
import { Database, ExternalLink, HardDrive, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/frankkia/client";
import { fmtBytes } from "@/lib/files";
import { Card, CardHeader } from "../kit";
import { useSession } from "../session";

/** Limites do plano gratuito do Supabase (conferir em supabase.com/pricing se mudarem). */
const LIMITES = { banco: 500 * 1024 * 1024, arquivos: 1024 * 1024 * 1024, usuarios: 50_000 };
const PAINEL_USO = "https://supabase.com/dashboard/project/yvbbktrufoyhtiotholf/usage";

type Uso = { banco: number; arquivos: number; qtdArquivos: number; contas: number };

function Barra({ icon: Icon, titulo, usado, limite, texto }: { icon: typeof Database; titulo: string; usado: number; limite: number; texto: string }) {
  const pct = Math.min(1, usado / limite);
  const cor = pct >= 0.9 ? "bg-rose-500" : pct >= 0.7 ? "bg-amber-400" : "bg-accent";
  return (
    <li>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="size-4 text-muted" /> {titulo}
        </span>
        <span className="text-xs text-muted">{texto}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas-deep">
        <div className={`h-full rounded-full ${cor} transition-[width] duration-700`} style={{ width: `${Math.max(pct * 100, 1)}%` }} />
      </div>
      {pct >= 0.7 && (
        <p className={`mt-1.5 text-xs font-medium ${pct >= 0.9 ? "text-rose-600" : "text-amber-700"}`}>
          {pct >= 0.9 ? "Quase no limite: hora de pensar no plano pago do Supabase." : "Passou de 70% do limite gratuito."}
        </p>
      )}
    </li>
  );
}

/** Quanto do plano gratuito do Supabase a Frankkia já usa (para decidir a hora do plano pago). */
export function UsoSupabase() {
  const { modo } = useSession();
  const [uso, setUso] = useState<Uso | null>(null);

  useEffect(() => {
    if (modo !== "real") {
      // Demonstração: números de exemplo
      setUso({ banco: 38 * 1024 * 1024, arquivos: 120 * 1024 * 1024, qtdArquivos: 214, contas: 312 });
      return;
    }
    supabase.rpc("uso_supabase").then(({ data }) => {
      const r = data?.[0];
      if (r) setUso({ banco: Number(r.banco_bytes), arquivos: Number(r.arquivos_bytes), qtdArquivos: Number(r.arquivos_qtd), contas: Number(r.contas) });
    });
  }, [modo]);

  return (
    <Card>
      <CardHeader title="Uso do Supabase" subtitle="Plano gratuito. Quando alguma barra chegar perto do fim, é hora de migrar para o plano pago." />
      {uso ? (
        <ul className="space-y-5 px-6 pb-2 pt-4">
          <Barra icon={Database} titulo="Banco de dados" usado={uso.banco} limite={LIMITES.banco} texto={`${fmtBytes(uso.banco)} de ${fmtBytes(LIMITES.banco)}`} />
          <Barra
            icon={HardDrive}
            titulo="Arquivos (PDFs, logos)"
            usado={uso.arquivos}
            limite={LIMITES.arquivos}
            texto={`${fmtBytes(uso.arquivos)} de ${fmtBytes(LIMITES.arquivos)} · ${uso.qtdArquivos} arquivos`}
          />
          <Barra
            icon={UsersRound}
            titulo="Contas cadastradas"
            usado={uso.contas}
            limite={LIMITES.usuarios}
            texto={`${uso.contas.toLocaleString("pt-BR")} de ${LIMITES.usuarios.toLocaleString("pt-BR")} usuários ativos/mês`}
          />
        </ul>
      ) : (
        <p className="px-6 pt-4 text-sm text-muted">Carregando...</p>
      )}
      <a href={PAINEL_USO} target="_blank" rel="noreferrer" className="mx-6 mb-6 mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        Ver tráfego e detalhes no Supabase <ExternalLink className="size-4" />
      </a>
    </Card>
  );
}
