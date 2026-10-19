import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, Info, LogIn, Mail } from "lucide-react";
import { demo, nav, site } from "@/content";
import { EASE_OUT_EXPO, scrollToId } from "@/lib/scroll";
import { CampoArmadilha, useFormInteressado } from "./FormInteressado";

const field =
  "h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-[0.9375rem] text-bg outline-hidden transition-colors placeholder:text-bg/40 focus:border-accent focus:bg-white/10";

export function Footer({ onSearch }: { onSearch: () => void }) {
  const [copied, setCopied] = useState(false);
  const form = useFormInteressado("site");
  const sent = form.enviado;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponível */
    }
  };

  const sections = [{ id: "top", label: "Início" }, ...nav];

  return (
    <footer id="contato" className="mt-28 px-3 pb-3 sm:mt-40 sm:px-4 sm:pb-4">
      <div className="relative mx-auto max-w-[90rem] overflow-hidden rounded-panel bg-ink text-bg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_10%_0%,rgb(47_91_234/0.35),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-[70rem] px-5 pb-8 pt-20 sm:px-8 sm:pt-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            >
              <p className="type-eyebrow text-bg/60">{demo.eyebrow}</p>
              <h2 className="type-title mt-3 max-w-[32rem]">{demo.title}</h2>
              <p className="mt-4 max-w-[30rem] text-bg/60 sm:text-lg">{demo.text}</p>

              <form onSubmit={form.enviar} className="relative mt-8 grid gap-3 sm:grid-cols-2">
                <CampoArmadilha {...form.campo("site")} />
                <input className={field} placeholder={demo.fields.name} autoComplete="name" {...form.campo("nome")} />
                <input className={field} placeholder={demo.fields.company} autoComplete="organization" {...form.campo("imobiliaria")} />
                <input className={field} placeholder={demo.fields.email} type="email" autoComplete="email" {...form.campo("email")} />
                <input className={field} placeholder={demo.fields.phone} type="tel" autoComplete="tel" {...form.campo("telefone")} />
                <select className={`${field} sm:col-span-2 [&>option]:text-ink`} {...form.campo("equipe")}>
                  <option value="" disabled>
                    Quantidade de corretores
                  </option>
                  {demo.teamSize.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={form.enviando}
                  className="group/button mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-bg px-6 text-[0.9375rem] font-semibold text-ink transition-transform active:scale-[0.98] disabled:opacity-60 sm:col-span-2 sm:w-fit"
                >
                  {form.enviando ? "Enviando..." : demo.submit}
                  <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
                </button>
              </form>
              <motion.p
                key={sent ? "sent" : form.erro ? "erro" : "notice"}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 flex items-start gap-2 text-sm ${sent ? "text-bg" : form.erro ? "text-rose-300" : "text-bg/50"}`}
                aria-live="polite"
              >
                {sent ? <Check className="mt-0.5 size-4 shrink-0 text-verified" /> : <Info className="mt-0.5 size-4 shrink-0" />}
                {sent ? demo.submitted : (form.erro ?? demo.notice)}
              </motion.p>
            </motion.div>

            <nav className="grid grid-cols-2 gap-8 text-[0.9375rem] lg:pt-2">
              <div>
                <h3 className="type-eyebrow text-bg/60">Plataforma</h3>
                <ul className="mt-4 space-y-3">
                  {sections.map((s) => (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToId(s.id);
                        }}
                        className="text-bg/80 transition-colors hover:text-bg"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="type-eyebrow text-bg/60">Contato</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link to="/login" className="inline-flex items-center gap-2 text-bg/80 transition-colors hover:text-bg">
                      <LogIn className="size-4" />
                      Acessar plataforma
                    </Link>
                  </li>
                  <li>
                    <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 text-bg/80 transition-colors hover:text-bg">
                      <Mail className="size-4" />
                      Enviar e-mail
                    </a>
                  </li>
                  <li>
                    <button onClick={copyEmail} className="inline-flex items-center gap-2 text-bg/80 transition-colors hover:text-bg">
                      {copied ? <Check className="size-4 text-verified" /> : <Copy className="size-4" />}
                      {copied ? "Copiado!" : "Copiar e-mail"}
                    </button>
                  </li>
                </ul>
              </div>
            </nav>
          </div>

          <div className="mt-20 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-bg/50 sm:flex-row sm:justify-between">
            <p>
              © {new Date().getFullYear()} {site.name}. Todos os direitos reservados.
              <button onClick={onSearch} className="ml-3 hidden hover:text-bg/80 [@media(pointer:fine)]:inline">
                <kbd className="rounded-md border border-white/20 px-1.5 py-0.5 font-mono text-[0.6875rem] text-bg/70">Ctrl K</kbd> para buscar
              </button>
            </p>
            <p>{site.email}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
