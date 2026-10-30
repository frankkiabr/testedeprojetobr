import { TIPOS_COM_UNIDADE, unidadeEhSala } from "@/lib/imovel";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { AnuncioEditor } from "./Anuncio";
import { Carrossel } from "@/components/Carrossel";
import { LocalImovel } from "./LocalImovel";
import { anuncios } from "@/data/demo";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { PartyPopper, BadgeDollarSign, Calculator, FileText, Handshake, MapPin, Plus, Ruler, UserRound, Users } from "lucide-react";
import { Simulador } from "@/components/Simulador";
import { CHECKLIST_CAPTACAO, CHECKLIST_MARKETING } from "@/data/demo";
import {
  captacaoById,
  captacaoBairro,
  captacaoCategoria,
  captacaoTitulo,
  captacoesOf,
  captacoesDoImovel,
  corretoresAtivos,
  done,
  doneCaptacao,
  enderecoCompleto,
  imovelById,
  participanteNome,
  participanteAvatar,
  proprietarioById,
  userById,
  pessoa,
  fotoCapa,
} from "@/data/queries";
import { transacoes } from "@/data/demo";
import { useStore } from "@/data/store";
import type { Captacao } from "@/data/types";
import { brl, relTime } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../../session";
import { Avatar, Card, ProgressBar, Segmented, Select } from "../../kit";
import { BotaoSalvar, btn, CheckItem, Drawer, EmptyState, Field, formatPhone, inputCls, mascaraMoeda, Modal, moeda, SearchInput, waLink } from "../../forms";
import {
  CaptacaoFormModal,
  FinalidadeBadge,
  ImovelCover,
  ImovelFormModal,
  InformarFechamentoModal,
  ReportModal,
  StatusBadge,
  TransacaoFormModal,
  valorLabel,
  BotaoExcluir,
} from "./shared";

