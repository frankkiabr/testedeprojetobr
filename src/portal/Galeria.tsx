import { useEffect, useState } from "react";
import { Images, X } from "lucide-react";
import { Carrossel } from "@/components/Carrossel";

/**
 * Fotos do anúncio: uma grande e até quatro menores (mesmo tamanho) ao lado.
 * Clicar em qualquer foto abre o carrossel em tela cheia, começando por ela.
 */
export function Galeria({ fotos, titulo }: { fotos: string[]; titulo: string }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const menores = fotos.slice(1, 5);
  const s = menores.length;
  const restantes = fotos.length - 1 - s;

  useEffect(() => {
    if (aberta === null) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberta(null);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", fechar);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", fechar);
    };
  }, [aberta]);

  if (!fotos.length) return null;

  // Ocupação das fotos menores na grade do computador, conforme quantas existem
  const lugar = (k: number) => {
    if (s === 1) return "sm:col-span-2 sm:row-span-2";
    if (s === 2) return "sm:col-span-2";
    if (s === 3 && k === 0) return "sm:col-span-2";
    return "";
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-2 overflow-hidden rounded-3xl sm:h-[28rem] sm:grid-rows-2">
        <button
          onClick={() => setAberta(0)}
          className={`group relative col-span-4 aspect-[4/3] overflow-hidden bg-canvas sm:aspect-auto sm:row-span-2 ${s ? "sm:col-span-2" : ""}`}
        >
          <img src={fotos[0]} alt={titulo} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" />
        </button>
        {menores.map((url, k) => (
          <button
            key={url}
            onClick={() => setAberta(k + 1)}
            className={`group relative aspect-square overflow-hidden bg-canvas sm:aspect-auto ${lugar(k)}`}
          >
            <img src={url} alt={`${titulo} - foto ${k + 2}`} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
            {k === s - 1 && restantes > 0 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/55 font-semibold text-white">+{restantes}</span>
            )}
          </button>
        ))}
      </div>
      {fotos.length > 1 && (
        <button onClick={() => setAberta(0)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          <Images className="size-4" /> Ver as {fotos.length} fotos
        </button>
      )}

      {aberta !== null && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-label="Fotos do imóvel">
          <div className="flex justify-end p-3">
            <button
              onClick={() => setAberta(null)}
              aria-label="Fechar fotos"
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="min-h-0 flex-1 px-2 pb-6 sm:px-10">
            <Carrossel fotos={fotos} inicio={aberta} inteira teclado className="h-full w-full" />
          </div>
        </div>
      )}
    </>
  );
}
