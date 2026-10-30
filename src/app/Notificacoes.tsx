import { useEffect, useRef, useState, type ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlarmClock,
  Repeat,
  Bell,
  CalendarClock,
  Cake,
  CheckCircle2,
  Globe,
  Handshake,
  LifeBuoy,
  Rocket,
  UserRoundPlus,
  Users,
} from "lucide-react";
import {
  anuncios,
  chamados,
  compromissos,
  fechamentos,
  imobiliaria,
  leads,
  transacoes,
} from "@/data/demo";
import { ehSolo, pedidoAberto, PLANOS } from "@/data/platform";
import {
  aniversariantes,
  captacaoById,
  captacaoTitulo,
  DIAS_ATRASO,
  leadsAtrasados,
  prazoRodizio,
  leadsSemAtendimento,
  pessoa,
  usoDoPlano,
} from "@/data/queries";
import { useStore } from "@/data/store";
import { dateTime, relTime } from "@/lib/format";
import { testeEncerrado, useSession } from "./session";

type Aviso = {
  id: string;
  icone: ComponentType<{ className?: string }>;
  titulo: string;
  texto: string;
  quando: string;
  to: string;
  destaque?: boolean;
};

const HORA = 3600_000;
const recente = (iso: string, horas: number) =>
  Date.now() - new Date(iso).getTime() <= horas * HORA;

/**
 * Avisos de cada perfil, calculados a partir dos dados da conta:
 * - todos: leads novos (com destaque para os do portal), compromissos das próximas 24 h, leads sem atendimento;
 * - corretor de equipe: vendas/locações registradas com a participação dele;
 * - dono da conta (administrador ou Solo): fechamentos informados para registrar, respostas da Frankkia,
 *   aniversários da equipe, teste grátis acabando, vagas e anúncios do plano no limite.
 */
