import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  ClipboardCheck,
  FileText,
  Filter,
  Globe,
  Inbox,
  SearchX,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { captura, contato, criador, features, pricing, site, vitrine, type FeatureKey } from "@/content";
import { EASE_OUT_EXPO, startLenis } from "@/lib/scroll";
import { linkWhatsApp, origemDoAnuncio } from "@/lib/whatsapp";
import { Logo, Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FotoCriador } from "@/components/FotoCriador";

const ICONES_FUNCOES: Record<FeatureKey, LucideIcon> = {
  captacao: ClipboardCheck,
  leads: Filter,
  agenda: CalendarDays,
  relatorio: FileText,
  mercado: BarChart3,
};
const ICONES_DORES: LucideIcon[] = [Inbox, ClipboardCheck, SearchX, FileText];

const aparecer = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
};

/** Botão na cor da marca que abre o WhatsApp. */
function BotaoWhatsApp({ href, children, claro = false, className = "" }: { href: string; children: React.ReactNode; claro?: boolean; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`group/button inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-7 text-base font-semibold transition-[background-color,transform] duration-200 active:scale-[0.98] ${
        claro ? "bg-bg text-ink hover:bg-bg/90" : "bg-accent text-white hover:bg-accent-deep"
      } ${className}`}
    >
      <WhatsAppIcon className="size-5" />
      {children}
      <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
    </a>
  );
}

/**
 * PÁGINA DE CAPTURA (/conheca-a-frankkia) — destino dos anúncios do Instagram e do YouTube.
 * Todo o funil leva para o WhatsApp comercial (contato em src/content.ts).
 * Use ?utm_source=instagram (ou youtube) no link do anúncio: a mensagem do WhatsApp já diz de onde a pessoa veio.
 */
