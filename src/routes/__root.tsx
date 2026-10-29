import { lazy, Suspense, type ReactNode } from "react";
import {
  ClientOnly,
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import appCss from "../index.css?url";
import { ConteudoServidor } from "@/components/ConteudoServidor";
import { AvisoCookies } from "@/components/AvisoCookies";

/**
 * O app da Frankkia (site + plataforma) roda inteiro no navegador, com as próprias rotas (react-router).
 * Ele fica montado aqui na raiz, uma única vez, para nada ser recarregado ao trocar de página.
 * O TanStack Start só entrega o HTML base, as fontes e o CSS.
 */
const App = lazy(() => import("../App"));

/**
 * Exceção: as páginas públicas do portal (/imoveis, /imovel, /corretor, /imobiliaria) e a apresentação do estudo (/estudo) vêm prontas do servidor
 * (src/routes/imovel.$slug.tsx etc.), para o Google e a prévia de links do WhatsApp.
 */
const PORTAL = /^\/(imoveis(\/|$)|(imovel|corretor|imobiliaria|estudo)\/)/;

/** Páginas públicas do site: o servidor já entrega o texto principal e os links (Google, verificação do app). */
const PUBLICAS = /^\/(sobre|conheca-a-frankkia|cadastro|termos|privacidade|para-imobiliarias|para-corretores|simulador-de-financiamento|calculadora-de-comissao|exclusao-de-dados)?$/;

const TITULO = "Frankkia — Seu universo imobiliário, em um só lugar.";
const DESCRICAO =
  "Gestão, performance, capacitação e portal de imóveis em uma única plataforma para imobiliárias e corretores. Encontre imóveis à venda e para alugar.";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@300;400;500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", type: "image/png", href: "/favicon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const caminho = useRouterState({ select: (s) => s.location.pathname });
  if (PORTAL.test(caminho))
    return (
      <>
        <Outlet />
        <ClientOnly>
          <AvisoCookies />
        </ClientOnly>
      </>
    );
  const espera = PUBLICAS.test(caminho) ? <ConteudoServidor caminho={caminho} /> : <div className="min-h-screen bg-bg" />;
  return (
    <ClientOnly fallback={espera}>
      <Suspense fallback={<div className="min-h-screen bg-bg" />}>
        <App />
      </Suspense>
      <AvisoCookies />
    </ClientOnly>
  );
}
