import { createFileRoute } from "@tanstack/react-router";

/** A página é desenhada pelo <App /> montado na raiz (src/routes/__root.tsx). */
export const Route = createFileRoute("/")({
  component: () => null,
});
