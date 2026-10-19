import Lenis from "lenis";

export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

let lenis: Lenis | null = null;

export function startLenis() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(2, -10 * t) });
  let id = 0;
  const raf = (time: number) => {
    lenis?.raf(time);
    id = requestAnimationFrame(raf);
  };
  id = requestAnimationFrame(raf);
  return () => {
    cancelAnimationFrame(id);
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToId(id: string) {
  if (id === "top") {
    lenis ? lenis.scrollTo(0) : window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;
  lenis ? lenis.scrollTo(el, { offset: -96 }) : el.scrollIntoView({ behavior: "smooth" });
}
