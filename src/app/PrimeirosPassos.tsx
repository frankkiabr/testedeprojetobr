import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Rocket, X } from "lucide-react";
import { anuncios, captacoes, compromissos, convites, corretores, imobiliaria, leads } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useSession } from "./session";
import { Card, ProgressBar } from "./kit";

type Passo = { id: string; titulo: string; texto: string; to: string; feito: boolean };

const chaveOculto = (userId: string) => `frankkia-primeiros-passos-oculto:${userId}`;
function lerOculto(userId: string) {
  try {
    return localStorage.getItem(chaveOculto(userId)) === "1";
  } catch {
    return false;
  }
}

/**
 * "Primeiros passos" do dono da conta (administrador da imobiliária ou corretor Solo):
 * itens básicos para começar a usar a Frankkia. Cada passo se marca sozinho quando é feito.
 */
export function PrimeirosPassos() {
  const { user, role } = useSession();
  const [oculto, setOculto] = useState(() => lerOculto(user.id));
  if (role !== "admin") return null;

  const solo = ehSolo(imobiliaria.plano);
  const passos: Passo[] = [
    { id: "foto", titulo: "Coloque sua foto de perfil", texto: "Ela aparece para a equipe e nos seus anúncios.", to: "/app/configuracoes?aba=perfil", feito: !!user.fotoUrl },
    {
      id: "redes",
      titulo: "Preencha suas redes sociais",
      texto: "Instagram, Facebook e outras aparecem na sua página pública.",
      to: "/app/configuracoes?aba=perfil",
      feito: Object.values(user.redes ?? {}).some(Boolean),
    },
    { id: "imovel", titulo: "Cadastre o primeiro imóvel", texto: "Endereço, fotos e proprietário num só cadastro.", to: "/app/negocios/captacoes?novo=1", feito: captacoes.length > 0 },
    {
      id: "portal",
      titulo: "Publique um imóvel no portal",
      texto: "Abra o imóvel, vá na aba Anúncio e publique.",
      to: "/app/negocios/captacoes",
      feito: anuncios.some((a) => a.publicado),
    },
    { id: "lead", titulo: "Registre o primeiro lead", texto: "Todo cliente interessado entra no funil de atendimento.", to: "/app/negocios/leads?novo=1", feito: leads.length > 0 },
    {
      id: "agenda",
      titulo: "Agende o primeiro compromisso",
      texto: "Visitas, captações e reuniões ficam na Agenda.",
      to: "/app/agenda",
      feito: compromissos.some((c) => c.donoId === user.id),
    },
    ...(solo
      ? []
      : [
          {
            id: "equipe",
            titulo: "Adicione o primeiro membro da equipe",
            texto: "Convide seus corretores pelo e-mail.",
            to: "/app/equipe",
            feito: corretores.length > 0 || convites.length > 0,
          },
        ]),
  ];
  const feitos = passos.filter((p) => p.feito).length;
  if (oculto || feitos === passos.length) return null;

  const ocultar = () => {
    setOculto(true);
    try {
      localStorage.setItem(chaveOculto(user.id), "1");
    } catch {
      /* armazenamento indisponível */
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
      <Card className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Rocket className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-[1.0625rem] font-semibold tracking-tight">Primeiros passos</h2>
                <p className="mt-0.5 text-sm text-muted">
                  {feitos} de {passos.length} concluídos. Complete para tirar o máximo da Frankkia.
                </p>
              </div>
              <button onClick={ocultar} aria-label="Ocultar primeiros passos" title="Ocultar" className="grid size-8 shrink-0 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
                <X className="size-4" />
              </button>
            </div>
            <ProgressBar value={feitos / passos.length} className="mt-3" />
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {passos.map((p) => (
            <li key={p.id}>
              <Link
                to={p.to}
                className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${
                  p.feito ? "border-transparent bg-canvas/70" : "border-line hover:border-line-strong hover:bg-canvas"
                }`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                    p.feito ? "border-verified bg-verified text-white" : "border-line-strong bg-bg"
                  }`}
                >
                  {p.feito && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${p.feito ? "text-muted line-through decoration-subtle" : ""}`}>{p.titulo}</p>
                  {!p.feito && <p className="truncate text-xs text-muted">{p.texto}</p>}
                </div>
                {!p.feito && <ArrowRight className="size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5 group-hover:text-ink" />}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </motion.div>
  );
}
