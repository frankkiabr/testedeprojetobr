import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Roteador do TanStack Start (modelo Lovable). As telas em si usam o react-router dentro de <App />. */
export const getRouter = () =>
  createRouter({
    routeTree,
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });
