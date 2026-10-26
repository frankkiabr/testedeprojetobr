import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Megaphone, UserRound, Users } from "lucide-react";
import { contato, pricing } from "@/content";
import { linkWhatsApp } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { useNavigate } from "react-router-dom";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Button } from "./ui";
import { CicloToggle } from "./CicloToggle";
import { mensalNoAnual, reais, totalAnual, valorPlano, type Ciclo } from "@/lib/planos";

/** Preço do cartão: no anual mostra quanto sai por mês e o total cobrado no ano. */
function Preco({ preco, ciclo, escuro = false }: { preco: string; ciclo: Ciclo; escuro?: boolean }) {
  const mensal = valorPlano(preco);
  // Centavos menores, para valores como 1.208,33 caberem no cartão
  const [inteiro, centavos] = (ciclo === "anual" ? reais(mensalNoAnual(mensal)) : preco).split(",");
  return (
    <div>
      <p className="flex items-start gap-1.5">
        <span className={`mt-2 text-lg font-medium ${escuro ? "text-bg/70" : "text-muted"}`}>R$</span>
        <span className={`font-display font-medium leading-none tracking-[-0.04em] ${ciclo === "anual" ? "text-[2.5rem]" : "text-[3rem]"}`}>
          {inteiro}
          {centavos && <span className="text-[1.5rem] tracking-[-0.02em]">,{centavos}</span>}
        </span>
        <span className={`mt-auto pb-1.5 text-sm ${escuro ? "text-bg/60" : "text-muted"}`}>/mês</span>
      </p>
      <p className={`mt-2 h-4 text-xs ${escuro ? "text-bg/60" : "text-muted"}`}>
        {ciclo === "anual" && (
          <>
            <span className="line-through opacity-70">R$ {preco}</span> · R$ {reais(totalAnual(mensal))} por ano
          </>
        )}
      </p>
    </div>
  );
}

export function Pricing() {
  const navigate = useNavigate();
  // Já chega na página de captura com o tamanho de equipe do plano escolhido
  const irPara = (equipe: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/apresentacao?equipe=${encodeURIComponent(equipe)}`);
  };
  const irCadastro = (plano: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/cadastro?plano=${encodeURIComponent(plano)}`);
  };
  // Planos grandes começam por uma conversa; os menores, pelo teste grátis
  const conversa = (plano: string) => plano === "Equipe 30" || plano === "Equipe 60";
  const solo = pricing.solo;
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");

  return (
    <section id="planos" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[76rem] px-5 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mx-auto max-w-[44rem] text-center"
        >
          <p className="type-eyebrow text-accent">{pricing.eyebrow}</p>
          <h2 className="type-title mt-3">{pricing.title}</h2>
          <p className="mx-auto mt-4 max-w-[34rem] text-muted sm:text-lg">{pricing.text}</p>
          <div className="mt-8 flex justify-center">
            <CicloToggle ciclo={ciclo} onChange={setCiclo} />
          </div>
        </motion.header>

        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 xl:grid-cols-4">
          {pricing.plans.map((p, i) => {
            const dark = !!p.highlight;
            return (
              <motion.li
                key={p.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.9, delay: i * 0.1, ease: EASE_OUT_EXPO }}
                whileHover={{ y: -6 }}
                className={`relative flex flex-col overflow-hidden rounded-[2rem] p-7 ${dark ? "bg-ink text-bg shadow-lift" : "border border-line bg-bg"}`}
              >
                {dark && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_100%_0%,rgb(47_91_234/0.45),transparent_70%)]" />
                )}
                <div className="relative flex h-full flex-col">
                  <p className="type-subtitle">{p.name}</p>
                  <div className="mt-8">
                    <Preco preco={p.price} ciclo={ciclo} escuro={dark} />
                  </div>
                  <ul className={`mt-6 space-y-2.5 text-sm ${dark ? "text-bg/75" : "text-muted"}`}>
                    <li className="flex items-start gap-2">
                      <Users className="mt-0.5 size-4 shrink-0" />
                      {p.seats}
                    </li>
                    <li className="flex items-start gap-2">
                      <Megaphone className="mt-0.5 size-4 shrink-0" />
                      {p.anuncios}
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0" />
                      Gestão da equipe, ranking e Academy
                    </li>
                  </ul>
                  <div className={`my-7 h-px ${dark ? "bg-white/10" : "bg-line"}`} />
                  <div className="mt-auto">
                    {conversa(p.name) ? (
                      <Button
                        href={linkWhatsApp(`Olá, ${contato.primeiroNome}! Quero conhecer o plano ${p.name} da Frankkia.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant={dark ? "accent" : "outline"}
                        className="w-full"
                        icon={<WhatsAppIcon className="size-[1em]" />}
                      >
                        {pricing.ctaConversa}
                      </Button>
                    ) : (
                      <Button
                        href={`/cadastro?plano=${encodeURIComponent(p.name)}`}
                        variant={dark ? "accent" : "outline"}
                        className="w-full"
                        onClick={irCadastro(p.name)}
                        trailing={<ArrowRight className="size-[1em] group-hover/button:translate-x-0.5" />}
                      >
                        {pricing.ctaTeste}
                      </Button>
                    )}
                    <a
                      href={conversa(p.name) ? `/cadastro?plano=${encodeURIComponent(p.name)}` : `/apresentacao?equipe=${encodeURIComponent(p.equipe)}`}
                      onClick={conversa(p.name) ? irCadastro(p.name) : irPara(p.equipe)}
                      className={`mt-3 block text-center text-xs underline-offset-4 hover:underline ${dark ? "text-bg/60" : "text-muted"}`}
                    >
                      {conversa(p.name) ? "ou comece um teste grátis" : "ou solicite uma demonstração"}
                    </a>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>

        {/* Corretor autônomo: plano separado, sem equipe */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
          className="mt-4 grid items-center gap-6 rounded-[2rem] border border-dashed border-line-strong bg-canvas/60 p-7 md:grid-cols-[minmax(0,1.4fr)_auto_auto] md:gap-10"
        >
          <div>
            <p className="type-eyebrow flex items-center gap-2 text-accent">
              <UserRound className="size-4" /> {solo.eyebrow}
            </p>
            <p className="type-subtitle mt-2">{solo.title}</p>
            <p className="mt-2 max-w-[34rem] text-sm text-muted">{solo.text}</p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <UserRound className="size-4" /> {solo.seats}
              </span>
              <span className="flex items-center gap-1.5">
                <Megaphone className="size-4" /> {solo.anuncios}
              </span>
            </p>
          </div>
          <Preco preco={solo.price} ciclo={ciclo} />
          <div>
            <Button
              href="/cadastro?plano=Solo"
              variant="outline"
              onClick={irCadastro("Solo")}
              trailing={<ArrowRight className="size-[1em] group-hover/button:translate-x-0.5" />}
            >
              {pricing.ctaTeste}
            </Button>
            <a
              href={`/apresentacao?equipe=${encodeURIComponent(solo.equipe)}`}
              onClick={irPara(solo.equipe)}
              className="mt-3 block text-center text-xs text-muted underline-offset-4 hover:underline"
            >
              ou solicite uma demonstração
            </a>
          </div>
        </motion.div>

        <p className="mx-auto mt-6 max-w-[48rem] text-center text-xs text-subtle">{pricing.note}</p>
      </div>
    </section>
  );
}