export default function Captura() {
  const { search } = useLocation();
  const origem = origemDoAnuncio(search);
  const mensagem = `Olá, ${contato.primeiroNome}! ${origem ? `Vi a Frankkia no ${origem}` : "Vi a Frankkia"} e quero conhecer a plataforma.`;
  const whatsapp = linkWhatsApp(mensagem);
  const doPlano = (plano: string) =>
    linkWhatsApp(`Olá, ${contato.primeiroNome}! ${origem ? `Vi a Frankkia no ${origem}` : "Vi a Frankkia"} e quero saber mais sobre o plano ${plano}.`);

  useEffect(() => {
    document.title = `${site.name} · Organize sua imobiliária`;
    window.scrollTo(0, 0);
    return startLenis();
  }, []);

  const menorEquipe = pricing.plans[0].price;
  // Barra fixa do celular só aparece depois que o botão principal sai da tela
  const ctaPrincipal = useRef<HTMLDivElement>(null);
  const ctaVisivel = useInView(ctaPrincipal);

  return (
    <div className="min-h-screen bg-bg pb-20 text-ink sm:pb-0">
      {/* Topo enxuto: sem menu, para não tirar a pessoa do funil */}
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-20 max-w-[76rem] items-center justify-between px-5 sm:px-8">
          <Logo className="text-[1.75rem]" />
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-bg px-4 text-sm font-semibold transition-colors hover:border-ink/30 hover:bg-canvas"
          >
            <WhatsAppIcon className="size-4 text-accent" />
            <span className="hidden sm:inline">Falar no WhatsApp</span>
            <span className="sm:hidden">WhatsApp</span>
          </a>
        </div>
      </header>

      {/* Abertura */}
      <section className="relative overflow-hidden pt-32 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgb(47_91_234/0.12),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-[56rem] px-5 text-center sm:px-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            className="type-eyebrow text-accent"
          >
            {captura.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="type-title mt-4 !text-[2.5rem] !leading-[1.04] sm:!text-[4rem]"
          >
            {captura.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="mx-auto mt-6 max-w-[38rem] text-base leading-relaxed text-muted sm:text-lg"
          >
            {captura.text}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: EASE_OUT_EXPO }}
            className="mt-9 flex flex-col items-center gap-4"
          >
            <div ref={ctaPrincipal} className="w-full sm:w-auto">
            <BotaoWhatsApp href={whatsapp} className="w-full sm:w-auto">
              {captura.cta}
            </BotaoWhatsApp>
            </div>
            <p className="text-sm text-muted">
              Prefere começar sozinho?{" "}
              <Link to="/cadastro" className="font-semibold text-ink underline underline-offset-4 hover:text-accent">
                Teste grátis
              </Link>
            </p>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted">
              {captura.garantias.map((g) => (
                <li key={g} className="flex items-center gap-1.5">
                  <Check className="size-4 text-verified" /> {g}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.45, ease: EASE_OUT_EXPO }}
          className="relative mx-auto mt-14 w-full max-w-[64rem] px-4 sm:mt-20 sm:px-8"
        >
          <div className="rounded-[20px] bg-linear-to-b from-accent-soft to-canvas p-1.5 shadow-lift ring-1 ring-line sm:rounded-[34px] sm:p-3">
            <Scaled width={DASHBOARD_SIZE.width} height={DASHBOARD_SIZE.height} className="rounded-[16px] sm:rounded-[26px]">
              <Dashboard active />
            </Scaled>
          </div>
          <p className="mt-4 text-center text-xs text-subtle">Interface demonstrativa com dados ilustrativos.</p>
        </motion.div>
      </section>

      {/* Dores */}
      <section className="pt-24 sm:pt-36">
        <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
          <motion.header {...aparecer} transition={{ duration: 0.8, ease: EASE_OUT_EXPO }} className="max-w-[40rem]">
            <p className="type-eyebrow text-accent">{captura.dores.eyebrow}</p>
            <h2 className="type-title mt-3">{captura.dores.title}</h2>
          </motion.header>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {captura.dores.items.map((d, i) => {
              const Icone = ICONES_DORES[i];
              return (
                <motion.li
                  key={d.title}
                  {...aparecer}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: EASE_OUT_EXPO }}
                  className="rounded-[1.75rem] border border-line bg-canvas/60 p-6"
                >
                  <span className="grid size-11 place-items-center rounded-2xl bg-bg text-ink shadow-soft">
                    <Icone className="size-5" />
                  </span>
                  <p className="mt-5 font-display text-lg font-semibold tracking-tight">{d.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{d.text}</p>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Solução: as funções que existem na plataforma + o portal */}
      <section className="pt-24 sm:pt-36">
        <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
          <motion.header {...aparecer} transition={{ duration: 0.8, ease: EASE_OUT_EXPO }} className="max-w-[40rem]">
            <p className="type-eyebrow text-accent">{captura.solucao.eyebrow}</p>
            <h2 className="type-title mt-3">{captura.solucao.title}</h2>
          </motion.header>
          <ul className="mt-10 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ...features.items.map((f) => ({ title: f.title, text: f.text, icon: ICONES_FUNCOES[f.key] })),
              { title: vitrine.eyebrow, text: vitrine.text, icon: Globe },
            ].map((f, i) => (
              <motion.li key={f.title} {...aparecer} transition={{ duration: 0.8, delay: (i % 3) * 0.08, ease: EASE_OUT_EXPO }} className="flex gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                  <f.icon className="size-5" />
                </span>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight">{f.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      {/* Para quem é */}
      <section className="pt-24 sm:pt-36">
        <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
          <motion.header {...aparecer} transition={{ duration: 0.8, ease: EASE_OUT_EXPO }} className="mx-auto max-w-[40rem] text-center">
            <p className="type-eyebrow text-accent">{captura.publicos.eyebrow}</p>
            <h2 className="type-title mt-3">{captura.publicos.title}</h2>
          </motion.header>
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {captura.publicos.items.map((p, i) => {
              const escuro = i === 0;
              const preco = p.planos === "Solo" ? pricing.solo.price : menorEquipe;
              return (
                <motion.li
                  key={p.title}
                  {...aparecer}
                  transition={{ duration: 0.9, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                  className={`relative flex flex-col overflow-hidden rounded-[2rem] p-7 sm:p-9 ${escuro ? "bg-ink text-bg shadow-lift" : "border border-line bg-bg"}`}
                >
                  {escuro && (
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgb(47_91_234/0.45),transparent_70%)]" />
                  )}
                  <div className="relative flex h-full flex-col">
                    <span className={`grid size-12 place-items-center rounded-2xl ${escuro ? "bg-white/10" : "bg-accent-soft text-accent"}`}>
                      {escuro ? <Building2 className="size-5" /> : <UserRound className="size-5" />}
                    </span>
                    <p className="type-subtitle mt-6">{p.title}</p>
                    <p className={`mt-2 leading-relaxed ${escuro ? "text-bg/70" : "text-muted"}`}>{p.text}</p>
                    <ul className={`mt-6 space-y-2.5 text-sm ${escuro ? "text-bg/80" : "text-muted"}`}>
                      {p.pontos.map((pt) => (
                        <li key={pt} className="flex items-start gap-2">
                          <Check className={`mt-0.5 size-4 shrink-0 ${escuro ? "text-bg" : "text-verified"}`} /> {pt}
                        </li>
                      ))}
                    </ul>
                    <div className={`my-7 h-px ${escuro ? "bg-white/10" : "bg-line"}`} />
                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4">
                      <p>
                        <span className={`block text-xs ${escuro ? "text-bg/60" : "text-muted"}`}>a partir de</span>
                        <span className="font-display text-[2rem] font-medium leading-none tracking-[-0.03em]">R$ {preco}</span>
                        <span className={`text-sm ${escuro ? "text-bg/60" : "text-muted"}`}>/mês</span>
                      </p>
                      <a
                        href={doPlano(p.planos)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors ${
                          escuro ? "bg-accent text-white hover:bg-accent-deep" : "border border-line-strong hover:border-ink/30 hover:bg-canvas"
                        }`}
                      >
                        <WhatsAppIcon className="size-4" /> Quero saber mais
                      </a>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
          <p className="mx-auto mt-5 max-w-[44rem] text-center text-xs text-subtle">
            Plano anual: 12 meses pelo preço de 10. {pricing.note}
          </p>
        </div>
      </section>

      {/* Como começar */}
      <section className="pt-24 sm:pt-36">
        <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
          <motion.header {...aparecer} transition={{ duration: 0.8, ease: EASE_OUT_EXPO }} className="max-w-[40rem]">
            <p className="type-eyebrow text-accent">{captura.passos.eyebrow}</p>
            <h2 className="type-title mt-3">{captura.passos.title}</h2>
          </motion.header>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {captura.passos.items.map((s, i) => (
              <motion.li
                key={s.title}
                {...aparecer}
                transition={{ duration: 0.8, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                className="rounded-[1.75rem] border border-line p-6"
              >
                <span className="font-mono text-sm text-accent">0{i + 1}</span>
                <p className="mt-4 font-display text-lg font-semibold tracking-tight">{s.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* Quem criou */}
      <section className="pt-24 sm:pt-36">
        <motion.div
          {...aparecer}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="mx-auto flex w-full max-w-[56rem] flex-col items-center gap-6 px-5 text-center sm:flex-row sm:px-8 sm:text-left"
        >
          <FotoCriador className="size-28 rounded-[2rem] text-[0.8rem]" />
          <div>
            <p className="type-eyebrow text-accent">Quem está por trás</p>
            <p className="type-subtitle mt-2">
              {criador.nome}, {criador.papel.toLowerCase()}
            </p>
            <p className="mt-2 text-muted">{criador.resumo}</p>
            <Link to="/sobre" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-accent">
              Conheça a história <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Chamada final */}
      <section className="px-3 pt-24 sm:px-4 sm:pt-36">
        <div className="relative mx-auto max-w-[90rem] overflow-hidden rounded-panel bg-ink text-bg">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgb(47_91_234/0.45),transparent_70%)]" />
          <motion.div
            {...aparecer}
            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            className="relative mx-auto flex max-w-[44rem] flex-col items-center px-5 py-20 text-center sm:py-28"
          >
            <UsersRound className="size-8 text-bg/60" />
            <h2 className="type-title mt-5">{captura.final.title}</h2>
            <p className="mt-3 text-bg/70 sm:text-lg">
              {captura.final.text} Respondemos pelo WhatsApp {contato.whatsappExibir}.
            </p>
            <BotaoWhatsApp href={whatsapp} claro className="mt-9 w-full sm:w-auto">
              {captura.cta}
            </BotaoWhatsApp>
          </motion.div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-[76rem] flex-col gap-2 px-5 py-8 text-xs text-subtle sm:flex-row sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
        </p>
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link to="/sobre" className="hover:text-muted">
            Sobre
          </Link>
          <Link to="/termos" className="hover:text-muted">
            Termos de Uso
          </Link>
          <Link to="/privacidade" className="hover:text-muted">
            Privacidade
          </Link>
        </p>
      </footer>

      {/* No celular, o botão do WhatsApp fica sempre à mão */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 p-3 backdrop-blur transition-transform duration-300 sm:hidden ${
          ctaVisivel ? "translate-y-full" : "translate-y-0"
        }`}
      >
        <BotaoWhatsApp href={whatsapp} className="h-12 w-full">
          {captura.cta}
        </BotaoWhatsApp>
      </div>
    </div>
  );
}
