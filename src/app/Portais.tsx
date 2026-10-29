import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Check, Copy, Globe, Loader2, RefreshCw } from "lucide-react";
import { anuncios, captacoes } from "@/data/demo";
import { imovelById, userById } from "@/data/queries";
import { anuncioDe, useStore } from "@/data/store";
import type { Anuncio, Captacao } from "@/data/types";
import { SUPABASE_URL } from "@/integrations/frankkia/client";
import { pendenciasPortais, type ImovelPortal } from "../../supabase/functions/_shared/vrsync";
import { btn, SelectField } from "./forms";

export const DESTAQUES = [
  { value: "STANDARD", label: "Simples" },
  { value: "PREMIUM", label: "Destaque" },
  { value: "SUPER_PREMIUM", label: "Superdestaque" },
];

/** Mesmos dados que a função feed-portais usa, para mostrar o que falta antes de enviar. */
export function imovelParaPortais(c: Captacao, a: Anuncio): ImovelPortal {
  const im = imovelById(c.imovelId);
  const corretor = userById(c.corretorId);
  return {
    codigo: c.codigo ?? c.id,
    finalidade: c.finalidade,
    valor: c.valor,
    area: c.areaM2,
    unidade: c.unidade,
    categoria: im?.categoria ?? "",
    logradouro: im?.endereco.logradouro,
    numero: im?.endereco.numero,
    bairro: im?.endereco.bairro,
    cidade: im?.endereco.cidade,
    uf: im?.endereco.uf,
    cep: im?.cep,
    titulo: a.titulo,
    descricao: a.descricao,
    quartos: a.quartos,
    suites: a.suites,
    banheiros: a.banheiros,
    vagas: a.vagas,
    caracteristicas: a.caracteristicas,
    fotos: a.fotos.map((f) => f.urlJpg).filter((u): u is string => !!u),
    corretor: { nome: corretor?.nome ?? "", email: corretor?.email, telefone: corretor?.telefone },
  };
}

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

/** Bloco da aba Anúncio: enviar este imóvel ao Canal Pro (ZAP, VivaReal e OLX) e o que falta para ser aceito. */
export function PortaisAnuncio({ captacao }: { captacao: Captacao }) {
  const { salvarPortais } = useStore();
  const a = anuncioDe(captacao.id);
  const pend = pendenciasPortais(imovelParaPortais(captacao, a));
  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="size-4 text-accent" /> ZAP Imóveis, VivaReal e OLX
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-amber-800">beta</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Vai pelo Canal Pro da imobiliária (contrato com o Grupo OLX). O link fica em Configurações → Portais.
          </p>
        </div>
        <Chave ligado={!!a.portais} onChange={(v) => salvarPortais(captacao.id, { portais: v, portaisDestaque: a.portaisDestaque })} />
      </div>
      {a.portais && (
        <div className="mt-4 space-y-3">
          <div className="max-w-xs">
            <p className="mb-1.5 text-xs font-semibold text-muted">Tipo de anúncio no Canal Pro</p>
            <SelectField
              value={a.portaisDestaque ?? "STANDARD"}
              onChange={(v) => salvarPortais(captacao.id, { portais: true, portaisDestaque: v as Anuncio["portaisDestaque"] })}
              options={DESTAQUES}
            />
          </div>
          {pend.length ? (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="size-4" /> Fica de fora até completar:
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-6">
                {pend.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-xl bg-verified-soft p-3 text-sm font-semibold text-verified">
              <CheckCircle2 className="size-4" /> Pronto: entra no arquivo dos portais na próxima leitura do Canal Pro.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Configurações → Portais (administrador): link do arquivo para colar no Canal Pro e situação dos imóveis. */
export function PortaisConfig() {
  const { linkPortais, version } = useStore();
  const [token, setToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [trocando, setTrocando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    linkPortais().then(setToken);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  void version;
  const marcados = anuncios.filter((a) => a.portais).map((a) => ({ a, c: captacoes.find((c) => c.id === a.captacaoId) })).filter((x) => x.c && x.c.status === "ativa");
  const prontos = marcados.filter((x) => pendenciasPortais(imovelParaPortais(x.c!, x.a)).length === 0).length;
  const link = token ? `${SUPABASE_URL}/functions/v1/feed-portais?t=${token}` : "";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-bg p-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-display text-lg font-semibold">ZAP Imóveis, VivaReal e OLX</p>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">beta</span>
        </div>
        <p className="mt-1 text-sm text-muted">
          Cadastre os imóveis só na Frankkia: o Canal Pro (do Grupo OLX) lê este link algumas vezes por dia e publica nos três portais. O contrato e o
          número de anúncios nos portais são os do seu plano no Canal Pro.
        </p>

        <p className="mb-1.5 mt-5 text-xs font-semibold text-muted">Link do arquivo dos seus imóveis</p>
        {token === null ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <input readOnly value={link} onFocus={(e) => e.target.select()} className="h-11 min-w-0 flex-1 rounded-xl border border-line-strong bg-canvas px-3.5 font-mono text-xs" />
            <button
              className={btn.primary}
              onClick={async () => {
                await navigator.clipboard.writeText(link).catch(() => null);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 1800);
              }}
            >
              {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">Trate este link como uma senha: com ele, qualquer um vê a lista dos imóveis marcados para os portais.</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Marcados para os portais", marcados.length],
            ["Prontos para enviar", prontos],
            ["Faltando informação", marcados.length - prontos],
          ].map(([t, n]) => (
            <div key={t} className="rounded-2xl bg-canvas p-4">
              <p className="text-xs text-muted">{t}</p>
              <p className="mt-1 font-display text-2xl font-semibold">{n}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-bg p-6">
        <p className="font-display text-lg font-semibold">Como ligar no Canal Pro</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Entre no Canal Pro (canalpro.grupozap.com) com a conta da imobiliária.</li>
          <li>Procure a área de integração de imóveis por XML (integração por arquivo/feed).</li>
          <li>Cole o link acima. Se pedirem o formato, escolha VRSync; se pedirem o sistema, informe Frankkia.</li>
          <li>Em cada imóvel, na aba Anúncio, ligue “ZAP Imóveis, VivaReal e OLX” e escolha o tipo de anúncio.</li>
          <li>O Canal Pro mostra um relatório de importação. Se algum imóvel for recusado, abra um chamado em Ajuda com o motivo.</li>
        </ol>
        <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
          Integração nova (beta): os portais pedem no mínimo 5 fotos em JPG, título, descrição de 50 a 3.000 caracteres e CEP. Imóvel vendido ou
          alugado sai do arquivo sozinho.
        </p>
      </div>

      <div className="rounded-3xl border border-line bg-bg p-6">
        <p className="font-display text-lg font-semibold">Trocar o link</p>
        <p className="mt-1 text-sm text-muted">Gera um link novo e desativa o atual. Depois, cole o novo no Canal Pro.</p>
        {confirmar ? (
          <div className="mt-3 flex gap-2">
            <button
              disabled={trocando}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
              onClick={async () => {
                setTrocando(true);
                const t = await linkPortais(true);
                setTrocando(false);
                setConfirmar(false);
                if (t) setToken(t);
              }}
            >
              <RefreshCw className="size-4" /> {trocando ? "Trocando..." : "Sim, trocar o link"}
            </button>
            <button className={btn.outline} onClick={() => setConfirmar(false)}>
              Cancelar
            </button>
          </div>
        ) : (
          <button className={`${btn.outline} mt-3`} onClick={() => setConfirmar(true)}>
            <RefreshCw className="size-4" /> Gerar link novo
          </button>
        )}
      </div>
    </div>
  );
}
