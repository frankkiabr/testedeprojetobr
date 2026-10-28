import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso · Frankkia" },
      { name: "description", content: "Termos de Uso da Frankkia: planos, teste grátis, pagamento, cancelamento, direito de arrependimento e regras do portal de imóveis." },
      { property: "og:title", content: "Termos de Uso · Frankkia" },
      { property: "og:description", content: "Termos de Uso da Frankkia: planos, teste grátis, pagamento, cancelamento, direito de arrependimento e regras do portal de imóveis." },
    ],
  }),
  component: () => null,
});
