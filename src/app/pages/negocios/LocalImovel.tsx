import { useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Mapa } from "@/components/Mapa";
import { useStore } from "@/data/store";
import type { Imovel } from "@/data/types";
import { linkGoogleMaps, localizar } from "@/lib/mapa";
import { btn } from "../../forms";

/**
 * Localização do imóvel no mapa. Sem posição salva, oferece "Localizar no mapa".
 * O marcador pode ser arrastado para acertar o ponto exato (a nova posição é salva).
 */
export function LocalImovel({ im, className = "h-56" }: { im: Imovel; className?: string }) {
  const { setLocalImovel } = useStore();
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");
  const temPonto = im.lat !== undefined && im.lng !== undefined;

  const buscar = async () => {
    setAviso("");
    setBuscando(true);
    const p = await localizar({ ...im.endereco, cep: im.cep });
    setBuscando(false);
    if (p) setLocalImovel(im.id, p.lat, p.lng);
    else setAviso("Não encontramos este endereço no mapa. Confira o endereço do imóvel.");
  };

  if (!temPonto)
    return (
      <div className="space-y-1.5">
        <button onClick={buscar} disabled={buscando} className={`${btn.outline} w-full`}>
          <MapPin className="size-4" /> {buscando ? "Localizando..." : "Localizar no mapa"}
        </button>
        {aviso && <p className="text-xs font-medium text-amber-700">{aviso}</p>}
      </div>
    );

  return (
    <div className="space-y-1.5">
      <Mapa key={im.id} lat={im.lat!} lng={im.lng!} onMover={(p) => setLocalImovel(im.id, p.lat, p.lng)} className={className} />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Arraste o marcador se precisar acertar o ponto.</span>
        <a href={linkGoogleMaps({ lat: im.lat!, lng: im.lng! })} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-accent">
          Abrir no Google Maps <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
