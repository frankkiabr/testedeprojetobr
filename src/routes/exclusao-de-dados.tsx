import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> (src/App.tsx); aqui ficam só o título e a descrição para o Google e a prévia de links. */
export const Route = createFileRoute("/exclusao-de-dados")({
  head: () => ({
    meta: [
      { title: "Exclusão e pedidos sobre dados pessoais (LGPD) · Frankkia" },
      { name: "description", content: "Peça a exclusão da sua conta, uma cópia dos seus dados ou a correção de informações. Resposta em até 15 dias." },
      { property: "og:title", content: "Exclusão e pedidos sobre dados pessoais (LGPD) · Frankkia" },
      { property: "og:description", content: "Peça a exclusão da sua conta, uma cópia dos seus dados ou a correção de informações. Resposta em até 15 dias." },
    ],
  }),
  component: () => null,
});
