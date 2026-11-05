import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ChevronRight, LineChart, MapPin, MapPinOff, PenLine, Phone, Plus } from "lucide-react";
import { captacoes, imoveis, leads, proprietarios, transacoes } from "@/data/demo";
import { captacaoTitulo, ehPredio, fotoDoImovel, nomePredio } from "@/data/queries";
import { listarAvaliacoes, type Avaliacao } from "@/data/avaliacoes";
import { useStore } from "@/data/store";
import type { Imovel } from "@/data/types";
import { brl, dataHora } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { GRUPOS_CARACTERISTICAS, rotuloTipo, TIPOS_IMOVEL } from "@/lib/imovel";
import { useSession } from "../../session";
import { AvatarNome, Card, Select } from "../../kit";
import { BotaoSalvar, btn, Drawer, EmptyState, Field, formatPhone, inputCls, mascaraMoeda, moeda, SearchInput, waLink, TelefoneInput } from "../../forms";
import { chaveEndereco, Etapas, ImovelCover, NavEtapas, ImovelFormModal, StatusBadge, valorLabel } from "./shared";


/** Filtro da aba Endereços: grupos de tipos. */
const RURAIS = ["Terreno", "Terreno comercial", "Chácara", "Fazenda/Sítio"];
const CASAS = ["Casa", "Sobrado"];
const FILTROS: { value: string; label: string; ok: (im: Imovel) => boolean }[] = [
  { value: "", label: "Todos os endereços", ok: () => true },
  { value: "predios", label: "Edifícios e condomínios", ok: ehPredio },
  { value: "casas", label: "Casas e sobrados", ok: (im) => CASAS.includes(im.categoria) },
  { value: "comerciais", label: "Comerciais (galpões, lojas...)", ok: (im) => !ehPredio(im) && !RURAIS.includes(im.categoria) && TIPOS_IMOVEL.find((t) => t.valor === im.categoria)?.grupo === "Comercial" },
  { value: "terrenos", label: "Terrenos e rurais", ok: (im) => RURAIS.includes(im.categoria) },
];

const ETAPAS_END = ["Ficha", "Imóveis e pessoas", "Estudos"];

/** Lazer, áreas comuns e segurança: o que vale para o prédio todo. */
const GRUPOS_DO_PREDIO = GRUPOS_CARACTERISTICAS.filter((g) => ["Lazer e esporte", "Condomínio", "Segurança"].includes(g.titulo));

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;
const inteiro = (s: string) => (s.trim() === "" ? undefined : Number(s.replace(/\D/g, "")) || undefined);
const m2 = (valor: number, area: number) => (area > 0 ? valor / area : 0);
const media = (l: number[]) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);

/** Captações e vendas do prédio que a pessoa pode ver (o corretor vê só as dele; o banco garante). */
function doPredio(im: Imovel) {
  const caps = captacoes.filter((c) => c.imovelId === im.id);
  const ids = new Set(caps.map((c) => c.id));
  const vendas = transacoes.filter((t) => ids.has(t.captacaoId));
  return { caps, vendas };
}