function CaptacaoCard({ c, showCorretor, onOpen, i }: { c: Captacao; showCorretor: boolean; onOpen: () => void; i: number }) {
  const prop = proprietarioById(c.proprietarioId);
  const feitos = done(c);
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.5, delay: Math.min(i, 12) * 0.03, ease: EASE_OUT_EXPO }}
      onClick={onOpen}
      className="group overflow-hidden rounded-3xl border border-line bg-bg text-left transition-shadow hover:shadow-lift"
    >
      <div className="relative">
        <ImovelCover categoria={captacaoCategoria(c)} foto={fotoCapa(c.id)} className="aspect-[16/10] transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
        <span className="absolute left-3 top-3 flex gap-1.5">
          <StatusBadge status={c.status} />
          <FinalidadeBadge finalidade={c.finalidade} />
        </span>
        {showCorretor && (
          <span className="absolute right-3 top-3 rounded-full ring-2 ring-white/80">
            <Avatar user={pessoa(c.corretorId)} className="size-7 text-[0.5625rem]" />
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-display text-xl font-semibold tracking-tight">{valorLabel(c.finalidade, c.valor)}</p>
        <p className="mt-0.5 truncate text-sm font-medium">{captacaoTitulo(c)}</p>
        {c.codigo && <p className="mt-0.5 font-mono text-[0.6875rem] font-semibold tracking-wide text-subtle">{c.codigo}</p>}
        <p className="mt-0.5 truncate text-xs text-muted">
          {captacaoBairro(c)} · {c.areaM2} m² · {prop?.nome}
        </p>
        {comodos(c.id) && <p className="mt-0.5 truncate text-xs font-medium text-ink/80">{comodos(c.id)}</p>}
        <div className="mt-4 space-y-1.5">
          {[
            { label: "captação", k: doneCaptacao(c), n: CHECKLIST_CAPTACAO.length },
            { label: "marketing", k: feitos, n: CHECKLIST_MARKETING.length },
          ].map((x) => (
            <div key={x.label} className="flex items-center gap-2">
              <ProgressBar value={x.k / x.n} className="h-1.5 flex-1" tone={x.k === x.n ? "verified" : "accent"} />
              <span className="w-24 text-right text-[0.6875rem] font-semibold text-muted">
                {x.k}/{x.n} {x.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.button>
  );
}

/** Resumo dos cômodos que o corretor preencheu no anúncio (ex.: "3 quartos · 2 banheiros · 1 vaga"). */
function comodos(captacaoId: string) {
  const a = anuncios.find((x) => x.captacaoId === captacaoId);
  if (!a) return "";
  const p = (n: number | undefined, um: string, varios: string) => (n ? `${n} ${n === 1 ? um : varios}` : "");
  return [p(a.quartos, "quarto", "quartos"), p(a.suites, "suíte", "suítes"), p(a.banheiros, "banheiro", "banheiros"), p(a.vagas, "vaga", "vagas")]
    .filter(Boolean)
    .join(" · ");
}

type AbaCaptacao = "imovel" | "captacao" | "marketing" | "anuncio";

/** Outras captações no mesmo endereço (ex.: outros apartamentos do prédio) e os negócios já fechados ali. */
function NesteEndereco({ imovelId, atualId, onAbrir }: { imovelId: string; atualId: string; onAbrir: (id: string) => void }) {
  const { isAdmin, scope } = useScope();
  const outras = captacoesDoImovel(imovelId).filter((x) => x.id !== atualId && (isAdmin || x.corretorId === scope.corretorId));
  const fechados = transacoes
    .filter((t) => captacaoById(t.captacaoId)?.imovelId === imovelId)
    .sort((a, b) => b.data.localeCompare(a.data));
  if (!outras.length && !fechados.length) return null;
  return (
    <div className="space-y-4">
      {outras.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Outras captações neste endereço ({outras.length})</p>
          <ul className="space-y-2">
            {outras.map((x) => (
              <li key={x.id}>
                <button
                  onClick={() => onAbrir(x.id)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left transition hover:border-line-strong hover:bg-canvas"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{captacaoTitulo(x)}</p>
                    <p className="text-xs text-muted">
                      {valorLabel(x.finalidade, x.valor)} · {x.areaM2} m²{x.codigo ? ` · ${x.codigo}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={x.status} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {fechados.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">Negócios fechados neste endereço</p>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {fechados.map((t) => {
              const x = captacaoById(t.captacaoId)!;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {captacaoTitulo(x)} · {x.areaM2} m²
                    </p>
                    <p className="text-xs text-muted">
                      {t.tipo === "venda" ? "Vendido" : "Alugado"} em {new Date(t.data).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{valorLabel(t.tipo, t.valor)}</p>
                    <p className="text-xs text-muted">{brl(t.valor / x.areaM2)}/m²</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Editar os dados principais do imóvel captado: valor, área, unidade e cômodos. */
function EditarDados({ c, categoria, onFim }: { c: Captacao; categoria: string; onFim: () => void }) {
  const { updateCaptacao, salvarAnuncio } = useStore();
  const an = anuncios.find((x) => x.captacaoId === c.id);
  const comUnidade = TIPOS_COM_UNIDADE.includes(categoria);
  const [f, setF] = useState({
    valor: moeda(c.valor),
    area: String(c.areaM2),
    unidade: c.unidade ?? "",
    quartos: an?.quartos?.toString() ?? "",
    suites: an?.suites?.toString() ?? "",
    banheiros: an?.banheiros?.toString() ?? "",
    vagas: an?.vagas?.toString() ?? "",
  });
  const n = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
  const inteiro = (s: string) => (s.trim() === "" ? undefined : Math.min(50, Number(s.replace(/\D/g, "")) || 0));
  const ok = n(f.valor) > 0 && n(f.area) > 0;
  const campo = (k: keyof typeof f, label: string, numerico = true) => (
    <Field label={label}>
      <input
        className={inputCls}
        inputMode={numerico ? "decimal" : "text"}
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: k === "valor" ? mascaraMoeda(e.target.value) : e.target.value })}
      />
    </Field>
  );
  return (
    <div className="space-y-4 rounded-2xl border border-line p-4">
      <div className="grid grid-cols-2 gap-3">
        {campo("valor", c.finalidade === "venda" ? "Valor de venda" : "Aluguel mensal")}
        {campo("area", "Área (m²)")}
        {comUnidade && <div className="col-span-2">{campo("unidade", unidadeEhSala(categoria) ? "Número da sala" : "Número do apartamento", false)}</div>}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {campo("quartos", "Quartos")}
        {campo("suites", "Suítes")}
        {campo("banheiros", "Banheiros")}
        {campo("vagas", "Vagas")}
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onFim} className={btn.outline}>
          Cancelar
        </button>
        <BotaoSalvar
          disabled={!ok}
          depois={onFim}
          onSalvar={() => {
            updateCaptacao(c.id, { valor: n(f.valor), areaM2: n(f.area), unidade: f.unidade.trim() || undefined });
            salvarAnuncio(c.id, { quartos: inteiro(f.quartos), suites: inteiro(f.suites), banheiros: inteiro(f.banheiros), vagas: inteiro(f.vagas) }, "");
          }}
        >
          Salvar dados
        </BotaoSalvar>
      </div>
    </div>
  );
}

export function CaptacaoDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { toggleMarketing, toggleCaptacao } = useStore();
  const [aba, setAba] = useState<AbaCaptacao>("imovel");
  const { isAdmin, user, solo } = useScope();
  const [report, setReport] = useState(false);
  const [simular, setSimular] = useState(false);
  const [registrar, setRegistrar] = useState(false);
  const [informar, setInformar] = useState(false);
  const [editando, setEditando] = useState(false);
  const [editarEndereco, setEditarEndereco] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setAba("imovel");
    setEditando(false);
  }, [id]);
  const c = id ? captacaoById(id) : undefined;
  const im = c ? imovelById(c.imovelId) : undefined;
  const prop = c ? proprietarioById(c.proprietarioId) : undefined;
  const feitos = c ? done(c) : 0;
  const t = c && c.status !== "ativa" ? transacoes.find((x) => x.captacaoId === c.id) : undefined;
  const an = c ? anuncios.find((x) => x.captacaoId === c.id) : undefined;
  const fotos = an?.fotos.map((x) => x.url) ?? [];
  const fechada = c ? c.status !== "ativa" : false;

  // Venda ou locação concluída: mensagem de parabéns para o proprietário (não para o cliente)
  const parabens =
    c && prop
      ? `Olá, ${prop.nome.split(" ")[0]}! Parabéns pela ${c.finalidade === "venda" ? "venda" : "locação"} do seu imóvel (${captacaoTitulo(c)}). ` +
        `Foi um prazer cuidar desse negócio com você! Se precisar de algo, ou conhecer alguém que queira ${c.finalidade === "venda" ? "comprar ou vender" : "alugar"} um imóvel, conte comigo. ${user.nome.split(" ")[0]}`
      : "";

  return (
    <>
      <Drawer
        centro
        open={!!c}
        onClose={onClose}
        title={c && captacaoTitulo(c)}
        subtitle={c && `${c.codigo ? `Cód. ${c.codigo} · ` : ""}${c.finalidade === "venda" ? "Venda" : "Locação"} · captada ${relTime(c.captadoEm)}`}
        footer={
          c &&
          isAdmin &&
          (t ? (
            <BotaoExcluir tipo="transacao" id={t.id} nome={`${t.tipo === "venda" ? "Venda" : "Locação"} de ${captacaoTitulo(c)}`} />
          ) : (
            <BotaoExcluir tipo="captacao" id={c.id} nome={captacaoTitulo(c)} onExcluido={onClose} />
          ))
        }
      >
        {c && im && (
          <div>
            {/* Abas fixas no topo enquanto a janela rola */}
            <div className="sticky -top-5 z-10 -mx-6 -mt-5 mb-6 border-b border-line bg-bg/95 px-6 py-3 backdrop-blur">
              <Segmented
                id="cap-abas"
                value={aba}
                onChange={setAba}
                options={[
                  { value: "imovel", label: "Imóvel" },
                  { value: "captacao", label: `Captação · ${doneCaptacao(c)}/${CHECKLIST_CAPTACAO.length}` },
                  { value: "marketing", label: `Marketing · ${feitos}/${CHECKLIST_MARKETING.length}` },
                  { value: "anuncio", label: an?.publicado && !fechada ? "Anúncio · no ar" : "Anúncio" },
                ]}
              />
            </div>

            {aba === "imovel" && (
              <div className="space-y-6">
                {/* Fotos (carrossel) ou ilustração */}
                <div className="relative overflow-hidden rounded-3xl">
                  {fotos.length ? (
                    <Carrossel
                      fotos={fotos}
                      sobre={
                        <span className="absolute left-4 top-4 flex gap-1.5">
                          <StatusBadge status={c.status} />
                          <FinalidadeBadge finalidade={c.finalidade} />
                        </span>
                      }
                    />
                  ) : (
                    <>
                      <ImovelCover categoria={im.categoria} className="aspect-[16/8]" />
                      <span className="absolute left-4 top-4 flex gap-1.5">
                        <StatusBadge status={c.status} />
                        <FinalidadeBadge finalidade={c.finalidade} />
                      </span>
                    </>
                  )}
                </div>

                {/* Ações deste imóvel */}
                <div className="flex flex-wrap gap-2">
                  {!fechada ? (
                    <>
                      {isAdmin ? (
                        <button onClick={() => setRegistrar(true)} className={btn.accent}>
                          <BadgeDollarSign className="size-4" /> Registrar {c.finalidade === "venda" ? "venda" : "locação"}
                        </button>
                      ) : (
                        <button onClick={() => setInformar(true)} className={btn.accent}>
                          <Handshake className="size-4" /> Informar fechamento
                        </button>
                      )}
                      <button onClick={() => setReport(true)} className={btn.outline}>
                        <FileText className="size-4" /> Relatório ao proprietário
                      </button>
                      {c.finalidade === "venda" && (
                        <button onClick={() => setSimular(true)} className={btn.outline}>
                          <Calculator className="size-4" /> Simular financiamento
                        </button>
                      )}
                    </>
                  ) : (
                    prop && (
                      <a href={waLink(prop.whatsapp, parabens)} target="_blank" rel="noreferrer" className={btn.whatsapp}>
                        <PartyPopper className="size-4" /> Parabenizar o proprietário
                      </a>
                    )
                  )}
                </div>

                {editando ? (
                  <EditarDados c={c} categoria={im.categoria} onFim={() => setEditando(false)} />
                ) : (
                  !fechada && (
                    <button onClick={() => setEditando(true)} className="text-sm font-semibold text-accent">
                      Editar dados do imóvel
                    </button>
                  )
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-canvas p-3.5">
                    <p className="text-xs text-muted">{t ? (t.tipo === "venda" ? "Vendida por" : "Alugada por") : c.finalidade === "venda" ? "Valor de venda" : "Aluguel mensal"}</p>
                    <p className="mt-0.5 font-display text-lg font-semibold">{valorLabel(c.finalidade, t ? t.valor : c.valor)}</p>
                  </div>
                  <div className="rounded-2xl bg-canvas p-3.5">
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Ruler className="size-3" /> Área · valor por m²
                    </p>
                    <p className="mt-0.5 font-display text-lg font-semibold">
                      {c.areaM2} m² <span className="text-sm font-normal text-muted">· {brl((t ? t.valor : c.valor) / c.areaM2)}</span>
                    </p>
                  </div>
                  {comodos(c.id) && <p className="col-span-2 rounded-2xl bg-canvas p-3.5 font-medium">{comodos(c.id)}</p>}
                  {(an?.condominio || an?.iptu) && (
                    <p className="col-span-2 rounded-2xl bg-canvas p-3.5 text-muted">
                      {an?.condominio ? `Condomínio ${brl(an.condominio)}/mês` : ""}
                      {an?.condominio && an?.iptu ? " · " : ""}
                      {an?.iptu ? `IPTU ${brl(an.iptu)}/ano` : ""}
                    </p>
                  )}
                  {t && (
                    <div className="col-span-2 rounded-2xl bg-canvas p-3.5">
                      <p className="text-xs text-muted">Fechado em {new Date(t.data).toLocaleDateString("pt-BR")} · participantes</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                        {t.participantes.map((p, k) => (
                          <span key={k} className="flex items-center gap-2 font-medium">
                            <Avatar user={participanteAvatar(p)} className="size-7 text-[0.5625rem]" />
                            {participanteNome(p)} <span className="text-muted">({p.pct}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {isAdmin && !solo && (
                    <div className="col-span-2 flex items-center gap-3 rounded-2xl bg-canvas p-3.5">
                      <Avatar user={pessoa(c.corretorId)} className="size-8 text-[0.625rem]" />
                      <div>
                        <p className="text-xs text-muted">Corretor captador</p>
                        <p className="font-semibold">{userById(c.corretorId)?.nome}</p>
                      </div>
                    </div>
                  )}
                </div>

                {prop && (
                  <div className="flex items-center gap-3 rounded-2xl border border-line p-4">
                    <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-accent">
                      <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">Proprietário</p>
                      <p className="truncate font-semibold">{prop.nome}</p>
                      <p className="text-xs text-muted">{formatPhone(prop.whatsapp)}</p>
                    </div>
                    <a href={waLink(prop.whatsapp)} target="_blank" rel="noreferrer" aria-label="WhatsApp do proprietário" className="grid size-10 place-items-center rounded-full bg-[#25d366] text-white">
                      <WhatsAppIcon className="size-4" />
                    </a>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="flex items-start gap-2 text-sm text-muted">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span>
                        {im.nome && <span className="font-semibold text-ink">{im.nome} · </span>}
                        {enderecoCompleto(im.endereco)}
                      </span>
                    </p>
                    <button onClick={() => setEditarEndereco(true)} className="shrink-0 text-sm font-semibold text-accent">
                      Editar endereço
                    </button>
                  </div>
                  <LocalImovel im={im} className="h-48" />
                </div>

                {/* Mesmo endereço: outras unidades e o histórico de negócios (o que antes ficava na aba Imóveis) */}
                <NesteEndereco imovelId={im.id} atualId={c.id} onAbrir={(id) => navigate(`/app/negocios/captacoes?captacao=${id}`)} />
              </div>
            )}

            {aba === "captacao" && (
              <div>
                <p className="font-display text-lg font-semibold">Checklist de captação</p>
                <p className="mb-3 text-xs text-muted">Controle interno: o que falta para o imóvel estar documentado e pronto para negociar.</p>
                <ProgressBar value={doneCaptacao(c) / CHECKLIST_CAPTACAO.length} className="mb-3" tone={doneCaptacao(c) === CHECKLIST_CAPTACAO.length ? "verified" : "accent"} />
                <div className="space-y-2">
                  {CHECKLIST_CAPTACAO.map((label, i) => (
                    <CheckItem key={label} index={i} label={label} checked={c.checklistCaptacao[i]} onToggle={() => toggleCaptacao(c.id, i)} />
                  ))}
                </div>
              </div>
            )}

            {aba === "marketing" && (
              <div>
                <p className="font-display text-lg font-semibold">Checklist de marketing</p>
                <p className="mb-3 text-xs text-muted">Ações de divulgação. São elas que aparecem no relatório enviado ao proprietário.</p>
                <ProgressBar value={feitos / CHECKLIST_MARKETING.length} className="mb-3" tone={feitos === CHECKLIST_MARKETING.length ? "verified" : "accent"} />
                <div className="space-y-2">
                  {CHECKLIST_MARKETING.map((label, i) => (
                    <CheckItem key={label} index={i} label={label} checked={c.checklistMarketing[i]} onToggle={() => toggleMarketing(c.id, i)} />
                  ))}
                </div>
                {!fechada && (
                  <button onClick={() => setReport(true)} className={`${btn.outline} mt-4`}>
                    <FileText className="size-4" /> Enviar relatório ao proprietário
                  </button>
                )}
              </div>
            )}

            {aba === "anuncio" && <AnuncioEditor captacao={c} onPublicado={onClose} />}
          </div>
        )}
      </Drawer>
      {c && <ReportModal captacao={c} open={report} onClose={() => setReport(false)} />}
      {c && (
        <Modal open={simular} onClose={() => setSimular(false)} title="Simular financiamento" subtitle={`${captacaoTitulo(c)} · para enviar ao cliente`}>
          <Simulador
            key={c.id}
            valorInicial={c.valor}
            acao={(resumo) => (
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${captacaoTitulo(c)}${c.codigo ? ` (Cód. ${c.codigo})` : ""}

${resumo}`)}`}
                target="_blank"
                rel="noreferrer"
                className={btn.whatsapp}
              >
                <WhatsAppIcon className="size-4" /> Enviar ao cliente pelo WhatsApp
              </a>
            )}
          />
        </Modal>
      )}
      {im && <ImovelFormModal open={editarEndereco} onClose={() => setEditarEndereco(false)} imovel={im} />}
      {c && <TransacaoFormModal open={registrar} onClose={() => setRegistrar(false)} captacaoId={c.id} />}
      {c && <InformarFechamentoModal open={informar} onClose={() => setInformar(false)} captacaoId={c.id} />}
    </>
  );
}

export default function Captacoes() {
  useStore();
  const { scope, isAdmin, solo } = useScope();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<"ativa" | "fechadas" | "todas">("todas");
  const [finalidade, setFinalidade] = useState("");
  const [busca, setBusca] = useState("");
  const [corretor, setCorretor] = useState("");

  const setParam = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const all = captacoesOf(isAdmin && corretor ? { corretorId: corretor } : scope);
  const list = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return all.filter((c) => {
      if (status === "ativa" && c.status !== "ativa") return false;
      if (status === "fechadas" && c.status === "ativa") return false;
      if (finalidade && c.finalidade !== finalidade) return false;
      if (!q) return true;
      return `${c.codigo ?? ""} ${captacaoTitulo(c)} ${captacaoBairro(c)} ${captacaoCategoria(c)} ${proprietarioById(c.proprietarioId)?.nome ?? ""}`.toLowerCase().includes(q);
    });
  }, [all, status, finalidade, busca]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por código, imóvel, bairro ou proprietário..." />
          <Select
            label="Finalidade"
            value={finalidade}
            onChange={setFinalidade}
            options={[
              { value: "", label: "Venda e locação" },
              { value: "venda", label: "Só venda" },
              { value: "locacao", label: "Só locação" },
            ]}
          />
          {isAdmin && corretoresAtivos().length > 0 && (
            <Select
              label="Corretor"
              icon={<Users className="size-4" />}
              value={corretor}
              onChange={setCorretor}
              options={[{ value: "", label: "Toda a equipe" }, ...corretoresAtivos().map((c) => ({ value: c.id, label: c.nome }))]}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            id="cap-status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "ativa", label: "Ativas" },
              { value: "fechadas", label: "Vendidas/alugadas" },
              { value: "todas", label: "Todas" },
            ]}
          />
          <button onClick={() => setParam("novo", "1")} className={btn.accent}>
            <Plus className="size-4" /> Novo imóvel
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <EmptyState icon={<Plus className="size-6" />} title="Nenhuma captação encontrada" text="Ajuste a busca ou os filtros, ou cadastre um novo imóvel." />
        </Card>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {list.map((c, i) => (
              <CaptacaoCard key={c.id} c={c} i={i} showCorretor={isAdmin && !solo} onOpen={() => setParam("captacao", c.id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <CaptacaoDrawer id={params.get("captacao")} onClose={() => setParam("captacao", null)} />
      <CaptacaoFormModal open={params.get("novo") === "1"} onClose={() => setParam("novo", null)} />
    </div>
  );
}
