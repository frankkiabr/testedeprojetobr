import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, Copy, LogIn, Mail, Search } from "lucide-react";
import { nav, site } from "@/content";
import { EASE_OUT_EXPO, scrollToId } from "@/lib/scroll";
import { Logo } from "./ui";
import { buscarTodos } from "@/portal/api";
import { cidadesDe } from "@/portal/ui";

export function Footer({ onSearch }: { onSearch: () => void }) {
  const [copied, setCopied] = useState(false);

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

  // Atalhos do portal: as cidades com mais imóveis anunciados
  const [cidades, setCidades] = useState<ReturnType<typeof cidadesDe>>([]);
  useEffect(() => {
    buscarTodos()
      .then((l) => setCidades(cidadesDe(l ?? []).slice(0, 5)))
      .catch(() => setCidades([]));
  }, []);

  return (
    <footer id="contato" className="mt-28 px-3 pb-3 sm:mt-40 sm:px-4 sm:pb-4">
      <div className="relative mx-auto max-w-[90rem] overflow-hidden rounded-panel bg-ink text-bg">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_10%_0%,rgb(47_91_234/0.35),transparent_70%)]" />
        <div className="relative mx-auto w-full max-w-[70rem] px-5 pb-8 pt-20 sm:px-8 sm:pt-28">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
            >
              <Logo className="text-[2.25rem] text-bg" />
              <p className="type-title mt-6 max-w-[30rem]">{site.slogan}</p>
              <p className="mt-4 max-w-[30rem] text-bg/60 sm:text-lg">{site.description}</p>
            </motion.div>

            <nav className="grid grid-cols-2 gap-x-10 gap-y-8 text-[0.9375rem] sm:grid-cols-[repeat(3,auto)] lg:pt-2">
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
                        className="whitespace-nowrap text-bg/80 transition-colors hover:text-bg"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link to="/sobre" className="whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
                      Sobre
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="type-eyebrow text-bg/60">Imóveis</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <a href="/imoveis" className="inline-flex items-center gap-2 whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
                      <Search className="size-4" />
                      Buscar imóveis
                    </a>
                  </li>
                  {cidades.map((c) => (
                    <li key={c.slug}>
                      <a href={`/imoveis/${c.slug}`} className="whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
                        {c.cidade} - {c.uf}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="type-eyebrow text-bg/60">Contato</h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link to="/login" className="inline-flex items-center gap-2 whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
                      <LogIn className="size-4" />
                      Acessar plataforma
                    </Link>
                  </li>
                  <li>
                    <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
                      <Mail className="size-4" />
                      Enviar e-mail
                    </a>
                  </li>
                  <li>
                    <button onClick={copyEmail} className="inline-flex items-center gap-2 whitespace-nowrap text-bg/80 transition-colors hover:text-bg">
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
            <p className="flex flex-wrap gap-x-4 gap-y-1">
              <Link to="/sobre" className="hover:text-bg/80">
                Sobre
              </Link>
              <Link to="/termos" className="hover:text-bg/80">
                Termos de Uso
              </Link>
              <Link to="/privacidade" className="hover:text-bg/80">
                Privacidade
              </Link>
              <span>{site.email}</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
