import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AlertOctagon, Building2, Camera, Users, CalendarDays, ExternalLink, Inbox, LayoutGrid, LifeBuoy, LogOut, Menu, Rocket, X } from "lucide-react";
import { errosSistema, interessados, pedidosUpgrade, todosChamados } from "@/data/platform";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { useSession } from "../session";
import { RoleSwitcher } from "../AppLayout";
import { Avatar } from "../kit";
import { Toaster } from "../forms";

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  useStore();
  const { sair } = useSession();
  const navigate = useNavigate();
  const abertos = todosChamados().filter((c) => c.status !== "resolvido").length;
  const novos = errosSistema.filter((e) => e.status === "novo").length;
  const aLiberar = pedidosUpgrade.filter((p) => p.pagamento === "confirmado" && !p.liberado).length;
  const novosInteressados = interessados.filter((i) => i.status === "novo").length;
  const menu = [
    { to: "/admin", label: "Visão geral", icon: LayoutGrid, end: true },
    { to: "/admin/agenda", label: "Agenda", icon: CalendarDays },
    { to: "/admin/interessados", label: "Interessados", icon: Inbox, count: novosInteressados },
    { to: "/admin/imobiliarias", label: "Imobiliárias", icon: Building2 },
    { to: "/admin/corretores", label: "Corretores", icon: Users },
    { to: "/admin/upgrades", label: "Upgrades", icon: Rocket, count: aLiberar },
    { to: "/admin/chamados", label: "Chamados", icon: LifeBuoy, count: abertos },
    { to: "/admin/erros", label: "Erros do sistema", icon: AlertOctagon, count: novos, danger: true },
  ];

  return (
    <div className="flex h-full flex-col px-4 pb-5">
      <Link to="/" className="flex h-16 items-center gap-3 px-2">
        <Logo className="text-[1.75rem] text-bg" />
        <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white">Criador</span>
      </Link>
      <p className="mt-4 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-bg/40">Plataforma</p>
      <nav className="mt-3 space-y-1">
        {menu.map(({ to, label, icon: Icon, end, count, danger }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive ? "font-semibold text-bg" : "text-bg/60 hover:bg-white/5 hover:text-bg"}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="admin-active" className="absolute inset-0 rounded-xl bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
                <Icon className="relative size-[18px]" />
                <span className="relative flex-1">{label}</span>
                {!!count && (
                  <span className={`relative rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${danger ? "bg-rose-500 text-white" : "bg-accent text-white"}`}>{count}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-bg/60">
          Você vê só dados de conta e volumes de uso. Leads, imóveis e vendas das imobiliárias ficam privados.
        </div>
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-bg/60 hover:bg-white/5 hover:text-bg">
          <ExternalLink className="size-[18px]" /> Ver o site
        </Link>
        <button
          onClick={async () => {
            await sair();
            navigate("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-bg/60 hover:bg-white/5 hover:text-bg"
        >
          <LogOut className="size-[18px]" /> Sair
        </button>
      </div>
    </div>
  );
}

/** Foto da conta Frankkia no topo do painel: clique para trocar ou remover. */
function FotoDoPainel() {
  const { user } = useSession();
  const { setFotoPerfil, toast } = useStore();
  const entrada = useRef<HTMLInputElement>(null);
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const trocar = async (arquivo: File | null) => {
    setAberto(false);
    setEnviando(true);
    const erro = await setFotoPerfil(user.id, arquivo);
    setEnviando(false);
    toast(erro ?? (arquivo ? "Foto de perfil atualizada." : "Foto de perfil removida."));
  };
  return (
    <div className="relative">
      <button
        onClick={() => setAberto(!aberto)}
        title="Foto de perfil"
        className="group relative rounded-full ring-offset-2 transition hover:ring-2 hover:ring-accent/40"
      >
        <Avatar user={user} className={`size-10 bg-ink text-[0.8125rem] text-bg ${enviando ? "opacity-50" : ""}`} />
        <span className="absolute -bottom-0.5 -right-0.5 grid size-4 place-items-center rounded-full border-2 border-bg bg-ink text-bg">
          <Camera className="size-2" />
        </span>
      </button>
      {aberto && (
        <div className="absolute right-0 top-12 z-50 w-48 overflow-hidden rounded-2xl border border-line bg-bg p-1.5 shadow-float">
          <button onClick={() => entrada.current?.click()} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-canvas">
            {user.fotoUrl ? "Trocar foto" : "Adicionar foto"}
          </button>
          {user.fotoUrl && (
            <button onClick={() => trocar(null)} className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
              Remover foto
            </button>
          )}
        </div>
      )}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const arq = e.target.files?.[0];
          e.target.value = "";
          if (arq) trocar(arq);
        }}
      />
    </div>
  );
}

/** Painel do criador da Frankkia. Só abre no perfil "Frankkia". */
export function AdminLayout() {
  const { modo, user } = useSession();
  const loc = useLocation();
  const outlet = useOutlet();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-canvas/60">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-ink lg:block">
        <Sidebar />
      </aside>

      <>
        {drawer && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setDrawer(false)} />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-72 bg-ink shadow-float lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            >
              <button onClick={() => setDrawer(false)} aria-label="Fechar menu" className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-bg hover:bg-white/10">
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
          <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-semibold text-bg sm:inline">Painel do criador</span>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <div className="hidden md:block">
              <RoleSwitcher />
            </div>
            <span className="hidden text-sm text-muted xl:block">{user.email}</span>
            <FotoDoPainel />
          </div>
        </header>
        {modo === "demo" && (
          <div className="flex justify-center border-b border-line bg-bg px-4 py-2 md:hidden">
            <RoleSwitcher />
          </div>
        )}

        <main className="mx-auto w-full max-w-[84rem] px-4 py-8 sm:px-8 sm:py-10">
          {/* Só anima a entrada (sem esperar a saída), para não deixar a tela em branco em trocas rápidas. */}
          <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}>
            {outlet}
          </motion.div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
