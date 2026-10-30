import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export type ItemTrilha = { rotulo: string; to?: string };

/**
 * Trilha de navegação (breadcrumb) das páginas do site: Início › Privacidade.
 * Também vai no formato que o Google entende (BreadcrumbList). O portal tem a sua em src/portal/ui.tsx.
 */
export function Trilha({ itens, className = "" }: { itens: ItemTrilha[]; className?: string }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itens.map((t, k) => ({ "@type": "ListItem", position: k + 1, name: t.rotulo, ...(t.to ? { item: `https://frankkia.com${t.to}` } : {}) })),
  };
  return (
    <nav aria-label="Você está em" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm">
        {itens.map((t, k) => (
          <li key={k} className="flex min-w-0 items-center gap-1.5">
            {k > 0 && <ChevronRight className="size-3.5 shrink-0 text-subtle" />}
            {t.to && k < itens.length - 1 ? (
              <Link to={t.to} className="truncate font-medium text-ink underline-offset-4 hover:text-accent hover:underline">
                {t.rotulo}
              </Link>
            ) : (
              <span aria-current={k === itens.length - 1 ? "page" : undefined} className="truncate text-muted">
                {t.rotulo}
              </span>
            )}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </nav>
  );
}
