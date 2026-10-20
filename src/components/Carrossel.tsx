import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Carrossel de fotos: setas, pontinhos, contador e arrastar com o dedo no celular.
 * `inicio`: foto que aparece primeiro; `inteira`: mostra a foto toda (tela cheia); `teclado`: setas do teclado.
 */
export function Carrossel({
  fotos,
  className = "aspect-[16/10]",
  sobre,
  inicio = 0,
  inteira = false,
  teclado = false,
}: {
  fotos: string[];
  className?: string;
  sobre?: ReactNode;
  inicio?: number;
  inteira?: boolean;
  teclado?: boolean;
}) {
  const [i, setI] = useState(inicio);
  const [toque, setToque] = useState<number | null>(null);
  useEffect(() => {
    setI(inicio);
  }, [fotos.length, inicio]);
  const n = fotos.length;
  const ir = (d: number) => setI((x) => (x + d + n) % n);
  useEffect(() => {
    if (!teclado) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") ir(-1);
      if (e.key === "ArrowRight") ir(1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [teclado, n]);

  return (
    <div
      className={`group relative overflow-hidden ${inteira ? "" : "bg-canvas"} ${className}`}
      onTouchStart={(e) => setToque(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (toque === null) return;
        const dx = e.changedTouches[0].clientX - toque;
        if (Math.abs(dx) > 40) ir(dx < 0 ? 1 : -1);
        setToque(null);
      }}
    >
      <div className="flex h-full transition-transform duration-500 ease-out-expo" style={{ transform: `translateX(-${i * 100}%)` }}>
        {fotos.map((url, k) => (
          <img key={url} src={url} alt={`Foto ${k + 1} de ${n}`} loading={k === i ? "eager" : "lazy"} className={`h-full w-full shrink-0 ${inteira ? "object-contain" : "object-cover"}`} />
        ))}
      </div>
      {sobre}
      {n > 1 && (
        <>
          <button
            onClick={() => ir(-1)}
            aria-label="Foto anterior"
            className="absolute left-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => ir(1)}
            aria-label="Próxima foto"
            className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow-sm transition hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/70 px-2.5 py-1 text-[0.6875rem] font-semibold text-white">
            {i + 1}/{n}
          </span>
          <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
            {fotos.slice(0, 12).map((_, k) => (
              <button
                key={k}
                onClick={() => setI(k)}
                aria-label={`Ir para a foto ${k + 1}`}
                className={`size-1.5 rounded-full transition ${k === i ? "w-4 bg-white" : "bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
