import { NavLink, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgeDollarSign, Building2, ClipboardList, Handshake, UserRound, Users } from "lucide-react";
import { imoveis, parceiros } from "@/data/demo";
import { captacoesOf, fechamentosPendentes, leadsOf, proprietariosOf, transacoesOf } from "@/data/queries";
import { useStore } from "@/data/store";
import { useScope } from "../../session";
import { PageHeader, stagger } from "../../kit";

/** Cabeçalho de Negócios com as abas. */
export default function NegociosLayout() {
  useStore();
  const { scope, isAdmin } = useScope();
  const pendentes = fechamentosPendentes(isAdmin ? {} : scope).length;
  const tabs = [
    { to: "leads", label: "Leads", icon: Users, count: leadsOf(scope).length },
    { to: "captacoes", label: "Captações", icon: ClipboardList, count: captacoesOf(scope).filter((c) => c.status === "ativa").length },
    { to: "imoveis", label: "Imóveis", icon: Building2, count: imoveis.length },
    { to: "proprietarios", label: "Proprietários", icon: UserRound, count: proprietariosOf(scope).length },
    { to: "transacoes", label: "Vendas e locações", icon: BadgeDollarSign, count: transacoesOf(scope).length, alert: pendentes },
    ...(isAdmin ? [{ to: "parceiros", label: "Parceiros", icon: Handshake, count: parceiros.length }] : []),
  ];

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader
          title="Negócios"
          subtitle={isAdmin ? "Leads, captações, imóveis, proprietários, vendas e locações de toda a equipe." : "Seus leads, captações, proprietários, vendas e locações."}
        />
      </motion.div>
      <motion.nav {...stagger(1)} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-2xl border border-line bg-bg p-1.5">
          {tabs.map(({ to, label, icon: Icon, count, ...rest }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? "text-bg" : "text-muted hover:text-ink"}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="negocios-tab" className="absolute inset-0 rounded-xl bg-ink" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                  <Icon className="relative size-4" />
                  <span className="relative">{label}</span>
                  <span className={`relative rounded-full px-2 py-0.5 text-[0.6875rem] ${isActive ? "bg-white/15" : "bg-canvas"}`}>{count}</span>
                  {"alert" in rest && !!rest.alert && (
                    <span className="relative grid size-5 place-items-center rounded-full bg-amber-400 text-[0.625rem] font-bold text-amber-950" title="Fechamentos aguardando registro">
                      {rest.alert}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </motion.nav>
      <Outlet />
    </div>
  );
}
