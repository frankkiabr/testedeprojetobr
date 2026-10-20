import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { buscarVitrine, type ItemVitrine } from "@/portal/api";

const MINIMO = 3;

/**
 * Quem já anuncia na Frankkia: imobiliárias e corretores (plano Solo) com imóveis publicados no portal.
 * Cada um leva à sua página pública. Só aparece a partir de 3 clientes anunciando.
 */
export function Clientes() {
  const [itens, setItens] = useState<ItemVitrine[]>([]);
  useEffect(() => {
    buscarVitrine()
      .then((r) => setItens(r ?? []))
      .catch(() => setItens([]));
  }, []);
  // Prova social só com volume: com poucos clientes a seção mais atrapalha do que ajuda
  if (itens.length < MINIMO) return null;

  return (
    <section id="clientes" className="pt-28 sm:pt-40">
      <div className="mx-auto w-full max-w-[70rem] px-5 sm:px-8">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="max-w-2xl"
        >
          <p className="type-eyebrow text-accent">Quem já usa</p>
          <h2 className="type-title mt-3">Imobiliárias e corretores na Frankkia</h2>
          <p className="mt-4 text-muted">
            Conheça quem já anuncia com a gente e veja os imóveis de cada um.
          </p>
        </motion.header>

        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {itens.map((it, i) => (
            <motion.li
              key={`${it.tipo}-${it.slug}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.9, delay: (i % 3) * 0.1, ease: EASE_OUT_EXPO }}
            >
              <a
                href={`/${it.tipo}/${it.slug}`}
                className="group flex items-center gap-4 rounded-[1.5rem] border border-line bg-bg p-5 transition hover:-translate-y-1 hover:border-line-strong hover:shadow-soft"
              >
                <Imagem it={it} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg font-semibold tracking-tight">
                    {it.nome}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {[it.tipo === "corretor" ? "Corretor(a)" : "Imobiliária", it.cidade]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-accent">
                    {it.total} {it.total === 1 ? "imóvel anunciado" : "imóveis anunciados"}
                  </p>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-subtle transition group-hover:text-ink" />
              </a>
            </motion.li>
          ))}
        </ul>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mt-8 flex justify-center"
        >
          <a
            href="/imoveis"
            className="group/button inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[0.9375rem] font-semibold text-bg transition hover:bg-ink/85 active:scale-[0.98]"
          >
            Ver todos os imóveis
            <ArrowRight className="size-4 transition-transform duration-200 group-hover/button:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Imagem({ it }: { it: ItemVitrine }) {
  const letra = it.nome.slice(0, 1).toUpperCase();
  if (it.imagem && it.tipo === "corretor")
    return (
      <img
        src={it.imagem}
        alt={it.nome}
        loading="lazy"
        className="size-16 shrink-0 rounded-full object-cover"
      />
    );
  if (it.imagem)
    return (
      <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-line bg-bg p-2">
        <img
          src={it.imagem}
          alt={it.nome}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </span>
    );
  return (
    <span
      className={`flex size-16 shrink-0 items-center justify-center bg-accent-soft font-display text-2xl font-semibold text-accent ${it.tipo === "corretor" ? "rounded-full" : "rounded-2xl"}`}
    >
      {letra}
    </span>
  );
}
