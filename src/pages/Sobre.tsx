import { Trilha } from "@/components/Trilha";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, UserRound, UsersRound } from "lucide-react";
import { contato, criador, ecosystem, site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Logo } from "@/components/ui";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { FotoCriador } from "@/components/FotoCriador";

const PUBLICOS = [
  {
    icon: Building2,
    title: "Donos e gestores de imobiliárias",
    text: "Acompanham a operação inteira: funil de leads, captações, vendas, ranking da equipe e metas do mês.",
  },
  {
    icon: UsersRound,
    title: "Corretores de equipe",
    text: "Organizam os próprios clientes, captações e visitas. Cada corretor vê só o que é dele, e a comissão fica visível só para ele e o administrador.",
  },
  {
    icon: UserRound,
    title: "Corretores autônomos",
    text: "Têm as mesmas ferramentas no plano Solo, sem equipe para gerenciar, com os imóveis publicados no portal da Frankkia.",
  },
];

const aparecer = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10%" },
  transition: { duration: 0.8, ease: EASE_OUT_EXPO },
};

/** SOBRE: o que é a Frankkia, para quem ela é e quem a criou. */
export default function Sobre() {
  useEffect(() => {
    document.title = `Sobre · ${site.name}`;
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Link to="/">
            <Logo className="text-2xl" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-24 pt-6 sm:px-8">
        <Trilha itens={[{ rotulo: "Início", to: "/" }, { rotulo: "Sobre" }]} className="mb-8 sm:mb-10" />
        {/* O que é */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
          <p className="type-eyebrow text-accent">Sobre a Frankkia</p>
          <h1 className="type-title mt-3">{site.slogan}</h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
            <p>
              A Frankkia é uma plataforma criada para o mercado imobiliário. Ela reúne em um só lugar o que hoje fica espalhado entre cadernos, planilhas
              e conversas de WhatsApp: leads, captações, proprietários, vendas e locações, agenda, desempenho da equipe e capacitação.
            </p>
            <p>
              Cada imóvel captado também pode virar um anúncio no portal da Frankkia, com página própria, fotos, mapa e contato direto com o corretor.
              Quem pede informações entra como lead no funil de quem anunciou.
            </p>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {ecosystem.modules.map(({ name, icon: Icon }) => (
              <li key={name} className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong pl-1.5 pr-4 text-sm font-medium">
                <span className="grid size-7 place-items-center rounded-full bg-accent-soft text-accent">
                  <Icon className="size-3.5" />
                </span>
                {name}
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Para quem é */}
        <motion.section {...aparecer} className="mt-20">
          <p className="type-eyebrow text-accent">Para quem é</p>
          <h2 className="type-title mt-3">Imobiliárias e corretores.</h2>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {PUBLICOS.map((p) => (
              <li key={p.title} className="rounded-[1.75rem] border border-line bg-canvas/60 p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-bg text-accent shadow-soft">
                  <p.icon className="size-5" />
                </span>
                <p className="mt-5 font-display text-lg font-semibold tracking-tight">{p.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* Quem criou */}
        <motion.section {...aparecer} className="mt-20">
          <p className="type-eyebrow text-accent">Quem criou</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-10">
            <div>
              <FotoCriador className="aspect-[4/5] w-full max-w-[12rem] rounded-[2rem] text-[1.1rem]" />
            </div>
            <div>
              <h2 className="type-title">{criador.nome}</h2>
              <p className="mt-1 text-muted">{criador.papel}</p>
              <div className="mt-6 space-y-4 leading-relaxed text-muted">
                {criador.bio.map((b) => (
                  <p key={b.slice(0, 24)}>{b}</p>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Contato */}
        <motion.section {...aparecer} className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-ink p-8 text-bg sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="font-display text-2xl font-semibold tracking-tight">Quer conhecer a Frankkia?</p>
            <p className="mt-1.5 text-bg/70">
              Fale com a Frankkia pelo WhatsApp {contato.whatsappExibir}.
            </p>
          </div>
          <a
            href={linkWhatsApp(`Olá, ${contato.primeiroNome}! Vi a página Sobre da Frankkia e quero conhecer a plataforma.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="group/button inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-white transition-[background-color,transform] hover:bg-accent-deep active:scale-[0.98]"
          >
            <WhatsAppIcon className="size-5" /> Chamar no WhatsApp
            <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
          </a>
        </motion.section>
      </main>
    </div>
  );
}
