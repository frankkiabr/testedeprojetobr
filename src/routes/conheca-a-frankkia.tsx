import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/conheca-a-frankkia")({
  head: () => ({
    meta: [
      { title: "Frankkia · Organize sua imobiliária" },
      { name: "description", content: "Leads, captações, agenda, equipe e um portal de imóveis em uma só plataforma para imobiliárias e corretores. Fale com a gente pelo WhatsApp." },
      { property: "og:title", content: "Frankkia · Organize sua imobiliária" },
      { property: "og:description", content: "Leads, captações, agenda, equipe e um portal de imóveis em uma só plataforma para imobiliárias e corretores. Fale com a gente pelo WhatsApp." },
    ],
  }),
  component: () => null,
});
