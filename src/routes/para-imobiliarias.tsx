import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/para-imobiliarias")({
  head: () => ({
    meta: [
      { title: "Frankkia para imobiliárias · Equipe, metas e comissões num só lugar" },
      { name: "description", content: "Leads, captações, vendas, ranking e comissões de toda a equipe na mesma tela, com cada corretor vendo só o que é dele. Teste grátis por 7 dias." },
      { property: "og:title", content: "Frankkia para imobiliárias · Equipe, metas e comissões num só lugar" },
      { property: "og:description", content: "Leads, captações, vendas, ranking e comissões de toda a equipe na mesma tela, com cada corretor vendo só o que é dele. Teste grátis por 7 dias." },
    ],
  }),
  component: () => null,
});
