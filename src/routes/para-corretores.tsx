import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/para-corretores")({
  head: () => ({
    meta: [
      { title: "Frankkia para corretores autônomos · Plano Solo" },
      { name: "description", content: "Leads, captações, sua página no portal de imóveis e estudo de mercado para o corretor que trabalha sozinho. Teste grátis por 7 dias." },
      { property: "og:title", content: "Frankkia para corretores autônomos · Plano Solo" },
      { property: "og:description", content: "Leads, captações, sua página no portal de imóveis e estudo de mercado para o corretor que trabalha sozinho. Teste grátis por 7 dias." },
    ],
  }),
  component: () => null,
});
