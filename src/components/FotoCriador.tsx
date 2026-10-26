import { useState } from "react";
import { criador } from "@/content";

/** Foto do criador (public/luiz-horizonte.jpg). Enquanto a foto não existir, mostra as iniciais. */
export function FotoCriador({ className = "" }: { className?: string }) {
  const [erro, setErro] = useState(false);
  const iniciais = criador.nome
    .split(" ")
    .map((p) => p[0])
    .join("");
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden bg-accent-soft font-display font-semibold text-accent ${className}`}>
      {erro ? (
        <span className="text-[2.2em] tracking-tight">{iniciais}</span>
      ) : (
        <img src={criador.foto} alt={criador.nome} onError={() => setErro(true)} className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}