function useAvisos(): Aviso[] {
  useStore();
  const { user, role, conta } = useSession();
  const admin = role === "admin";
  const solo = ehSolo(imobiliaria.plano);
  const meu = (corretorId: string) => admin || corretorId === user.id;
  const out: Aviso[] = [];

  // Só avisa do lead que chegou por outra pessoa: pelo portal ou cadastrado por outro usuário (nunca o que eu mesmo cadastrei)
  const deOutro = (l: (typeof leads)[number]) => l.origem === "Portal" || (!!l.criadoPor && l.criadoPor !== user.id);
  for (const l of leads.filter((x) => meu(x.corretorId) && deOutro(x) && recente(x.criadoEm, 72))) {
    const portal = l.origem === "Portal";
    out.push({
      id: `lead-${l.id}`,
      icone: portal ? Globe : UserRoundPlus,
      titulo: portal ? `Novo lead pelo portal: ${l.nome}` : `Novo lead: ${l.nome}`,
      texto:
        [
          l.interesse,
          admin && !solo && l.corretorId !== user.id
            ? `de ${pessoa(l.corretorId)?.nome ?? "corretor"}`
            : "",
        ]
          .filter(Boolean)
          .join(" · ") || l.origem,
      quando: l.criadoEm,
      to: "/app/negocios/leads",
      destaque: portal,
    });
  }

  const sem = leadsSemAtendimento(admin ? {} : { corretorId: user.id }).filter(
    (l) => !recente(l.criadoEm, 24),
  );
  if (sem.length)
    out.push({
      id: `sem-atendimento-${sem.length}-${sem[0].id}`,
      icone: UserRoundPlus,
      titulo: `${sem.length} ${sem.length === 1 ? "lead aguardando" : "leads aguardando"} o primeiro contato`,
      texto: "Há mais de 24 horas sem atendimento.",
      quando: sem[0].criadoEm,
      to: "/app/negocios/leads",
    });

  // Rodízio: o corretor tem prazo para o primeiro contato; o administrador vê os que voltaram sem atendimento
  for (const l of leads.filter((x) => x.corretorId === user.id && prazoRodizio(x))) {
    const ate = prazoRodizio(l)!;
    out.push({
      id: `rodizio-${l.id}-${l.atribuidoEm}`,
      icone: Repeat,
      titulo: `Lead do rodízio: ${l.nome}`,
      texto: `Faça o primeiro contato até ${ate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}, senão ele passa para o próximo.`,
      quando: l.atribuidoEm ?? l.criadoEm,
      to: `/app/negocios/leads?lead=${l.id}`,
      destaque: true,
    });
  }
  const voltaram = admin && !solo ? leads.filter((x) => x.voltouAoAdmin && x.etapa === "novo" && x.corretorId === user.id) : [];
  if (voltaram.length)
    out.push({
      id: `rodizio-voltaram-${voltaram.map((x) => x.id).join("-").slice(0, 80)}`,
      icone: Repeat,
      titulo: `${voltaram.length} ${voltaram.length === 1 ? "lead do rodízio voltou" : "leads do rodízio voltaram"} para você`,
      texto: "Ninguém da equipe fez o primeiro contato a tempo.",
      quando: voltaram[0].atribuidoEm ?? voltaram[0].criadoEm,
      to: "/app/negocios/leads",
    });

  // Leads em aberto há mais de 5 dias sem contato (o aviso volta a cada dia enquanto houver atrasados)
  const atrasados = leadsAtrasados(admin ? {} : { corretorId: user.id });
  if (atrasados.length) {
    const hoje = new Date();
    hoje.setHours(8, 0, 0, 0);
    out.push({
      id: `atrasados-${hoje.toISOString().slice(0, 10)}-${atrasados.length}`,
      icone: AlarmClock,
      titulo: `${atrasados.length} ${atrasados.length === 1 ? "lead atrasado" : "leads atrasados"}`,
      texto: `Há mais de ${DIAS_ATRASO} dias sem contato${atrasados.length === 1 ? `: ${atrasados[0].nome}` : ""}.`,
      quando: hoje.toISOString(),
      to: "/app/negocios/leads?atrasados=1",
    });
  }

  for (const c of compromissos.filter((x) => x.donoId === user.id)) {
    const ini = new Date(c.inicio).getTime();
    if (ini >= Date.now() && ini - Date.now() <= 24 * HORA)
      out.push({
        id: `agenda-${c.id}`,
        icone: CalendarClock,
        titulo: c.titulo,
        texto: dateTime(c.inicio),
        quando: c.inicio,
        to: "/app/agenda",
      });
  }

  if (!admin) {
    for (const t of transacoes.filter(
      (x) =>
        recente(x.data, 24 * 7) &&
        x.participantes.some((p) => p.tipo === "corretor" && p.refId === user.id),
    )) {
      const c = captacaoById(t.captacaoId);
      out.push({
        id: `venda-${t.id}`,
        icone: Handshake,
        titulo:
          t.tipo === "venda"
            ? "Venda registrada com a sua participação"
            : "Locação registrada com a sua participação",
        texto: c ? captacaoTitulo(c) : "Veja em Vendas e locações",
        quando: t.data,
        to: "/app/negocios/transacoes",
      });
    }
  }

  if (admin) {
    for (const f of fechamentos.filter((x) => x.status === "pendente")) {
      const c = captacaoById(f.captacaoId);
      out.push({
        id: `fechamento-${f.id}`,
        icone: Handshake,
        titulo: `${pessoa(f.corretorId)?.nome.split(" ")[0] ?? "Um corretor"} informou um fechamento`,
        texto: `${c ? captacaoTitulo(c) : "Imóvel"} · registre a ${f.tipo === "venda" ? "venda" : "locação"}`,
        quando: f.criadoEm,
        to: "/app/negocios/transacoes",
        destaque: true,
      });
    }
    for (const ch of chamados.filter((x) => x.resposta && x.status !== "aberto"))
      out.push({
        id: `chamado-${ch.id}-${ch.status}`,
        icone: LifeBuoy,
        titulo: "A Frankkia respondeu seu chamado",
        texto: ch.assunto,
        quando: ch.criadoEm,
        to: "/app/ajuda",
      });
    if (!solo)
      for (const a of aniversariantes(1).filter((x) => x.user.id !== user.id))
        out.push({
          id: `niver-${a.user.id}-${new Date().getFullYear()}`,
          icone: Cake,
          titulo:
            a.dias === 0
              ? `Hoje é aniversário de ${a.user.nome.split(" ")[0]}`
              : `Amanhã é aniversário de ${a.user.nome.split(" ")[0]}`,
          texto: "Que tal mandar uma mensagem?",
          quando: new Date().toISOString(),
          to: "/app/equipe",
        });

    const ate = conta?.imobiliaria?.testeAte;
    if (conta?.imobiliaria?.status === "teste" && ate && !testeEncerrado(conta.imobiliaria)) {
      const dias = Math.ceil((new Date(ate).getTime() - Date.now()) / (24 * HORA));
      if (dias <= 3)
        out.push({
          id: `teste-${dias}`,
          icone: Rocket,
          titulo:
            dias <= 1 ? "Seu teste grátis termina hoje" : `Faltam ${dias} dias de teste grátis`,
          texto: "Contrate um plano para continuar sem interrupção.",
          quando: new Date().toISOString(),
          to: "/app/configuracoes?aba=plano",
          destaque: true,
        });
    }
    if (!solo && usoDoPlano() >= 1 && !pedidoAberto(imobiliaria.id))
      out.push({
        id: "vagas-cheias",
        icone: Users,
        titulo: "Todas as vagas do plano estão em uso",
        texto: "Para convidar mais corretores, faça upgrade.",
        quando: new Date().toISOString(),
        to: "/app/configuracoes?aba=plano",
      });
    const publicados = anuncios.filter((a) => a.publicado).length;
    const limite = PLANOS[imobiliaria.plano]?.anuncios ?? 0;
    if (limite && publicados / limite >= 0.9)
      out.push({
        id: `anuncios-${publicados}`,
        icone: Globe,
        titulo: `${publicados} de ${limite} anúncios publicados`,
        texto:
          publicados >= limite
            ? "Limite do plano atingido no portal."
            : "Perto do limite do plano no portal.",
        quando: new Date().toISOString(),
        to: "/app/negocios/captacoes",
      });
  }

  return out
    .sort((a, b) => Number(!!b.destaque) - Number(!!a.destaque) || b.quando.localeCompare(a.quando))
    .slice(0, 30);
}

