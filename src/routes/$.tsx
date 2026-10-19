import { createFileRoute } from "@tanstack/react-router";

/**
 * Aceita qualquer endereço (/login, /app/..., /admin/..., /convite/..., /checkout/...).
 * Quem decide o que mostrar é o react-router dentro do <App /> montado na raiz.
 */
export const Route = createFileRoute("/$")({
  component: () => null,
});
