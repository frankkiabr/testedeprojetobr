import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Globe, ImagePlus, Info, Loader2, Star, Trash2 } from "lucide-react";
import { anuncios, CARACTERISTICAS, imobiliaria } from "@/data/demo";
import { PLANOS } from "@/data/platform";
import { anuncioDe, useStore } from "@/data/store";
import type { Captacao } from "@/data/types";
import { brl } from "@/lib/format";
import { BotaoSalvar, btn, Field, inputCls, mascaraMoeda, moeda } from "../../forms";
import { valorLabel } from "./shared";

const numero = (s: string) => (s.trim() === "" ? undefined : Math.max(0, Math.min(50, Math.round(Number(s.replace(/\D/g, "")) || 0))));
const dinheiro = (s: string) => {
  const n = Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return s.trim() === "" || !Number.isFinite(n) ? undefined : n;
};

/** Aba "Anúncio" da captação: fotos, textos e características; publicar no portal da Frankkia. */
export function AnuncioEditor({ captacao, onPublicado }: { captacao: Captacao; onPublicado?: () => void }) {
  const store = useStore();
  const a = anuncioDe(captacao.id);
  const input = useRef<HTMLInputElement>(null);
  const inicial = () => ({
    titulo: a.titulo,
    descricao: a.descricao,
    quartos: a.quartos?.toString() ?? "",
    suites: a.suites?.toString() ?? "",
    banheiros: a.banheiros?.toString() ?? "",
    vagas: a.vagas?.toString() ?? "",
    condominio: moeda(a.condominio),
    iptu: moeda(a.iptu),
    caracteristicas: [...a.caracteristicas],
  });
  const [f, setF] = useState(inicial);
  const [enviando, setEnviando] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [autorizado, setAutorizado] = useState(a.publicado);
  useEffect(() => {
    setF(inicial());
    setAutorizado(a.publicado);
    setAviso(null);
  }, [captacao.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const limite = PLANOS[imobiliaria.plano]?.anuncios ?? 0;
  const publicados = anuncios.filter((x) => x.publicado).length;
  // Vendido ou alugado: o banco tira do portal sozinho, então não há o que publicar nem retirar
  const fechada = captacao.status !== "ativa";
  const noAr = a.publicado && !fechada;
  const mudou = JSON.stringify(f) !== JSON.stringify(inicial());

  const salvar = () =>
    store.salvarAnuncio(captacao.id, {
      titulo: f.titulo.trim(),
      descricao: f.descricao.trim(),
      quartos: numero(f.quartos),
      suites: numero(f.suites),
      banheiros: numero(f.banheiros),
      vagas: numero(f.vagas),
      condominio: dinheiro(f.condominio),
      iptu: dinheiro(f.iptu),
      caracteristicas: f.caracteristicas,
    });

  const enviarFotos = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setAviso(null);
    setEnviando(true);
    const r = await store.adicionarFotos(captacao.id, [...lista].filter((x) => x.type.startsWith("image/")));
    setEnviando(false);
    if (r) setAviso(r);
  };

  const publicar = async (sim: boolean) => {
    setAviso(null);
    if (sim && mudou) salvar();
    setPublicando(true);
    const r = await store.publicarAnuncio(captacao.id, sim);
    setPublicando(false);
    if (r) setAviso(r);
    else if (sim) onPublicado?.(); // publicado: fecha a janela e o aviso de confirmação fica na tela
  };

  const campo = (k: "quartos" | "suites" | "banheiros" | "vagas", label: string) => (
    <Field label={label}>
      <input className={inputCls} inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
    </Field>
  );

  return (
    <div className="mt-4 space-y-6">
      {/* Situação */}
      <div className={`flex flex-wrap items-center gap-3 rounded-2xl p-4 ${noAr ? "bg-verified-soft" : "bg-canvas"}`}>
        {noAr ? <CheckCircle2 className="size-5 text-verified" /> : <Globe className="size-5 text-muted" />}
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">
            {fechada
              ? `Fora do portal: imóvel ${captacao.status === "vendida" ? "vendido" : "alugado"}`
              : noAr
                ? "Publicado no portal"
                : "Rascunho (não publicado)"}
          </p>
          <p className="text-xs text-muted">
            {fechada
              ? "Imóveis vendidos ou alugados saem do portal automaticamente."
              : `${publicados} de ${limite} anúncios publicados no plano ${imobiliaria.plano}.`}
          </p>
        </div>
        {noAr && a.slug && !a.slug.startsWith("exemplo-") && (
          <a href={`/imovel/${a.slug}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent">
            Ver página pública
          </a>
        )}
      </div>

      {/* Fotos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-lg font-semibold">Fotos</p>
          <span className="text-xs text-muted">{a.fotos.length} de 20 · a primeira é a capa</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {a.fotos.map((foto, k) => (
            <div key={foto.id} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-canvas">
              <img src={foto.url} alt={`Foto ${k + 1}`} className="size-full object-cover" loading="lazy" />
              {k === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/80 px-2 py-0.5 text-[0.625rem] font-bold text-white">Capa</span>}
              <div className="absolute inset-x-1.5 bottom-1.5 flex justify-end gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                {k > 0 && (
                  <button onClick={() => store.definirCapa(captacao.id, foto.id)} title="Usar como capa" className="grid size-7 place-items-center rounded-full bg-white/90 text-ink">
                    <Star className="size-3.5" />
                  </button>
                )}
                <button onClick={() => store.removerFoto(captacao.id, foto.id)} title="Remover foto" className="grid size-7 place-items-center rounded-full bg-white/90 text-rose-600">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
          {a.fotos.length < 20 && (
            <button
              onClick={() => input.current?.click()}
              disabled={enviando}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line-strong text-xs font-semibold text-muted transition-colors hover:border-accent/50 hover:bg-canvas disabled:opacity-60"
            >
              {enviando ? <Loader2 className="size-5 animate-spin" /> : a.fotos.length ? <ImagePlus className="size-5" /> : <Camera className="size-5" />}
              {enviando ? "Enviando..." : "Adicionar fotos"}
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            enviarFotos(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-2 text-xs text-muted">As fotos são reduzidas automaticamente antes de enviar, sem perder qualidade para o anúncio.</p>
      </div>

      {/* Textos */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Field label="Título do anúncio" className="sm:col-span-4" hint="Ex.: Apartamento de 3 quartos com varanda gourmet em Moema">
          <input className={inputCls} maxLength={120} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} />
        </Field>
        <Field label="Descrição" className="sm:col-span-4">
          <textarea
            className={`${inputCls} h-36 resize-y py-3`}
            maxLength={5000}
            value={f.descricao}
            onChange={(e) => setF({ ...f, descricao: e.target.value })}
            placeholder="Conte os diferenciais do imóvel, do condomínio e da região."
          />
        </Field>
        {campo("quartos", "Quartos")}
        {campo("suites", "Suítes")}
        {campo("banheiros", "Banheiros")}
        {campo("vagas", "Vagas")}
        <Field label="Condomínio (R$/mês)" className="sm:col-span-2">
          <input className={inputCls} inputMode="decimal" value={f.condominio} onChange={(e) => setF({ ...f, condominio: mascaraMoeda(e.target.value) })} placeholder="0,00" />
        </Field>
        <Field label="IPTU (R$/ano)" className="sm:col-span-2">
          <input className={inputCls} inputMode="decimal" value={f.iptu} onChange={(e) => setF({ ...f, iptu: mascaraMoeda(e.target.value) })} placeholder="0,00" />
        </Field>
      </div>

      {/* Características */}
      <div>
        <p className="mb-2 text-sm font-semibold">Características</p>
        <div className="flex flex-wrap gap-2">
          {CARACTERISTICAS.map((c) => {
            const on = f.caracteristicas.includes(c);
            return (
              <button
                key={c}
                onClick={() => setF({ ...f, caracteristicas: on ? f.caracteristicas.filter((x) => x !== c) : [...f.caracteristicas, c] })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-accent bg-accent text-white" : "border-line-strong text-muted hover:border-ink/30"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl bg-canvas p-4 text-xs text-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-accent" />
        No anúncio aparecem também: {valorLabel(captacao.finalidade, captacao.valor)} ({brl(captacao.valor / captacao.areaM2)}/m²), {captacao.areaM2} m², o
        endereço completo do imóvel e o nome, WhatsApp e CRECI do corretor responsável.
      </p>

      {aviso && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{aviso}</p>}

      <div className="space-y-3 border-t border-line pt-5">
        {!noAr && !fechada && (
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 size-4 accent-accent" checked={autorizado} onChange={(e) => setAutorizado(e.target.checked)} />
            Tenho autorização do proprietário para anunciar este imóvel, com fotos e endereço completo.
          </label>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <BotaoSalvar disabled={!mudou} onSalvar={salvar} className={btn.outline}>
            Atualizar
          </BotaoSalvar>
          {fechada ? null : noAr ? (
            <button disabled={publicando} onClick={() => publicar(false)} className={`${btn.outline} text-rose-600`}>
              Retirar do portal
            </button>
          ) : (
            <button disabled={!autorizado || publicando} onClick={() => publicar(true)} className={btn.accent}>
              <Globe className="size-4" /> {publicando ? "Publicando..." : "Publicar no portal"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
