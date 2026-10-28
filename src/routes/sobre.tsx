import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre a Frankkia · Quem criou e para quem é" },
      { name: "description", content: "A Frankkia é uma plataforma para imobiliárias e corretores: leads, captações, agenda, equipe e portal de imóveis. Conheça a história e quem criou." },
      { property: "og:title", content: "Sobre a Frankkia · Quem criou e para quem é" },
      { property: "og:description", content: "A Frankkia é uma plataforma para imobiliárias e corretores: leads, captações, agenda, equipe e portal de imóveis. Conheça a história e quem criou." },
    ],
  }),
  component: () => null,
});
