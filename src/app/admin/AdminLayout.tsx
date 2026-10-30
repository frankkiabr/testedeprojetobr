import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate, useOutlet } from "react-router-dom";
import { AlertOctagon, BadgeCheck, Building2, Camera, Users, CalendarDays, ExternalLink, Inbox, LayoutGrid, LifeBuoy, LogOut, Menu, Rocket, X } from "lucide-react";
import { errosSistema, interessados, pedidosUpgrade, todosChamados } from "@/data/platform";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo, LogoMark } from "@/components/ui";
import { BotaoRecolher, useMenuRecolhido } from "../menuLateral";
import { useSession } from "../session";
import { RoleSwitcher } from "../AppLayout";
import { Toaster } from "../forms";

function Sidebar({ onNavigate, recolhido }: { onNavigate?: () => void; recolhido?: boolean }) {
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
    { to: "/admin/imobiliarias", label: "Contas", icon: Building2 },
    { to: "/admin/corretores", label: "Corretores", icon: Users },
    { to: "/admin/creci", label: "CRECI", icon: BadgeCheck },
    { to: "/admin/upgrades", label: "Upgrades", icon: Rocket, count: aLiberar },
    { to: "/admin/chamados", label: "Chamados", icon: LifeBuoy, count: abertos },
    { to: "/admin/erros", label: "Erros do sistema", icon: AlertOctagon, count: novos, danger: true },
  ];

  return (
    <div className={`flex h-full flex-col pb-5 ${recolhido ? "px-3" : "px-4"}`}>
      <Link to="/" className={`flex h-16 items-center gap-3 ${recolhido ? "justify-center" : "px-2"}`}>
        {recolhido ? (
          <LogoMark className="size-9 text-lg" />
        ) : (
          <>
            <Logo className="text-[1.75rem] text-bg" />
            <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-white">Criador</span>
          </>
        )}
      </Link>
      {!recolhido && <p className="mt-4 px-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-bg/40">Plataforma</p>}
      <nav className="mt-3 space-y-1">
        {menu.map(({ to, label, icon: Icon, end, count, danger }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={recolhido ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl py-2.5 text-sm transition-colors ${recolhido ? "justify-center" : "px-3"} ${isActive ? "font-semibold text-bg" : "text-bg/60 hover:bg-white/5 hover:text-bg"}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span layoutId="admin-active" className="absolute inset-0 rounded-xl bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
                <Icon className="relative size-[18px] shrink-0" />
                {!recolhido && <span className="relative flex-1">{label}</span>}
                {!!count &&
                  (recolhido ? (
                    <span className={`absolute right-2 top-1.5 size-2 rounded-full ${danger ? "bg-rose-500" : "bg-accent"}`} />
                  ) : (
                    <span className={`relative rounded-full px-2 py-0.5 text-[0.6875rem] font-bold ${danger ? "bg-rose-500 text-white" : "bg-accent text-white"}`}>{count}</span>
                  ))}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        {!recolhido && (
          <div className="rounded-2xl bg-white/5 p-4 text-xs leading-relaxed text-bg/60">
            Você vê só dados de conta e volumes de uso. Leads, imóveis e vendas das imobiliárias ficam privados.
          </div>
        )}
        <Link
          to="/"
          title={recolhido ? "Ver o site" : undefined}
          className={`flex items-center gap-3 rounded-xl py-2.5 text-sm text-bg/60 hover:bg-white/5 hover:text-bg ${recolhido ? "justify-center" : "px-3"}`}
        >
          <ExternalLink className="size-[18px] shrink-0" /> {!recolhido && "Ver o site"}
        </Link>
        <FotoDoPainel recolhido={recolhido} />
        <button
          onClick={async () => {
            await sair();
            navigate("/login");
          }}
          title={recolhido ? "Sair" : undefined}
          className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm text-bg/60 hover:bg-white/5 hover:text-bg ${recolhido ? "justify-center" : "px-3"}`}
        >
          <LogOut className="size-[18px] shrink-0" /> {!recolhido && "Sair"}
        </button>
      </div>
    </div>
  );
}

/** Foto da conta Frankkia (aparece na saudação da visão geral): trocar ou remover pelo menu lateral. */
function FotoDoPainel({ recolhido }: { recolhido?: boolean }) {
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
        title={recolhido ? "Foto de perfil" : undefined}
        className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-sm text-bg/60 hover:bg-white/5 hover:text-bg ${recolhido ? "justify-center" : "px-3"}`}
      >
        <Camera className="size-[18px] shrink-0" /> {!recolhido && (enviando ? "Enviando foto..." : "Foto de perfil")}
      </button>
      {aberto && (
        <div className="absolute bottom-full left-0 z-50 mb-1 w-48 overflow-hidden rounded-2xl border border-line bg-bg p-1.5 text-ink shadow-float">
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
  const { recolhido, alternar } = useMenuRecolhido("frankkia.menu-painel");

  useEffect(() => {
    setDrawer(false);
    window.scrollTo(0, 0);
  }, [loc.pathname]);

  return (
    <div className="min-h-screen bg-canvas/60">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden bg-ink transition-[width] duration-300 lg:block ${recolhido ? "w-20" : "w-64"}`}>
        <Sidebar recolhido={recolhido} />
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

      <div className={`transition-[padding] duration-300 ${recolhido ? "lg:pl-20" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur-md sm:px-8">
          <button onClick={() => setDrawer(true)} aria-label="Abrir menu" className="grid size-10 place-items-center rounded-full hover:bg-canvas lg:hidden">
            <Menu className="size-5" />
          </button>
          <BotaoRecolher recolhido={recolhido} onClick={alternar} />
          <span className="hidden rounded-full bg-ink px-3 py-1 text-xs font-semibold text-bg sm:inline">Painel do criador</span>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <div className="hidden md:block">
              <RoleSwitcher />
            </div>
            <span className="hidden text-sm text-muted xl:block">{user.email}</span>
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
