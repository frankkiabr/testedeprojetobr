/** Peças comuns do Estudo de mercado: interruptor, opções, campos de endereço (CEP + mapa) e dados do imóvel. */
import { useEffect, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Mapa } from "@/components/Mapa";
import { UFS } from "@/data/demo";
import { listarAvaliacoes, type Avaliacao, type DadosImovel } from "@/data/avaliacoes";
import { buscarCep, localizar } from "@/lib/mapa";
import { mensagemErro } from "@/integrations/frankkia/client";
import { useStore } from "@/data/store";
import { btn, DateInput, Field, inputCls, SelectField } from "../../forms";
import { useSession } from "../../session";

/** Interruptor Sim/Não (como no BrokerApp), nas cores da Frankkia. */
export function Chave({ ligado, onChange, disabled }: { ligado: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      disabled={disabled}
      onClick={() => onChange(!ligado)}
      className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border text-[0.6875rem] font-semibold transition disabled:opacity-50 ${
        ligado ? "border-verified bg-verified-soft text-verified" : "border-line-strong bg-canvas text-subtle"
      }`}
    >
      <span className={`absolute ${ligado ? "left-2" : "right-2"}`}>{ligado ? "Sim" : "Não"}</span>
      <span className={`absolute size-5 rounded-full shadow-soft transition-all ${ligado ? "left-[calc(100%-1.4rem)] bg-verified" : "left-1 bg-bg"}`} />
    </button>
  );
}

export const OP_INFRA = [
  { value: "nao", label: "Não tem" },
  { value: "parcial", label: "Parcial" },
  { value: "completa", label: "Completa" },
];
export const OP_PORTARIA = [
  { value: "nao", label: "Não tem" },
  { value: "parcial", label: "Parcial" },
  { value: "24h", label: "24 horas" },
];
export const OP_ORIENTACAO = [
  { value: "nascente", label: "Nascente" },
  { value: "poente", label: "Poente" },
  { value: "norte", label: "Norte" },
  { value: "sul", label: "Sul" },
  { value: "mista", label: "Mista" },
];
export const OP_CONSERVACAO = [
  { value: "reformar", label: "Precisa de reforma" },
  { value: "regular", label: "Regular" },
  { value: "bom", label: "Bom" },
  { value: "otimo", label: "Ótimo" },
  { value: "novo", label: "Novo" },
];
export const OP_MOBILIA = [
  { value: "nao", label: "Sem mobília" },
  { value: "semi", label: "Semimobiliado" },
  { value: "mobiliado", label: "Mobiliado" },
];
export const rotuloDe = (op: { value: string; label: string }[], v?: string) => op.find((o) => o.value === v)?.label;

/** Número digitado no padrão brasileiro ("1.250.000", "92,5") → número; vazio → undefined. */
export const num = (s: string) => {
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};
export const txt = (n?: number) => (n === undefined ? "" : String(n));

/** Carrega os estudos (banco no login real; memória na demonstração). */
export function useEstudos() {
  const { modo } = useSession();
  const real = modo === "real";
  const { toast } = useStore();
  const [lista, setLista] = useState<Avaliacao[] | null>(null);
  const [, setVersao] = useState(0);
  useEffect(() => {
    listarAvaliacoes(real)
      .then(setLista)
      .catch((e) => {
        setLista([]);
        toast(mensagemErro(e));
      });
  }, [real]); // eslint-disable-line react-hooks/exhaustive-deps
  return { real, lista, setLista, atualizar: () => setVersao((v) => v + 1) };
}

// ---------- Endereço (CEP + mapa) ----------

export type FormEndereco = Pick<DadosImovel, "cep" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade" | "uf" | "lat" | "lng" | "dataVisita">;

export function CamposEndereco({ f, set }: { f: FormEndereco; set: (p: Partial<FormEndereco>) => void }) {
  const [buscando, setBuscando] = useState<"" | "cep" | "mapa">("");
  const [aviso, setAviso] = useState("");
  const cep = f.cep ?? "";

  const procurarCep = async () => {
    if (cep.length !== 8) return;
    setBuscando("cep");
    setAviso("");
    const r = await buscarCep(cep);
    setBuscando("");
    if (!r) return setAviso("CEP não encontrado. Preencha o endereço à mão.");
    set({ logradouro: r.logradouro, bairro: r.bairro, cidade: r.cidade, uf: r.uf });
    // Já procura no mapa com o que veio do CEP
    setBuscando("mapa");
    const p = await localizar({ logradouro: r.logradouro, bairro: r.bairro, cidade: r.cidade, uf: r.uf, cep });
    setBuscando("");
    if (p) set({ lat: p.lat, lng: p.lng });
  };

  const noMapa = async () => {
    if (!f.logradouro || !f.cidade || !f.uf) return;
    setBuscando("mapa");
    setAviso("");
    const p = await localizar({ logradouro: f.logradouro, numero: f.numero, bairro: f.bairro, cidade: f.cidade, uf: f.uf, cep: cep || undefined });
    setBuscando("");
    if (p) set({ lat: p.lat, lng: p.lng });
    else setAviso("Não achamos no mapa. Confira o endereço ou arraste o marcador depois.");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <Field label="CEP" className="w-40">
          <input
            className={inputCls}
            inputMode="numeric"
            placeholder="00000-000"
            value={cep.length > 5 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep}
            onChange={(e) => set({ cep: e.target.value.replace(/\D/g, "").slice(0, 8) })}
            onKeyDown={(e) => e.key === "Enter" && procurarCep()}
          />
        </Field>
        <button type="button" className={btn.accent} disabled={cep.length !== 8 || !!buscando} onClick={procurarCep}>
          {buscando === "cep" ? <Loader2 className="size-4 animate-spin" /> : null} Buscar CEP
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-6">
        <Field label="Logradouro" className="sm:col-span-4">
          <input className={inputCls} value={f.logradouro ?? ""} onChange={(e) => set({ logradouro: e.target.value })} />
        </Field>
        <Field label="Estado" className="sm:col-span-2">
          <SelectField value={f.uf ?? ""} onChange={(v) => set({ uf: v })} placeholder="UF" options={UFS.map((u) => ({ value: u, label: u }))} />
        </Field>
        <Field label="Cidade" className="sm:col-span-3">
          <input className={inputCls} value={f.cidade ?? ""} onChange={(e) => set({ cidade: e.target.value })} />
        </Field>
        <Field label="Bairro" className="sm:col-span-3">
          <input className={inputCls} value={f.bairro ?? ""} onChange={(e) => set({ bairro: e.target.value })} />
        </Field>
        <Field label="Número" className="sm:col-span-2">
          <input className={inputCls} value={f.numero ?? ""} onChange={(e) => set({ numero: e.target.value })} />
        </Field>
        <Field label="Complemento" className="sm:col-span-2">
          <input className={inputCls} value={f.complemento ?? ""} onChange={(e) => set({ complemento: e.target.value })} />
        </Field>
        <Field label="Data da visita" className="sm:col-span-2">
          <DateInput value={f.dataVisita ?? ""} onChange={(v) => set({ dataVisita: v })} />
        </Field>
      </div>
      {f.lat !== undefined && f.lng !== undefined ? (
        <div>
          <Mapa lat={f.lat} lng={f.lng} onMover={(p) => set({ lat: p.lat, lng: p.lng })} className="h-56 rounded-2xl" />
          <p className="mt-1.5 text-xs text-muted">Arraste o marcador para acertar a posição exata.</p>
        </div>
      ) : (
        <button type="button" className={`${btn.outline} w-full`} disabled={!f.logradouro || !f.cidade || !f.uf || !!buscando} onClick={noMapa}>
          {buscando === "mapa" ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />} Localizar no mapa
        </button>
      )}
      {aviso && <p className="text-xs text-rose-700">{aviso}</p>}
    </div>
  );
}

// ---------- Dados do imóvel ----------

export type FormImovel = Pick<
  DadosImovel,
  | "finalidade"
  | "areaM2"
  | "areaTerreno"
  | "quartos"
  | "suites"
  | "banheiros"
  | "vagas"
  | "anoConstrucao"
  | "emCondominio"
  | "infraestrutura"
  | "portaria"
  | "orientacaoSolar"
  | "conservacao"
  | "mobilia"
  | "valorAnunciado"
  | "observacoes"
>;

/** Os campos que o BrokerApp pede depois de criar o estudo; na Frankkia vêm todos de uma vez. */
export function CamposImovel({ f, set }: { f: Partial<FormImovel>; set: (p: Partial<FormImovel>) => void }) {
  // Números ficam como texto enquanto a pessoa digita
  const [t, setT] = useState(() => ({
    areaM2: txt(f.areaM2),
    areaTerreno: txt(f.areaTerreno),
    quartos: txt(f.quartos),
    suites: txt(f.suites),
    banheiros: txt(f.banheiros),
    vagas: txt(f.vagas),
    anoConstrucao: txt(f.anoConstrucao),
    valorAnunciado: txt(f.valorAnunciado),
  }));
  const numero = (k: keyof typeof t) => ({
    className: inputCls,
    inputMode: "decimal" as const,
    value: t[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setT((x) => ({ ...x, [k]: e.target.value }));
      set({ [k]: num(e.target.value) });
    },
  });
  const sel = (op: { value: string; label: string }[], k: "infraestrutura" | "portaria" | "orientacaoSolar" | "conservacao" | "mobilia") => (
    <SelectField value={(f[k] as string) ?? ""} onChange={(v) => set({ [k]: v || undefined })} placeholder="Selecione" options={op} />
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Field label="Área privativa (m²)">
          <input {...numero("areaM2")} />
        </Field>
        <Field label="Área do terreno (m²)">
          <input {...numero("areaTerreno")} />
        </Field>
        <Field label="Dormitórios">
          <input {...numero("quartos")} inputMode="numeric" />
        </Field>
        <Field label="Suítes">
          <input {...numero("suites")} inputMode="numeric" />
        </Field>
        <Field label="Banheiros">
          <input {...numero("banheiros")} inputMode="numeric" />
        </Field>
        <Field label="Vagas">
          <input {...numero("vagas")} inputMode="numeric" />
        </Field>
        <Field label="Ano de construção">
          <input {...numero("anoConstrucao")} inputMode="numeric" />
        </Field>
        <Field label="Em condomínio">
          <SelectField
            value={f.emCondominio === undefined ? "" : f.emCondominio ? "sim" : "nao"}
            onChange={(v) => set({ emCondominio: v === "" ? undefined : v === "sim" })}
            placeholder="Selecione"
            options={[
              { value: "sim", label: "Sim" },
              { value: "nao", label: "Não" },
            ]}
          />
        </Field>
        <Field label="Infraestrutura (cond.)">{sel(OP_INFRA, "infraestrutura")}</Field>
        <Field label="Portaria">{sel(OP_PORTARIA, "portaria")}</Field>
        <Field label="Orientação solar">{sel(OP_ORIENTACAO, "orientacaoSolar")}</Field>
        <Field label="Conservação">{sel(OP_CONSERVACAO, "conservacao")}</Field>
        <Field label="Mobília">{sel(OP_MOBILIA, "mobilia")}</Field>
        <Field label={f.finalidade === "locacao" ? "Aluguel pedido pelo cliente" : "Valor já anunciado pelo cliente"} className="lg:col-span-2">
          <input {...numero("valorAnunciado")} placeholder="R$" />
        </Field>
      </div>
      <Field label="O que você identificou no imóvel" hint="Até 2.750 caracteres.">
        <textarea
          className={`${inputCls} h-28 resize-y py-3`}
          maxLength={2750}
          value={f.observacoes ?? ""}
          onChange={(e) => set({ observacoes: e.target.value })}
          placeholder="Ex.: reformado em 2022, vista livre, andar alto..."
        />
      </Field>
    </div>
  );
}
