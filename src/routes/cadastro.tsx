import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Teste grátis · Frankkia" },
      { name: "description", content: "Crie sua conta na Frankkia e teste grátis por 7 dias, sem cartão. Planos para corretor autônomo e para imobiliárias de 5 a 60 corretores." },
      { property: "og:title", content: "Teste grátis · Frankkia" },
      { property: "og:description", content: "Crie sua conta na Frankkia e teste grátis por 7 dias, sem cartão. Planos para corretor autônomo e para imobiliárias de 5 a 60 corretores." },
    ],
  }),
  component: () => null,
});