const chave = (userId: string) => `frankkia-avisos-vistos:${userId}`;
function lerVistos(userId: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(chave(userId)) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/** Sino do topo: lista os avisos e mostra quantos ainda não foram vistos. */
export function Notificacoes() {
  const { user } = useSession();
  const navigate = useNavigate();
  const avisos = useAvisos();
  const [aberto, setAberto] = useState(false);
  const [vistos, setVistos] = useState<string[]>(() => lerVistos(user.id));
  const ref = useRef<HTMLDivElement>(null);
  const novos = avisos.filter((a) => !vistos.includes(a.id)).length;

  useEffect(() => setVistos(lerVistos(user.id)), [user.id]);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) =>
      ref.current && !ref.current.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);

  const abrir = () => {
    setAberto(!aberto);
    if (!aberto && novos) {
      // Ao abrir, tudo o que está na lista passa a contar como visto
      const todos = [...new Set([...avisos.map((a) => a.id), ...vistos])].slice(0, 300);
      setTimeout(() => setVistos(todos), 1200);
      try {
        localStorage.setItem(chave(user.id), JSON.stringify(todos));
      } catch {
        /* armazenamento indisponível */
      }
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrir}
        aria-label={novos ? `Notificações (${novos} novas)` : "Notificações"}
        className="relative grid size-10 place-items-center rounded-full bg-accent-soft text-accent-deep transition hover:bg-accent/15"
      >
        <Bell className="size-[18px]" />
        {novos > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[1.125rem] place-items-center rounded-full bg-accent px-1 text-[0.625rem] font-bold leading-[1.125rem] text-white ring-2 ring-bg">
            {novos > 9 ? "9+" : novos}
          </span>
        )}
      </button>
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute -right-12 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-bg shadow-float sm:right-0"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-semibold">Notificações</p>
              {novos > 0 && (
                <span className="text-xs font-semibold text-accent">{novos} novas</span>
              )}
            </div>
            {avisos.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <CheckCircle2 className="mx-auto size-7 text-verified" />
                <p className="mt-2 text-sm font-semibold">Tudo em dia</p>
                <p className="text-xs text-muted">
                  Novos leads, compromissos e avisos do plano aparecem aqui.
                </p>
              </div>
            ) : (
              <ul className="max-h-[26rem] divide-y divide-line overflow-y-auto">
                {avisos.map((a) => {
                  const Icone = a.icone;
                  const novo = !vistos.includes(a.id);
                  return (
                    <li key={a.id}>
                      <button
                        onClick={() => {
                          setAberto(false);
                          navigate(a.to);
                        }}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-canvas ${novo ? "bg-accent-soft/40" : ""}`}
                      >
                        <span
                          className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${a.destaque ? "bg-accent text-white" : "bg-canvas text-muted"}`}
                        >
                          <Icone className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold leading-snug">
                            {a.titulo}
                          </span>
                          <span className="block truncate text-xs text-muted">{a.texto}</span>
                          <span className="mt-0.5 block text-[0.6875rem] text-subtle">
                            {relTime(a.quando)}
                          </span>
                        </span>
                        {novo && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