function Ficha({ im, onClose, estudos }: { im: Imovel; onClose: () => void; estudos: Avaliacao[] }) {
  const { salvarPredio } = useStore();
  const navigate = useNavigate();
  const [editarEndereco, setEditarEndereco] = useState(false);
  const [secao, setSecao] = useState(0);
  useEffect(() => setSecao(0), [im.id]);
  const inicial = () => ({
    construtora: im.construtora ?? "",
    ano: im.anoConstrucao?.toString() ?? "",
    andares: im.andares?.toString() ?? "",
    unidades: im.unidadesAndar?.toString() ?? "",
    elevadores: im.elevadores?.toString() ?? "",
    condominio: moeda(im.condominioMedio),
    caracteristicas: [...(im.caracteristicas ?? [])],
    administradora: im.administradora ?? "",
    tel: im.administradoraTel ? formatPhone(im.administradoraTel) : "",
    obs: im.obsPredio ?? "",
  });
  const [f, setF] = useState(inicial);
  useEffect(() => setF(inicial()), [im.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const mudou = JSON.stringify(f) !== JSON.stringify(inicial());
  const salvarFicha = () =>
                salvarPredio(im.id, {
                  construtora: f.construtora.trim() || undefined,
                  anoConstrucao: inteiro(f.ano),
                  andares: inteiro(f.andares),
                  unidadesAndar: inteiro(f.unidades),
                  elevadores: f.elevadores.trim() === "" ? undefined : Number(f.elevadores),
                  condominioMedio: f.condominio.trim() ? num(f.condominio) : undefined,
                  caracteristicas: f.caracteristicas,
                  administradora: f.administradora.trim() || undefined,
                  administradoraTel: f.tel.replace(/\D/g, "") || undefined,
                  obsPredio: f.obs.trim() || undefined,
                });

  const { caps, vendas } = doPredio(im);
  const predio = ehPredio(im);
  // Cruzamentos: quem é dono (pelas captações ou ligado à mão) e quem tem interesse neste endereço
  const capIds = new Set(caps.map((c) => c.id));
  const donos = proprietarios
    .map((p) => {
      const ligados = (p.imoveis ?? []).filter((l) => l.imovelId === im.id).map((l) => l.unidade).filter(Boolean) as string[];
      const pelasCaps = caps.filter((c) => c.proprietarioId === p.id).map((c) => c.unidade).filter(Boolean) as string[];
      const tem = (p.imoveis ?? []).some((l) => l.imovelId === im.id) || caps.some((c) => c.proprietarioId === p.id);
      return tem ? { p, unidades: [...new Set([...ligados, ...pelasCaps])] } : null;
    })
    .filter(Boolean) as { p: (typeof proprietarios)[number]; unidades: string[] }[];
  const interessados = leads.filter((l) => l.interesseImovelId === im.id || (l.interesseCaptacaoId && capIds.has(l.interesseCaptacaoId)));
  const daVenda = caps.filter((c) => c.finalidade === "venda" && c.areaM2 > 0);
  const m2Ofertas = media(daVenda.map((c) => m2(c.valor, c.areaM2)));
  const m2Vendas = media(
    vendas.filter((t) => t.tipo === "venda").map((t) => m2(t.valor, captacoes.find((c) => c.id === t.captacaoId)?.areaM2 ?? 0)).filter(Boolean),
  );
  const campo = (k: "ano" | "andares" | "unidades" | "elevadores", label: string) => (
    <Field label={label}>
      <input className={inputCls} inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
    </Field>
  );

  return (
    <>
      <Drawer
        centro
        open
        onClose={onClose}
        alterado={mudou}
        onSalvarAlteracoes={salvarFicha}
        title={nomePredio(im)}
        subtitle={`${rotuloTipo(im.categoria)} · ${im.endereco.logradouro}, ${im.endereco.numero} - ${im.endereco.bairro}, ${im.endereco.cidade} - ${im.endereco.uf} · cadastrado em ${dataHora(im.criadoEm)}`}
        footer={
          <>
            <button onClick={() => navigate(`/app/negocios/captacoes?novo=1&predio=${im.id}`)} className={`${btn.outline} mr-auto`}>
              <Plus className="size-4" /> {predio ? "Novo imóvel neste prédio" : "Nova captação neste endereço"}
            </button>
            {predio && (
            <BotaoSalvar
              disabled={!mudou}
              depois={onClose}
              onSalvar={salvarFicha}
            >
              Salvar ficha
            </BotaoSalvar>
            )}
          </>
        }
      >
        <div className="space-y-7">
          <Etapas
            className=""
            livre
            passos={ETAPAS_END}
            atual={secao}
            concluidas={[!predio || !!(im.construtora || im.andares || im.condominioMedio || (im.caracteristicas?.length ?? 0) > 0), caps.length > 0, estudos.length > 0]}
            onIr={setSecao}
          />
          {secao === 0 && (
            <>
          {/* Números do prédio */}
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              ["Captações", String(caps.length)],
              ["Vendas e locações", String(vendas.length)],
              ["R$/m² anunciado", m2Ofertas ? brl(m2Ofertas) : "—"],
              ["R$/m² vendido", m2Vendas ? brl(m2Vendas) : "—"],
            ].map(([r, v]) => (
              <div key={r} className="rounded-2xl bg-canvas p-3.5">
                <p className="text-xs text-muted">{r}</p>
                <p className="mt-0.5 font-display text-lg font-semibold">{v}</p>
              </div>
            ))}
          </div>

          {!predio && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-canvas p-4 text-sm">
              <span className="text-muted">{im.lat === undefined ? "Este endereço ainda não tem o ponto no mapa." : "Endereço com localização no mapa."}</span>
              <button onClick={() => setEditarEndereco(true)} className="inline-flex items-center gap-1.5 font-semibold text-accent">
                <PenLine className="size-4" /> Editar título e endereço
              </button>
            </div>
          )}

          {/* Ficha */}
          {predio && (<>
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-display text-lg font-semibold">Dados do prédio</p>
              <button onClick={() => setEditarEndereco(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                <PenLine className="size-4" /> Editar nome e endereço
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-6">
              <Field label="Construtora" className="sm:col-span-4">
                <input className={inputCls} value={f.construtora} onChange={(e) => setF({ ...f, construtora: e.target.value })} placeholder="Ex.: Construtora Leal Moreira" />
              </Field>
              <div className="sm:col-span-2">{campo("ano", "Ano de construção")}</div>
              <div className="sm:col-span-2">{campo("andares", "Andares")}</div>
              <div className="sm:col-span-2">{campo("unidades", "Unidades por andar")}</div>
              <div className="sm:col-span-2">{campo("elevadores", "Elevadores")}</div>
              <Field label="Condomínio médio (R$/mês)" className="sm:col-span-2" hint="Vai para o anúncio dos imóveis novos.">
                <input className={inputCls} inputMode="decimal" value={f.condominio} onChange={(e) => setF({ ...f, condominio: mascaraMoeda(e.target.value) })} placeholder="0,00" />
              </Field>
              <Field label="Administradora ou síndico" className="sm:col-span-2">
                <input className={inputCls} value={f.administradora} onChange={(e) => setF({ ...f, administradora: e.target.value })} />
              </Field>
              <Field label="Telefone" className="sm:col-span-2">
                <span className="flex gap-2">
                  <TelefoneInput className={inputCls} value={f.tel} onChange={(e) => setF({ ...f, tel: e.target.value })} placeholder="(91) 99999-9999" />
                  {f.tel.replace(/\D/g, "").length >= 10 && (
                    <a href={waLink(`55${f.tel.replace(/\D/g, "").replace(/^55/, "")}`)} target="_blank" rel="noreferrer" title="Abrir no WhatsApp" className={`${btn.outline} shrink-0 px-3`}>
                      <Phone className="size-4" />
                    </a>
                  )}
                </span>
              </Field>
              <Field label="Observações" className="sm:col-span-6">
                <textarea
                  className={`${inputCls} h-20 resize-y py-2.5`}
                  maxLength={2000}
                  value={f.obs}
                  onChange={(e) => setF({ ...f, obs: e.target.value })}
                  placeholder="Ex.: portaria pede autorização do proprietário para visita; aceita pets; reforma da fachada em 2027."
                />
              </Field>
            </div>
          </div>

          {/* Lazer e segurança */}
          {GRUPOS_DO_PREDIO.map((g) => (
            <div key={g.titulo}>
              <p className="mb-2 text-sm font-semibold">{g.titulo}</p>
              <div className="flex flex-wrap gap-2">
                {g.itens.map((c) => {
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
          ))}
          <p className="-mt-3 text-xs text-subtle">Ao cadastrar um imóvel neste prédio, o condomínio e estas características já entram no anúncio.</p>
          </>)}

            </>
          )}

          {secao === 1 && (
            <>
          {/* Cruzamento: captações, vendas e estudos do mesmo endereço */}
          <div>
            <p className="mb-3 font-display text-lg font-semibold">{predio ? "Imóveis neste prédio" : "Captações neste endereço"} ({caps.length})</p>
            {caps.length ? (
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {caps.map((c) => (
                  <li key={c.id}>
                    <Link to={`/app/negocios/captacoes?captacao=${c.id}`} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{captacaoTitulo(c)}</span>
                        <span className="text-xs text-muted">
                          {valorLabel(c.finalidade, c.valor)} · {c.areaM2} m² · {brl(m2(c.valor, c.areaM2))}/m² · {dataHora(c.captadoEm)}
                        </span>
                      </span>
                      <StatusBadge status={c.status} />
                      <ChevronRight className="size-4 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhuma captação sua {predio ? "neste prédio" : "neste endereço"} ainda.</p>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <p className="mb-3 font-display text-lg font-semibold">Proprietários ({donos.length})</p>
              {donos.length ? (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {donos.map(({ p, unidades }) => (
                    <li key={p.id}>
                      <Link to={`/app/negocios/proprietarios?proprietario=${p.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
                        <AvatarNome id={p.id} nome={p.nome} className="size-8 text-[0.625rem]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{p.nome}</span>
                          {unidades.length > 0 && <span className="text-xs text-muted">{unidades.join(", ")}</span>}
                        </span>
                        <ChevronRight className="size-4 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhum proprietário ligado a este endereço.</p>
              )}
            </div>
            <div>
              <p className="mb-3 font-display text-lg font-semibold">Leads interessados ({interessados.length})</p>
              {interessados.length ? (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {interessados.map((l) => (
                    <li key={l.id}>
                      <Link to={`/app/negocios/leads?lead=${l.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
                        <AvatarNome id={l.id} nome={l.nome} className="size-8 text-[0.625rem]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-semibold">{l.nome}</span>
                          <span className="text-xs text-muted">{l.interesseUnidade ?? (l.interesseCaptacaoId ? captacaoTitulo(captacoes.find((c) => c.id === l.interesseCaptacaoId)!) : "")}</span>
                        </span>
                        <ChevronRight className="size-4 text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhum lead interessado neste endereço.</p>
              )}
            </div>
          </div>

            </>
          )}

          {secao === 2 && (estudos.length === 0 ? (
            <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">Nenhum estudo de mercado neste endereço ainda.</p>
          ) : (
            <div>
              <p className="mb-3 font-display text-lg font-semibold">Estudos de mercado neste endereço ({estudos.length})</p>
              <ul className="divide-y divide-line rounded-2xl border border-line">
                {estudos.map((a) => (
                  <li key={a.id}>
                    <Link to={`/app/mercado/estudos/${a.id}`} className="flex items-center gap-3 px-4 py-3 text-sm transition hover:bg-canvas">
                      <LineChart className="size-4 shrink-0 text-accent" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{a.titulo || "Estudo de mercado"}</span>
                        <span className="text-xs text-muted">
                          {a.areaM2} m² · criado em {dataHora(a.criadoEm)}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-muted" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <NavEtapas atual={secao} total={3} nomes={ETAPAS_END} onIr={setSecao} />
        </div>
      </Drawer>
      <ImovelFormModal open={editarEndereco} onClose={() => setEditarEndereco(false)} imovel={im} />
    </>
  );
}

/** Negócios → Endereços: todos os lugares físicos (prédios, casas, galpões, terrenos). É a base que cruza captações, vendas e estudos. */
export default function Edificios() {
  useStore();
  const { modo } = useSession();
  const [params, setParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [novo, setNovo] = useState(false);
  const [estudos, setEstudos] = useState<Avaliacao[]>([]);
  useEffect(() => {
    listarAvaliacoes(modo === "real").then(setEstudos).catch(() => setEstudos([]));
  }, [modo]);

  const setAberto = (id: string | null) => {
    const p = new URLSearchParams(params);
    if (id) p.set("predio", id);
    else p.delete("predio");
    setParams(p, { replace: true });
  };
  const aberto = imoveis.find((i) => i.id === params.get("predio"));

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const filtro = FILTROS.find((x) => x.value === tipo) ?? FILTROS[0];
    return imoveis
      .filter(filtro.ok)
      .filter((im) => !q || `${nomePredio(im)} ${im.endereco.logradouro} ${im.endereco.bairro} ${im.endereco.cidade} ${im.construtora ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => nomePredio(a).localeCompare(nomePredio(b), "pt-BR"));
  }, [busca, tipo, imoveis.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const estudosDe = (im: Imovel) =>
    estudos.filter((a) => a.logradouro && a.numero && a.cidade && chaveEndereco({ logradouro: a.logradouro, numero: a.numero, cidade: a.cidade }) === chaveEndereco(im.endereco));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={busca} onChange={setBusca} placeholder="Buscar por nome, rua, bairro ou construtora..." />
          <Select label="Tipo" value={tipo} onChange={setTipo} options={FILTROS.map((x) => ({ value: x.value, label: x.label }))} />
        </div>
        <button onClick={() => setNovo(true)} className={btn.accent}>
          <Plus className="size-4" /> Novo endereço
        </button>
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="size-6" />}
            title={tipo ? "Nenhum endereço deste tipo" : "Nenhum endereço cadastrado"}
            text="Cadastre prédios, condomínios, casas e galpões com o ponto exato no mapa. Ao captar um imóvel, os dados do endereço já vêm preenchidos."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((im, i) => {
            const { caps, vendas } = doPredio(im);
            const completa = !ehPredio(im) || im.construtora || im.andares || im.condominioMedio || (im.caracteristicas?.length ?? 0) > 0;
            return (
              <motion.button
                key={im.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03, ease: EASE_OUT_EXPO }}
                onClick={() => setAberto(im.id)}
                className="group flex items-start gap-3 rounded-3xl border border-line bg-bg p-4 text-left transition hover:border-line-strong hover:shadow-soft"
              >
                <ImovelCover categoria={im.categoria} foto={fotoDoImovel(im.id)} className="size-16 shrink-0 rounded-2xl [&_svg]:size-7" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{nomePredio(im)}</span>
                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                    <MapPin className="size-3 shrink-0" /> {rotuloTipo(im.categoria)} · {im.endereco.bairro}, {im.endereco.cidade} - {im.endereco.uf}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                    <span className="rounded-full bg-canvas px-2 py-0.5">{caps.length} {caps.length === 1 ? "captação" : "captações"}</span>
                    {vendas.length > 0 && <span className="rounded-full bg-canvas px-2 py-0.5">{vendas.length} {vendas.length === 1 ? "venda/locação" : "vendas/locações"}</span>}
                    {im.andares && <span className="rounded-full bg-canvas px-2 py-0.5">{im.andares} andares</span>}
                    {!completa && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Ficha a completar</span>}
                    {im.lat === undefined && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">
                        <MapPinOff className="size-3" /> Sem localização
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight className="mt-1 size-4 shrink-0 text-subtle transition group-hover:translate-x-0.5" />
              </motion.button>
            );
          })}
        </div>
      )}

      {aberto && <Ficha im={aberto} onClose={() => setAberto(null)} estudos={estudosDe(aberto)} />}
      <ImovelFormModal open={novo} onClose={() => setNovo(false)} categoriaInicial="Apartamento" onCreated={(id) => setAberto(id)} />
    </div>
  );
}
