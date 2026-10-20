import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Briefcase,
  CalendarDays,
  HelpCircle,
  LayoutGrid,
  LineChart,
  LogOut,
  Megaphone,
  Menu,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { imobiliaria } from "@/data/demo";
import { vagasUsadas } from "@/data/queries";
import { clienteById, ehSolo } from "@/data/platform";
import { useStore } from "@/data/store";
import type { Role } from "@/data/types";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { useSession } from "./session";
import { Avatar, ProgressBar } from "./kit";
import { Toaster } from "./forms";
import { UpgradeModal, UpgradeNudge } from "./upgrade";

const MENU = [
  { to: "visao-geral", label: "Visão geral", icon: LayoutGrid },
  { to: "agenda", label: "Agenda", icon: CalendarDays },
  { to: "performance", label: "Performance", icon: BarChart3 },
  { to: "negocios", label: "Negócios", icon: Briefcase },
  { to: "mercado", label: "Estudo de mercado", icon: LineChart },
  { to: "academy", label: "Academy", icon: BookOpen },
  { to: "marketing", label: "Marketing", icon: Megaphone },
  { to: "equipe", label: "Equipe", icon: Users, adminOnly: true },
];
const BOTTOM = [
  { to: "configuracoes", label: "Configurações", icon: Settings2 },
  { to: "ajuda", label: "Ajuda", icon: HelpCircle },
];

