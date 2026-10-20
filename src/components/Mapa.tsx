import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Marcador no azul da marca (desenhado em HTML, sem depender de imagens do Leaflet). */
const pino = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2f5bea;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgb(15 26 51/.35)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/**
 * Mapa do OpenStreetMap com um marcador. Com `onMover`, o marcador pode ser arrastado para
 * acertar a posição exata do imóvel.
 */
export function Mapa({
  lat,
  lng,
  onMover,
  zoom = 16,
  className = "h-56",
}: {
  lat: number;
  lng: number;
  onMover?: (p: { lat: number; lng: number }) => void;
  zoom?: number;
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcador = useRef<L.Marker | null>(null);
  const mover = useRef(onMover);
  mover.current = onMover;

  useEffect(() => {
    if (!caixa.current) return;
    const m = L.map(caixa.current, { scrollWheelZoom: false, attributionControl: true }).setView([lat, lng], zoom);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m);
    const mk = L.marker([lat, lng], { icon: pino, draggable: !!mover.current }).addTo(m);
    mk.on("dragend", () => {
      const p = mk.getLatLng();
      mover.current?.({ lat: p.lat, lng: p.lng });
    });
    mapa.current = m;
    marcador.current = mk;
    // O mapa às vezes nasce dentro de uma janela que ainda está animando: recalcula o tamanho
    const t = setTimeout(() => m.invalidateSize(), 400);
    return () => {
      clearTimeout(t);
      m.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Posição mudou por fora (ex.: localizou de novo): move o mapa e o marcador
  useEffect(() => {
    marcador.current?.setLatLng([lat, lng]);
    mapa.current?.setView([lat, lng], mapa.current.getZoom());
  }, [lat, lng]);

  return <div ref={caixa} className={`relative z-0 overflow-hidden rounded-2xl bg-canvas ${className}`} />;
}
