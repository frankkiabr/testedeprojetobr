import { useEffect, useState } from "react";
import { Repeat } from "lucide-react";
import { imobiliaria } from "@/data/demo";
import { pessoa } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Usuario } from "@/data/types";
import { Avatar, Card } from "./kit";
import { BotaoSalvar, SelectField } from "./forms";

export const PRAZOS_RODIZIO = [
  { value: "", label: "Sem prazo (só distribui)" },
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "120", label: "2 horas" },
  { value: "240", label: "4 horas" },
  { value: "1440", label: "1 dia" },
];
export const prazoTexto = (min: number) => PRAZOS_RODIZIO.find((p) => p.value === String(min))?.label ?? `${min} minutos`;

function Chave({ ligado, onChange }: { ligado: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      onClick={() => onChange(!ligado)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${ligado ? "bg-accent" : "bg-line-strong"}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all ${ligado ? "left-[1.375rem]" : "left-0.5"}`} />
    </button>
  );
}

/**
 * RODÍZIO DE LEADS (Equipe): o administrador cadastra ou importa leads "no rodízio" e cada um vai para o próximo
 * corretor da fila. Com prazo, quem não fizer o primeiro contato a tempo perde a vez para o próximo; depois de
 * passar por todos, o lead volta para o administrador. Leads do portal continuam com o corretor do anúncio.
 */
export function RodizioCard({ corretores }: { corretores: Usuario[] }) {
  const { configurarRodizio, filaRodizio, version } = useStore();
  const atual = imobiliaria.rodizio ?? { ativo: false, minutos: null, fora: [] };
  const [ativo, setAtivo] = useState(atual.ativo);
  const [minutos, setMinutos] = useState(atual.minutos ? String(atual.minutos) : "30");
  const [fora, setFora] = useState<string[]>(atual.fora);
  const [proximo, setProximo] = useState<string | null>(null);

  useEffect(() => {
    if (!atual.ativo) return setProximo(null);
    filaRodizio().then((f) => setProximo(f[0] ?? null));
  }, [version, atual.ativo]); // eslint-disable-line react-hooks/exhaustive-deps

  const participantes = corretores.filter((c) => !fora.includes(c.id));
  const mudou = ativo !== atual.ativo || (minutos || null) !== (atual.minutos ? String(atual.minutos) : null) || fora.join() !== atual.fora.join();

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-semibold">
            <Repeat className="size-5 text-accent" /> Rodízio de leads
          </p>
          <p className="mt-1 text-sm text-muted">
            Ao cadastrar ou importar leads, escolha “Rodízio” e cada um vai para o próximo corretor da fila. Leads do portal continuam com o corretor do
            anúncio.
          </p>
        </div>
        <Chave ligado={ativo} onChange={setAtivo} />
      </div>

      {ativo && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-muted">Prazo para o primeiro contato</p>
            <SelectField value={minutos} onChange={setMinutos} options={PRAZOS_RODIZIO} />
            <p className="mt-1.5 text-xs text-muted">
              {minutos
                ? "Sem contato no prazo (WhatsApp, ligação, checklist ou mudança de etapa), o lead passa para o próximo. Depois de passar por todos, volta para você."
                : "O lead fica com quem recebeu, sem repasse automático."}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-muted">
              Quem participa ({participantes.length} de {corretores.length})
            </p>
            {corretores.length === 0 ? (
              <p className="rounded-2xl bg-canvas p-3 text-sm text-muted">Convide corretores para montar a fila.</p>
            ) : (
              <ul className="space-y-1.5">
                {corretores.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-canvas px-3 py-2">
                    <Avatar user={c} className="size-7 text-[0.5625rem]" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{c.nome}</span>
                    {atual.ativo && proximo === c.id && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-accent">Próximo</span>}
                    <Chave ligado={!fora.includes(c.id)} onChange={(v) => setFora((f) => (v ? f.filter((x) => x !== c.id) : [...f, c.id]))} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {(mudou || ativo) && (
        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs text-muted">{atual.ativo && proximo ? `Próximo da vez: ${pessoa(proximo).nome.split(" ")[0]}` : ""}</p>
          <BotaoSalvar disabled={!mudou || (ativo && participantes.length === 0)} onSalvar={() => configurarRodizio({ ativo, minutos: ativo && minutos ? Number(minutos) : null, fora })}>
            Salvar rodízio
          </BotaoSalvar>
        </div>
      )}
    </Card>
  );
}
