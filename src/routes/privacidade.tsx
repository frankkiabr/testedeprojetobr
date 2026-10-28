import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade · Frankkia" },
      { name: "description", content: "Como a Frankkia trata dados pessoais, de acordo com a LGPD, incluindo a conexão opcional com o Google Agenda." },
      { property: "og:title", content: "Política de Privacidade · Frankkia" },
      { property: "og:description", content: "Como a Frankkia trata dados pessoais, de acordo com a LGPD, incluindo a conexão opcional com o Google Agenda." },
    ],
  }),
  component: () => null,
});
