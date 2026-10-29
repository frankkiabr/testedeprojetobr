import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/simulador-de-financiamento")({
  head: () => ({
    meta: [
      { title: "Simulador de financiamento imobiliário SAC e Price · Frankkia" },
      { name: "description", content: "Calcule grátis a parcela do financiamento nos sistemas SAC e Price, a renda necessária e o ITBI e cartório. Sem cadastro." },
      { property: "og:title", content: "Simulador de financiamento imobiliário SAC e Price · Frankkia" },
      { property: "og:description", content: "Calcule grátis a parcela do financiamento nos sistemas SAC e Price, a renda necessária e o ITBI e cartório. Sem cadastro." },
    ],
  }),
  component: () => null,
});
