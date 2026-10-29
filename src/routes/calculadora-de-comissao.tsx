import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/calculadora-de-comissao")({
  head: () => ({
    meta: [
      { title: "Calculadora de comissão de corretor de imóveis · Frankkia" },
      { name: "description", content: "Calcule grátis a comissão de uma venda, a divisão em parceria e o repasse à imobiliária. Sem cadastro." },
      { property: "og:title", content: "Calculadora de comissão de corretor de imóveis · Frankkia" },
      { property: "og:description", content: "Calcule grátis a comissão de uma venda, a divisão em parceria e o repasse à imobiliária. Sem cadastro." },
    ],
  }),
  component: () => null,
});