function NavItem({ to, label, icon: Icon, onClick }: { to: string; label: string; icon: typeof LayoutGrid; onClick?: () => void }) {
  return (
    <NavLink
      to={`/app/${to}`}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
          isActive ? "font-semibold text-accent-deep" : "text-muted hover:bg-canvas hover:text-ink"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-xl bg-accent-soft"
              transition={{ type: "spring", stiffness: 500, damping: 40 }}
            />
          )}
          <Icon className="relative size-[18px]" />
          <span className="relative">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useSession();
  useStore();
  const used = vagasUsadas();
  const solo = ehSolo(imobiliaria.plano);
  return (
    <div className="flex h-full flex-col px-4 pb-5">
      <Link to="/" className="flex h-16 items-center px-2">
        <Logo className="text-[1.75rem]" />
      </Link>
      <p className="mt-4 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-subtle">Seu universo</p>
      <nav className="mt-3 space-y-1">
        {MENU.filter((m) => (!m.adminOnly || role === "admin") && !(solo && m.to === "equipe")).map((m) => (
          <NavItem key={m.to} {...m} onClick={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        {role === "admin" && solo && (
          <div className="rounded-2xl bg-canvas p-4 text-xs">
            <span className="font-semibold">Plano Solo</span>
            <p className="mt-1 text-[0.6875rem] text-muted">Corretor autônomo · sem equipe</p>
          </div>
        )}
        {role === "admin" && !solo && (
          <div className="rounded-2xl bg-canvas p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Plano {imobiliaria.plano}</span>
              <span className="text-muted">
                {used} de {imobiliaria.limiteCorretores}
              </span>
            </div>
            <ProgressBar value={used / imobiliaria.limiteCorretores} className="mt-2.5 h-1.5" />
            <p className="mt-2 text-[0.6875rem] text-muted">vagas em uso (ativos + convites)</p>
            <div className="mt-3">
              <UpgradeNudge aPartirDe={0.5} compact />
            </div>
          </div>
        )}
        <nav className="space-y-1">
          {BOTTOM.map((m) => (
            <NavItem key={m.to} {...m} onClick={onNavigate} />
          ))}
        </nav>
      </div>
    </div>
  );
}

const ROLES: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "corretor", label: "Corretor" },
];

/** Seletor só da fase de demonstração: permite ver a plataforma com os olhos de cada perfil. */
export function RoleSwitcher() {
  const { role, setRole, modo } = useSession();
  const navigate = useNavigate();
  const loc = useLocation();
  if (modo !== "demo") return null;
  const change = (r: Role) => {
    setRole(r);
    if (r === "frankkia") navigate("/admin");
    else if (!loc.pathname.startsWith("/app")) navigate("/app/visao-geral");
  };
  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-subtle xl:block">Ver como</span>
      <div className="inline-flex rounded-full border border-dashed border-line-strong bg-bg p-1" title="Modo demonstração">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => change(r.value)}
            className={`relative rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              role === r.value ? "text-bg" : "text-muted hover:text-ink"
            }`}
          >
            {role === r.value && (
              <motion.span layoutId="role-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 500, damping: 38 }} />
            )}
            <span className="relative">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, role, sair } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Menu do usuário" className="rounded-full ring-offset-2 transition hover:ring-2 hover:ring-accent/30">
        <Avatar user={user} className="size-10 text-[0.8125rem]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-bg shadow-float"
          >
            <div className="border-b border-line p-4">
              <p className="font-semibold">{user.nome}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
              <p className="mt-2 text-xs font-semibold text-accent">{role === "admin" ? "Administrador" : "Corretor"}</p>
            </div>
            <div className="p-2">
              <button
                onClick={() => navigate("/app/configuracoes")}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-canvas"
              >
                <Settings2 className="size-4 text-muted" /> Configurações
              </button>
              <button
                onClick={async () => {
                  await sair();
                  navigate("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-canvas">
                <LogOut className="size-4 text-muted" /> Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppLayout() {
  const { role, modo, conta } = useSession();
  useStore();
  const loc = useLocation();
  const outlet = useOutlet();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  // No login real, nome e situação vêm da imobiliária do usuário; na demonstração, da imobiliária de exemplo.
  const nomeImob = (modo === "real" && conta?.imobiliaria?.nome) || imobiliaria.nome;
  const suspensa = modo === "real" ? conta?.imobiliaria?.status === "suspensa" : clienteById(imobiliaria.id)?.status === "suspensa";
  const [planos, setPlanos] = useState(false);
  const fimTeste = modo === "real" && conta?.imobiliaria?.status === "teste" && conta.imobiliaria.testeAte ? new Date(conta.imobiliaria.testeAte).getTime() : null;
  const diasDeTeste = fimTeste ? Math.max(1, Math.ceil((fimTeste - Date.now()) / 864e5)) : null;

  return (
    <div className="min-h-screen bg-canvas/50">
      {/* Menu lateral fixo (telas grandes) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-bg lg:block">
        <Sidebar />
      </aside>

      {/* Menu em gaveta (celular/tablet) */}
      <>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-xs lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-bg shadow-float lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            >
              <button onClick={() => setDrawer(false)} aria-label="Fechar menu" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full hover:bg-canvas">
                <X className="size-5" />
              </button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </motion.aside>
          </>
        )}
      </>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Abrir menu" className="grid size-10 place-items-center rounded-full hover:bg-canvas lg:hidden">
            <Menu className="size-5" />
          </button>
          <Link to="/" className="lg:hidden">
            <Logo className="text-xl" />
          </Link>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <div className="hidden md:block">
              <RoleSwitcher />
            </div>
            <span className="hidden text-sm text-muted xl:block">{nomeImob}</span>
            <button aria-label="Notificações" className="relative grid size-10 place-items-center rounded-full text-muted hover:bg-canvas hover:text-ink">
              <Bell className="size-[18px]" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent ring-2 ring-bg" />
            </button>
            <UserMenu />
          </div>
        </header>

        {diasDeTeste !== null && (
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-accent px-4 py-2.5 text-center text-sm font-medium text-white">
            <Sparkles className="size-4 shrink-0" />
            Teste grátis: {diasDeTeste <= 1 ? "termina hoje" : `faltam ${diasDeTeste} dias`}.
            {role === "admin" && (
              <button onClick={() => setPlanos(true)} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-accent-deep transition hover:bg-white/90">
                Contratar plano
              </button>
            )}
          </div>
        )}
        {role === "admin" && <UpgradeModal open={planos} onClose={() => setPlanos(false)} />}

        {suspensa && (
          <div className="flex items-center justify-center gap-2 bg-rose-600 px-4 py-2.5 text-center text-sm font-medium text-white">
            <AlertTriangle className="size-4 shrink-0" />
            O acesso da {nomeImob} está suspenso. Fale com a Frankkia para regularizar.
          </div>
        )}

        {/* Seletor de perfil no celular (só na demonstração) */}
        {modo === "demo" && (
          <div className="flex justify-center border-b border-line bg-bg px-4 py-2 md:hidden">
            <RoleSwitcher />
          </div>
        )}

        <main className="mx-auto w-full max-w-[84rem] px-4 py-8 sm:px-8 sm:py-10">
          {/* Só anima a entrada da página nova. Esperar a saída da anterior ("mode=wait")
              deixava a tela em branco quando o usuário trocava de aba rapidamente. */}
          <motion.div
            key={loc.pathname + role}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
          >
            {outlet}
          </motion.div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
