import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { site } from "@/content";
import { Logo } from "./ui";
import { Trilha } from "./Trilha";

/**
 * Moldura das páginas públicas avulsas (para imobiliárias, para corretores, simulador, calculadora, exclusão de dados).
 * `livre`: o conteúdo ocupa a largura toda e cuida das próprias margens (páginas com banner, como as por público).
 */
/** Menu de baixo das páginas institucionais e das ferramentas. */
export function RodapeLinks({ largura = "max-w-4xl" }: { largura?: string }) {
  return (
    <footer className="border-t border-line">
      <div className={`mx-auto flex ${largura} flex-wrap gap-x-5 gap-y-2 px-5 py-6 text-sm text-muted sm:px-8`}>
        <Link to="/para-imobiliarias" className="hover:text-ink">Para imobiliárias</Link>
        <Link to="/para-corretores" className="hover:text-ink">Para corretores</Link>
        <Link to="/simulador-de-financiamento" className="hover:text-ink">Simulador de financiamento</Link>
        <Link to="/calculadora-de-comissao" className="hover:text-ink">Calculadora de comissão</Link>
        <a href="/imoveis" className="hover:text-ink">Imóveis</a>
        <Link to="/privacidade" className="hover:text-ink">Privacidade</Link>
      </div>
    </footer>
  );
}

export function PaginaSimples({
  titulo,
  rotulo = titulo,
  largura = "max-w-4xl",
  livre,
  children,
}: {
  titulo: string;
  /** Nome curto da página na trilha (Início › rótulo). */
  rotulo?: string;
  largura?: string;
  livre?: boolean;
  children: ReactNode;
}) {
  const trilha = <Trilha itens={[{ rotulo: "Início", to: "/" }, { rotulo }]} />;
  useEffect(() => {
    document.title = `${titulo} · ${site.name}`;
    window.scrollTo(0, 0);
  }, [titulo]);
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line">
        <div className={`mx-auto flex h-16 ${largura} items-center justify-between px-5 sm:px-8`}>
          <Link to="/">
            <Logo className="text-2xl" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao site
          </Link>
        </div>
      </header>
      {livre ? (
        <main className="overflow-x-clip pb-24">
          <div className={`mx-auto ${largura} px-5 pt-6 sm:px-8`}>{trilha}</div>
          {children}
        </main>
      ) : (
        <main className={`mx-auto ${largura} px-5 pb-24 pt-6 sm:px-8`}>
          {trilha}
          <div className="pt-8 sm:pt-10">{children}</div>
        </main>
      )}
      <RodapeLinks largura={largura} />
    </div>
  );
}
