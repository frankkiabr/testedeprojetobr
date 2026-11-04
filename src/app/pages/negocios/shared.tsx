/** Peças compartilhadas pelas abas de Negócios: capas, etiquetas e formulários de cadastro. */
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, Building2, Home, Info, MapPin, Plus, Store, TreePine, Trash2, Warehouse } from "lucide-react";
import {
  CATEGORIAS_COM_UNIDADE,
  CHECKLIST_MARKETING,
  HONORARIOS_PADRAO,
  imobiliaria,
  imoveis,
  ORIGENS,
  parceiros,
  UFS,
} from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { TIPOS_IMOVEL, unidadeEhSala } from "@/lib/imovel";
import { Mapa } from "@/components/Mapa";
import { buscarCep, localizar, type Ponto } from "@/lib/mapa";
import { lerCaptacaoDoEstudo, limparCaptacaoDoEstudo } from "../estudos/apresentacao";
import { admin as administrador } from "@/data/demo";

/** Quem pode participar de uma venda: os corretores; no plano Solo, o próprio dono da conta. */
const corretoresParaVenda = () => (ehSolo(imobiliaria.plano) ? [administrador, ...corretoresAtivos()] : corretoresAtivos());
import {
  bairrosCadastrados,
  captacaoById,
  captacaoTitulo,
  captacoesOf,
  corretoresAtivos,
  enderecoCompleto,
  imovelById,
  pessoa,
  proprietarioById,
  proprietariosOf,
  userById,
  participanteAvatar,
  ehPredio,
  enderecoPerto,
  nomePredio,
  pedePredio,
} from "@/data/queries";
import { useStore } from "@/data/store";
import type { Captacao, CategoriaImovel, EnderecoLigado, EtapaLead, FechamentoInformado, Finalidade, Participante, Imovel } from "@/data/types";
import { brl } from "@/lib/format";
import { useScope } from "../../session";
import { BotaoSalvar, btn, DateInput, Field, inputCls, mascaraMoeda, Modal, moeda, normalizePhone, SelectField, waLink } from "../../forms";
import { Avatar, Segmented } from "../../kit";

// ---------- Visual ----------

const CATEGORIA_STYLE: Record<CategoriaImovel, { hue: number; icon: typeof Home }> = {
  Apartamento: { hue: 226, icon: Building2 },
  Cobertura: { hue: 226, icon: Building2 },
  Flat: { hue: 226, icon: Building2 },
  Kitnet: { hue: 226, icon: Building2 },
  "Edifício residencial": { hue: 226, icon: Building2 },
  Casa: { hue: 158, icon: Home },
  "Casa de condomínio": { hue: 158, icon: Home },
  Sobrado: { hue: 158, icon: Home },
  "Sala comercial": { hue: 268, icon: Briefcase },
  Consultório: { hue: 268, icon: Briefcase },
  "Imóvel comercial": { hue: 268, icon: Briefcase },
  "Prédio inteiro": { hue: 268, icon: Building2 },
  Loja: { hue: 32, icon: Store },
  Galpão: { hue: 200, icon: Warehouse },
  Terreno: { hue: 95, icon: TreePine },
  "Terreno comercial": { hue: 95, icon: TreePine },
  Chácara: { hue: 95, icon: TreePine },
  "Fazenda/Sítio": { hue: 95, icon: TreePine },
};
/** Opções do tipo de imóvel (com o rótulo dos portais; o terreno comercial fica identificado). */
const OPCOES_TIPO = TIPOS_IMOVEL.map((t) => ({ value: t.valor, label: t.valor === "Terreno comercial" ? "Lote/Terreno comercial" : t.rotulo }));

export const CategoriaIcon = ({ categoria, className = "size-4" }: { categoria: CategoriaImovel; className?: string }) => {
  const Icon = (CATEGORIA_STYLE[categoria] ?? CATEGORIA_STYLE.Apartamento).icon;
  return <Icon className={className} />;
};

/** Capa do imóvel: a foto de capa do anúncio, quando houver; senão, a ilustração da categoria. */
export function ImovelCover({ categoria, className = "", foto }: { categoria: CategoriaImovel; className?: string; foto?: string }) {
  const { hue, icon: Icon } = CATEGORIA_STYLE[categoria] ?? CATEGORIA_STYLE.Apartamento;
  if (foto)
    return (
      <div className={`relative overflow-hidden bg-canvas ${className}`}>
        <img src={foto} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      </div>
    );
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(90% 80% at 15% 10%, hsl(${hue} 90% 88%), transparent 60%),
          radial-gradient(80% 70% at 100% 100%, hsl(${hue + 25} 80% 72%), transparent 65%),
          linear-gradient(140deg, hsl(${hue} 70% 94%), hsl(${hue} 55% 80%))`,
      }}
    >
      <Icon className="size-12 text-white drop-shadow-xs" strokeWidth={1.5} />
    </div>
  );
}

export const ETAPA_STYLE: Record<EtapaLead, string> = {
  novo: "bg-amber-100 text-amber-800",
  contato: "bg-sky-100 text-sky-800",
  visita: "bg-violet-100 text-violet-800",
  proposta: "bg-accent-soft text-accent-deep",
  fechado: "bg-verified-soft text-verified",
  perdido: "bg-canvas-deep text-muted",
};
export const ETAPA_DOT: Record<EtapaLead, string> = {
  novo: "bg-amber-400",
  contato: "bg-sky-400",
  visita: "bg-violet-400",
  proposta: "bg-accent",
  fechado: "bg-verified",
  perdido: "bg-subtle",
};

export function StatusBadge({ status }: { status: Captacao["status"] }) {
  const s = {
    ativa: { label: "Ativa", cls: "bg-bg/90 text-ink", dot: "bg-accent" },
    vendida: { label: "Vendida", cls: "bg-verified text-white", dot: "bg-white" },
    alugada: { label: "Alugada", cls: "bg-violet-600 text-white", dot: "bg-white" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function FinalidadeBadge({ finalidade }: { finalidade: Finalidade }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold ${finalidade === "venda" ? "bg-accent-soft text-accent-deep" : "bg-violet-100 text-violet-800"}`}
    >
      {finalidade === "venda" ? "Venda" : "Locação"}
    </span>
  );
}

/** "R$ 850.000" na venda, "R$ 4.200/mês" na locação. */
export const valorLabel = (finalidade: Finalidade, valor: number) => (finalidade === "venda" ? brl(valor) : `${brl(valor)}/mês`);

// ---------- Ajudas de formulário ----------

/** Valor do campo de corretor que significa "entregar ao próximo da fila do rodízio". */
export const RODIZIO = "__rodizio";
export const rodizioLigado = () => !!imobiliaria.rodizio?.ativo && !ehSolo(imobiliaria.plano);

export function CorretorField({
  value,
  onChange,
  label = "Corretor responsável",
  comRodizio,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  /** Mostra a opção "Rodízio" quando o rodízio de leads está ligado. */
  comRodizio?: boolean;
}) {
  const opcoes = corretoresAtivos().map((c) => ({ value: c.id, label: c.nome }));
  return (
    <Field label={label} hint={value === RODIZIO ? "Vai para o próximo corretor da fila do rodízio." : undefined}>
      <SelectField
        value={value}
        onChange={onChange}
        placeholder="Selecione"
        options={comRodizio && rodizioLigado() ? [{ value: RODIZIO, label: "Rodízio (próximo da fila)" }, ...opcoes] : opcoes}
      />
    </Field>
  );
}

/** Para o administrador, escolhe o corretor; para o corretor (e no plano Solo), é sempre ele mesmo. */
export function useTargetCorretor(open: boolean) {
  const { isAdmin: admin, user } = useScope();
  const isAdmin = admin && !ehSolo(imobiliaria.plano);
  const [corretorId, setCorretorId] = useState(isAdmin ? "" : user.id);
  useEffect(() => {
    if (open) setCorretorId(isAdmin ? "" : user.id);
  }, [open, isAdmin, user.id]);
  return { isAdmin, corretorId, setCorretorId };
}

const num = (s: string) => Number(s.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;

// ---------- Novo lead ----------

export function LeadFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addLead, filaRodizio, toast } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const [f, setF] = useState({ nome: "", telefone: "", interesse: "", origem: ORIGENS[0] });
  const [liga, setLiga] = useState<{ captacaoId?: string; imovelId?: string; unidade?: string }>({});
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (open) setF({ nome: "", telefone: "", interesse: "", origem: ORIGENS[0] });
    if (open) setLiga({});
    // Rodízio ligado: o administrador já começa com "Rodízio" escolhido
    if (open && isAdmin && rodizioLigado()) setCorretorId(RODIZIO);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const ok = f.nome.trim() && normalizePhone(f.telefone).length >= 12 && corretorId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner
      title="Novo lead"
      subtitle="O lead entra na etapa “Novo”, aguardando atendimento."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar
            disabled={!ok || salvando}
            depois={onClose}
            onSalvar={async () => {
              let dono = corretorId;
              if (dono === RODIZIO) {
                setSalvando(true);
                dono = (await filaRodizio())[0] ?? "";
                setSalvando(false);
                if (!dono) {
                  toast("Ninguém na fila do rodízio. Confira em Equipe → Rodízio de leads.");
                  return false;
                }
              }
              addLead({
                corretorId: dono,
                nome: f.nome.trim(),
                telefone: normalizePhone(f.telefone),
                interesse: f.interesse.trim() || rotuloInteresse(liga) || "Não informado",
                interesseCaptacaoId: liga.captacaoId,
                interesseImovelId: liga.imovelId,
                interesseUnidade: liga.unidade,
                origem: f.origem,
                ...(corretorId === RODIZIO ? { rodizio: true, atribuidoEm: new Date().toISOString() } : {}),
              });
              if (corretorId === RODIZIO) toast(`Lead entregue a ${pessoa(dono).nome.split(" ")[0]} pelo rodízio.`);
            }}
          >
            {salvando ? "Cadastrando..." : "Cadastrar lead"}
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <input autoFocus className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome do cliente" />
        </Field>
        <Field label="WhatsApp" hint="Com DDD. Ex.: (11) 98765-4321">
          <input className={inputCls} inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 98765-4321" />
        </Field>
        <Field label="Origem">
          <SelectField value={f.origem} onChange={(v) => setF({ ...f, origem: v })} options={ORIGENS.map((o) => ({ value: o, label: o }))} />
        </Field>
        <Field label="Interesse" className="sm:col-span-2">
          <input className={inputCls} value={f.interesse} onChange={(e) => setF({ ...f, interesse: e.target.value })} placeholder="Ex.: apartamento 2 dorms perto do metrô" />
        </Field>
        <div className="sm:col-span-2">
          <EnderecoPicker captacoes rotulo="Interessado em (opcional)" valor={liga} onChange={setLiga} />
        </div>
        {isAdmin && (
          <div className="sm:col-span-2">
            <CorretorField value={corretorId} onChange={setCorretorId} comRodizio />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ---------- Novo proprietário ----------

export function ProprietarioFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addProprietario } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const [f, setF] = useState({ nome: "", whatsapp: "" });
  const [ligados, setLigados] = useState<EnderecoLigado[]>([]);
  useEffect(() => {
    if (open) setF({ nome: "", whatsapp: "" });
    if (open) setLigados([]);
  }, [open]);
  const ok = f.nome.trim() && normalizePhone(f.whatsapp).length >= 12 && corretorId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner
      title="Novo proprietário"
      subtitle="O WhatsApp é usado para enviar os relatórios de divulgação."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar
            disabled={!ok}
            depois={onClose}
            onSalvar={() => {
              addProprietario({ corretorId, nome: f.nome.trim(), whatsapp: normalizePhone(f.whatsapp), imoveis: ligados });
            }}
          >
            Cadastrar proprietário
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Nome">
          <input autoFocus className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome do proprietário" />
        </Field>
        <Field label="WhatsApp" hint="Com DDD. Ex.: (11) 98765-4321">
          <input className={inputCls} inputMode="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} placeholder="(11) 98765-4321" />
        </Field>
        {isAdmin && <CorretorField value={corretorId} onChange={setCorretorId} />}
        <div>
          <p className="mb-2 text-sm font-semibold">Imóveis deste proprietário (opcional)</p>
          <ListaEnderecos lista={ligados} onChange={setLigados} />
        </div>
      </div>
    </Modal>
  );
}

// ---------- Novo imóvel (lugar físico) ----------

/** Endereço e edifício do imóvel: cadastra um novo ou, com `imovel`, edita o existente. */
export function ImovelFormModal({
  open,
  onClose,
  categoriaInicial,
  onCreated,
  imovel,
}: {
  open: boolean;
  onClose: () => void;
  categoriaInicial?: CategoriaImovel;
  onCreated?: (id: string) => void;
  imovel?: Imovel;
}) {
  const { addImovel, updateImovel } = useStore();
  const criado = useRef<string | null>(null);
  const cidadePadrao = imobiliaria.cidade.split(",")[0]?.trim() ?? "";
  const ufPadrao = imobiliaria.cidade.split(",")[1]?.trim() ?? "SP";
  const empty = () =>
    imovel
      ? { categoria: imovel.categoria, nome: imovel.nome ?? "", cep: imovel.cep ?? "", ...imovel.endereco }
      : { categoria: categoriaInicial ?? ("Apartamento" as CategoriaImovel), nome: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: cidadePadrao, uf: ufPadrao };
  const [f, setF] = useState(empty);
  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [buscando, setBuscando] = useState<"" | "cep" | "mapa">("");
  const [avisoMapa, setAvisoMapa] = useState("");
  useEffect(() => {
    if (open) {
      setF(empty());
      setPonto(imovel?.lat !== undefined && imovel?.lng !== undefined ? { lat: imovel.lat, lng: imovel.lng } : null);
      setAvisoMapa("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoriaInicial]);

  // CEP completo: preenche rua, bairro, cidade e estado
  const mudarCep = async (v: string) => {
    const cep = v.replace(/\D/g, "").slice(0, 8);
    setF((x) => ({ ...x, cep }));
    if (cep.length !== 8) return;
    setBuscando("cep");
    const r = await buscarCep(cep);
    setBuscando("");
    if (r) {
      setF((x) => ({ ...x, logradouro: r.logradouro || x.logradouro, bairro: r.bairro || x.bairro, cidade: r.cidade, uf: r.uf || x.uf }));
      setPonto(null);
    } else setAvisoMapa("CEP não encontrado. Preencha o endereço à mão.");
  };

  // Mudou a rua ou o número: a posição antiga no mapa deixa de valer
  const mudarEndereco = (patch: Partial<typeof f>) => {
    setF((x) => ({ ...x, ...patch }));
    if (patch.logradouro !== undefined || patch.numero !== undefined || patch.cidade !== undefined) setPonto(null);
  };

  const localizarNoMapa = async () => {
    setAvisoMapa("");
    setBuscando("mapa");
    const p = await localizar({ ...endereco, cep: f.cep || undefined });
    setBuscando("");
    if (p) setPonto(p);
    else setAvisoMapa("Não encontramos este endereço no mapa. Confira rua, número e cidade.");
  };

  // Edifício/condomínio pede o nome; casa, galpão, terreno pedem um título. Endereço novo sempre com o ponto no mapa.
  const comNome = ehPredio({ categoria: f.categoria } as Imovel);
  const perto = ponto ? enderecoPerto(ponto, imovel?.id) : undefined;
  const ok =
    f.logradouro.trim() && f.numero.trim() && f.bairro.trim() && f.cidade.trim() && f.uf && f.nome.trim() && (!!ponto || (!!imovel && imovel.lat === undefined));
  const endereco = { logradouro: f.logradouro.trim(), numero: f.numero.trim(), bairro: f.bairro.trim(), cidade: f.cidade.trim(), uf: f.uf };

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner={!imovel}
      title={imovel ? "Editar endereço" : "Novo endereço"}
      subtitle={
        imovel
          ? "Vale para todas as captações deste endereço (por exemplo, outros apartamentos do mesmo prédio)."
          : "O endereço é o lugar físico (prédio, casa, galpão...). Depois ele é usado nas captações, estudos e leads."
      }
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar
            disabled={!ok}
            depois={() => {
              onClose();
              if (criado.current) onCreated?.(criado.current);
            }}
            onSalvar={() => {
              criado.current = null;
              const dados = { categoria: f.categoria, nome: f.nome.trim() || undefined, endereco, cep: f.cep.length === 8 ? f.cep : undefined, lat: ponto?.lat, lng: ponto?.lng };
              if (imovel) {
                updateImovel(imovel.id, dados);
                return;
              }
              criado.current = addImovel(dados).id;
            }}
          >
            {imovel ? "Salvar endereço" : "Cadastrar endereço"}
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <Field label="Tipo" className="sm:col-span-6">
          <SelectField value={f.categoria} onChange={(v) => setF({ ...f, categoria: v as CategoriaImovel })} options={OPCOES_TIPO} />
        </Field>
        <Field
          label={comNome ? "Nome do edifício ou condomínio" : "Título"}
          className="sm:col-span-6"
          hint={comNome ? "Ex.: Edifício Montpellier. As unidades (apto, cobertura, sala) entram na captação." : "Ex.: Casa térrea na Pedreira; Galpão Logístico Norte."}
        >
          <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <Field label="CEP" className="sm:col-span-2" hint={buscando === "cep" ? "Buscando endereço..." : "Preenche o endereço sozinho."}>
          <input
            className={inputCls}
            inputMode="numeric"
            value={f.cep.length > 5 ? `${f.cep.slice(0, 5)}-${f.cep.slice(5)}` : f.cep}
            onChange={(e) => mudarCep(e.target.value)}
            placeholder="00000-000"
          />
        </Field>
        <div className="hidden sm:col-span-4 sm:block" />
        <Field label="Logradouro (tipo e nome)" className="sm:col-span-4">
          <input className={inputCls} value={f.logradouro} onChange={(e) => mudarEndereco({ logradouro: e.target.value })} placeholder="Ex.: Av. Senador Lemos" />
        </Field>
        <Field label="Número" className="sm:col-span-2">
          <input className={inputCls} value={f.numero} onChange={(e) => mudarEndereco({ numero: e.target.value })} placeholder="78" />
        </Field>
        <Field label="Bairro" className="sm:col-span-6">
          <input list="bairros-imovel" className={inputCls} value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} placeholder="Ex.: Umarizal" />
          <datalist id="bairros-imovel">
            {bairrosCadastrados().map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Cidade" className="sm:col-span-4">
          <input className={inputCls} value={f.cidade} onChange={(e) => mudarEndereco({ cidade: e.target.value })} placeholder="Ex.: Belém" />
        </Field>
        <Field label="Estado" className="sm:col-span-2">
          <SelectField value={f.uf} onChange={(v) => setF({ ...f, uf: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
        </Field>
        {ok && (
          <p className="rounded-xl bg-canvas px-4 py-3 text-sm sm:col-span-6">
            <span className="text-xs text-muted">Vai aparecer assim: </span>
            <span className="font-semibold">{f.nome.trim() ? `${f.nome.trim()} · ` : ""}</span>
            {enderecoCompleto(endereco)}
          </p>
        )}
        {/* Localização no mapa (obrigatória no endereço novo): o marcador pode ser arrastado até o ponto exato */}
        <div className="space-y-2 sm:col-span-6">
          {ponto ? (
            <>
              <Mapa lat={ponto.lat} lng={ponto.lng} onMover={setPonto} className="h-52" />
              <p className="text-xs text-muted">Se o marcador não estiver no lugar certo, arraste-o até o imóvel.</p>
            </>
          ) : (
            <button type="button" disabled={!ok || buscando === "mapa"} onClick={localizarNoMapa} className={`${btn.outline} w-full`}>
              <MapPin className="size-4" /> {buscando === "mapa" ? "Localizando..." : "Marcar no mapa"}
            </button>
          )}
          {!ponto && <p className="text-xs text-muted">Obrigatório: marque o ponto exato no mapa (dá para arrastar o marcador).</p>}
          {perto && (
            <p className="flex items-start gap-1.5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Atenção: já existe {nomePredio(perto.im)} a {Math.round(perto.m)} m deste ponto. Confira se não é o mesmo endereço antes de cadastrar.
            </p>
          )}
          {avisoMapa && <p className="text-xs font-medium text-amber-700">{avisoMapa}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Nova captação ----------

/** Mesmo endereço = mesmo imóvel (ex.: outro apartamento do mesmo prédio). */
export const chaveEndereco = (e: { logradouro: string; numero: string; cidade: string }) =>
  [e.logradouro, e.numero, e.cidade].map((x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");

/**
 * NOVA CAPTAÇÃO = cadastro único do imóvel.
 * O endereço é preenchido aqui mesmo (CEP e mapa); o "imóvel" (lugar físico) é criado por trás,
 * ou reaproveitado quando o endereço já existe (outra unidade do mesmo prédio). O estudo de mercado continua igual.
 */
/** Campos do "Novo imóvel" vindos de um prédio já cadastrado. */
const camposDoPredio = (p: Imovel) => ({
  categoria: p.categoria,
  nome: p.nome ?? "",
  cep: p.cep ?? "",
  logradouro: p.endereco.logradouro,
  numero: p.endereco.numero,
  bairro: p.endereco.bairro,
  cidade: p.endereco.cidade,
  uf: p.endereco.uf,
});

export function CaptacaoFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCaptacao, addProprietario, addImovel, salvarAnuncio, setLocalImovel } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const cidadePadrao = imobiliaria.cidade.split(",")[0]?.trim() ?? "";
  const ufPadrao = imobiliaria.cidade.split(",")[1]?.trim() ?? "SP";
  const empty = () => ({
    finalidade: "venda" as Finalidade,
    categoria: "Apartamento" as CategoriaImovel,
    nome: "",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: cidadePadrao,
    uf: ufPadrao,
    unidade: "",
    area: "",
    valor: "",
    quartos: "",
    suites: "",
    banheiros: "",
    vagas: "",
    /** Prédio do apartamento/sala: "" = não escolhido, "novo" = cadastrar agora, ou o id do prédio. */
    predioId: "",
    modo: "novo" as "existente" | "novo",
    proprietarioId: "",
    propNome: "",
    propWhats: "",
  });
  const [f, setF] = useState(empty);
  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [buscando, setBuscando] = useState<"" | "cep" | "mapa">("");
  const [avisoMapa, setAvisoMapa] = useState("");
  useEffect(() => {
    if (open) {
      // Vindo de um estudo de mercado com exclusividade assinada: já abre com os dados do imóvel
      const doEstudo = lerCaptacaoDoEstudo();
      if (doEstudo) {
        const { lat, lng, ...campos } = doEstudo;
        setF({ ...empty(), ...(campos as Partial<ReturnType<typeof empty>>) });
        setPonto(lat !== undefined && lng !== undefined ? { lat, lng } : null);
      } else {
        // Vindo da ficha de um prédio ("Novo imóvel neste prédio"): já abre com o endereço dele
        const predio = imoveis.find((i) => i.id === new URLSearchParams(window.location.search).get("predio"));
        setF(predio ? { ...empty(), ...camposDoPredio(predio), predioId: ehPredio(predio) ? predio.id : "" } : empty());
        setPonto(predio?.lat !== undefined && predio.lng !== undefined ? { lat: predio.lat, lng: predio.lng } : null);
      }
      setAvisoMapa("");
    } else limparCaptacaoDoEstudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const props = useMemo(() => (corretorId ? proprietariosOf({ corretorId }) : []), [corretorId, open]); // eslint-disable-line react-hooks/exhaustive-deps
  const predios = useMemo(() => imoveis.filter(ehPredio).sort((a, b) => nomePredio(a).localeCompare(nomePredio(b), "pt-BR")), [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const comUnidade = CATEGORIAS_COM_UNIDADE.includes(f.categoria);
  const valor = num(f.valor);
  const area = num(f.area);
  const endereco = { logradouro: f.logradouro.trim(), numero: f.numero.trim(), bairro: f.bairro.trim(), cidade: f.cidade.trim(), uf: f.uf };
  const enderecoOk = endereco.logradouro && endereco.numero && endereco.bairro && endereco.cidade && endereco.uf;
  // Prédio/casa já cadastrado no mesmo endereço?
  const existente = enderecoOk ? imoveis.find((i) => chaveEndereco(i.endereco) === chaveEndereco(endereco)) : undefined;
  const propOk = f.modo === "existente" ? !!f.proprietarioId : f.propNome.trim() && normalizePhone(f.propWhats).length >= 12;
  const comPredio = pedePredio(f.categoria);
  // Apartamento, sala etc.: o prédio vem da lista (ou é cadastrado agora). Casa, galpão, terreno: título + endereço.
  const mostrarEndereco = !comPredio || f.predioId === "novo";
  const predioOk = !comPredio || (f.predioId === "novo" ? !!f.nome.trim() : !!f.predioId);
  const tituloOk = comPredio || !!existente || !!f.nome.trim();
  // Endereço novo sempre com o ponto exato no mapa (nunca só pelo nome)
  const mapaOk = !!ponto || existente?.lat !== undefined;
  const perto = ponto && !existente ? enderecoPerto(ponto) : undefined;
  const ok =
    corretorId && enderecoOk && valor > 0 && area > 0 && propOk && (!comUnidade || f.unidade.trim()) && predioOk && tituloOk && mapaOk;
  const usarEndereco = (p: Imovel) => {
    setF((x) => ({ ...x, ...camposDoPredio(p), categoria: x.categoria, predioId: ehPredio(p) && pedePredio(x.categoria) ? p.id : "" }));
    setPonto(p.lat !== undefined && p.lng !== undefined ? { lat: p.lat, lng: p.lng } : null);
    setAvisoMapa("");
  };
  const escolherPredio = (id: string) => {
    if (id === "novo") {
      setF((x) => ({ ...x, predioId: "novo", nome: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: cidadePadrao, uf: ufPadrao }));
      setPonto(null);
      setAvisoMapa("");
      return;
    }
    const p = imoveis.find((i) => i.id === id);
    if (p) usarEndereco(p);
  };
  const inteiro = (s: string) => (s.trim() === "" ? undefined : Math.min(50, Math.max(0, Number(s.replace(/\D/g, "")) || 0)));

  const mudarCep = async (v: string) => {
    const cep = v.replace(/\D/g, "").slice(0, 8);
    setF((x) => ({ ...x, cep }));
    if (cep.length !== 8) return;
    setBuscando("cep");
    const r = await buscarCep(cep);
    setBuscando("");
    if (r) {
      setF((x) => ({ ...x, logradouro: r.logradouro || x.logradouro, bairro: r.bairro || x.bairro, cidade: r.cidade, uf: r.uf || x.uf }));
      setPonto(null);
      setAvisoMapa("");
    } else setAvisoMapa("CEP não encontrado. Preencha o endereço à mão.");
  };

  const localizarNoMapa = async () => {
    setAvisoMapa("");
    setBuscando("mapa");
    const p = await localizar({ ...endereco, cep: f.cep || undefined });
    setBuscando("");
    if (p) setPonto(p);
    else setAvisoMapa("Não encontramos este endereço no mapa. Confira rua, número e cidade.");
  };

  const save = () => {
    // 1) imóvel: reaproveita o do mesmo endereço ou cria um novo
    let imovelId = existente?.id;
    if (existente) {
      if (ponto && existente.lat === undefined) setLocalImovel(existente.id, ponto.lat, ponto.lng);
    } else {
      imovelId = addImovel({
        categoria: f.categoria,
        nome: f.nome.trim() || undefined,
        endereco,
        cep: f.cep.length === 8 ? f.cep : undefined,
        lat: ponto?.lat,
        lng: ponto?.lng,
      }).id;
    }
    // 2) proprietário
    const proprietarioId =
      f.modo === "existente" ? f.proprietarioId : addProprietario({ corretorId, nome: f.propNome.trim(), whatsapp: normalizePhone(f.propWhats) }).id;
    // 3) captação + cômodos (ficam no anúncio, prontos para quando for publicar)
    const c = addCaptacao({ corretorId, proprietarioId, imovelId: imovelId!, unidade: f.unidade.trim() || undefined, finalidade: f.finalidade, valor, areaM2: area });
    const comodos = { quartos: inteiro(f.quartos), suites: inteiro(f.suites), banheiros: inteiro(f.banheiros), vagas: inteiro(f.vagas) };
    // Ficha do prédio: o condomínio e o lazer/segurança já vão para o anúncio
    const doPredio = existente
      ? { ...(existente.condominioMedio ? { condominio: existente.condominioMedio } : {}), ...(existente.caracteristicas?.length ? { caracteristicas: [...existente.caracteristicas] } : {}) }
      : {};
    if (Object.values(comodos).some((x) => x !== undefined) || Object.keys(doPredio).length) salvarAnuncio(c.id, { ...comodos, ...doPredio }, "");
  };

  const campoNum = (k: "quartos" | "suites" | "banheiros" | "vagas", label: string) => (
    <Field label={label}>
      <input className={inputCls} inputMode="numeric" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value.replace(/\D/g, "").slice(0, 2) })} />
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner
      title="Novo imóvel"
      subtitle="Cadastre o imóvel captado de uma vez: endereço, dados e proprietário. Publicar no portal é opcional."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar disabled={!ok} onSalvar={save} depois={onClose}>
            Cadastrar imóvel
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-6">
          <span className="text-xs font-semibold text-muted">Finalidade</span>
          <Segmented
            id="cap-finalidade"
            size="sm"
            value={f.finalidade}
            onChange={(v) => setF({ ...f, finalidade: v })}
            options={[
              { value: "venda", label: "Venda" },
              { value: "locacao", label: "Locação" },
            ]}
          />
        </div>
        {isAdmin && (
          <div className="sm:col-span-6">
            <CorretorField
              label="Corretor captador"
              value={corretorId}
              onChange={(v) => {
                setCorretorId(v);
                setF((x) => ({ ...x, proprietarioId: "" }));
              }}
            />
          </div>
        )}
        <Field label="Tipo de imóvel" className="sm:col-span-6">
          <SelectField
            value={f.categoria}
            onChange={(v) => {
              const prox = v as CategoriaImovel;
              // Trocou entre "dentro de prédio" e "casa/galpão/terreno": recomeça a escolha do endereço
              if (pedePredio(prox) !== pedePredio(f.categoria)) {
                setF({ ...f, categoria: prox, predioId: "", nome: "", cep: "", logradouro: "", numero: "", bairro: "", cidade: cidadePadrao, uf: ufPadrao, unidade: "" });
                setPonto(null);
              } else setF({ ...f, categoria: prox });
            }}
            options={OPCOES_TIPO}
          />
        </Field>
        {comPredio && (
          <Field label="Edifício ou condomínio" className="sm:col-span-6" hint="Escolha da lista de Endereços ou cadastre um novo (com o ponto exato no mapa).">
            <SelectField
              value={f.predioId}
              onChange={escolherPredio}
              placeholder="Escolha o prédio..."
              options={[{ value: "novo", label: "+ Cadastrar novo edifício ou condomínio" }, ...predios.map((p) => ({ value: p.id, label: `${nomePredio(p)} · ${p.endereco.bairro}` }))]}
            />
          </Field>
        )}
        {comPredio && f.predioId && f.predioId !== "novo" && existente && (
          <p className="flex items-start gap-1.5 rounded-xl bg-accent-soft/60 px-3 py-2.5 text-xs text-accent-deep sm:col-span-6">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            {enderecoCompleto(existente.endereco)}
            {(existente.condominioMedio || (existente.caracteristicas?.length ?? 0) > 0) && ". O condomínio e o lazer do prédio já entram no anúncio."}
          </p>
        )}
        {!comPredio && (
          <Field label="Título do imóvel" className="sm:col-span-6" hint="Ex.: Casa térrea na Pedreira; Galpão da BR-316. Ajuda a achar o imóvel nas listas.">
            <input className={inputCls} value={existente?.nome ? existente.nome : f.nome} disabled={!!existente?.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
        )}

        {/* Endereço */}
        {mostrarEndereco && (
          <>
        <p className="-mb-1 text-sm font-semibold sm:col-span-6">{comPredio ? "Novo edifício ou condomínio" : "Endereço"}</p>
        {comPredio && (
          <Field label="Nome do edifício ou condomínio" className="sm:col-span-6" hint="Ex.: Edifício Montpellier">
            <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
        )}
        <Field label="CEP" className="sm:col-span-2" hint={buscando === "cep" ? "Buscando endereço..." : "Preenche o endereço sozinho."}>
          <input
            className={inputCls}
            inputMode="numeric"
            value={f.cep.length > 5 ? `${f.cep.slice(0, 5)}-${f.cep.slice(5)}` : f.cep}
            onChange={(e) => mudarCep(e.target.value)}
            placeholder="00000-000"
          />
        </Field>
        <div className="hidden sm:col-span-4 sm:block" />
        <Field label="Logradouro (tipo e nome)" className="sm:col-span-4">
          <input className={inputCls} value={f.logradouro} onChange={(e) => setF({ ...f, logradouro: e.target.value })} placeholder="Ex.: Av. Senador Lemos" />
        </Field>
        <Field label="Número do prédio/casa" className="sm:col-span-2">
          <input className={inputCls} value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} placeholder="78" />
        </Field>
        <Field label="Bairro" className="sm:col-span-6">
          <input list="bairros-imovel" className={inputCls} value={f.bairro} onChange={(e) => setF({ ...f, bairro: e.target.value })} placeholder="Ex.: Umarizal" />
          <datalist id="bairros-imovel">
            {bairrosCadastrados().map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
        </Field>
        <Field label="Cidade" className="sm:col-span-4">
          <input className={inputCls} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="Ex.: Belém" />
        </Field>
        <Field label="Estado" className="sm:col-span-2">
          <SelectField value={f.uf} onChange={(v) => setF({ ...f, uf: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
        </Field>
        {existente && (
          <p className="flex items-start gap-1.5 rounded-xl bg-accent-soft/60 px-3 py-2.5 text-xs text-accent-deep sm:col-span-6">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Este endereço já está cadastrado{existente.nome ? ` (${existente.nome})` : ""}. O imóvel será ligado a ele.
            {(existente.condominioMedio || (existente.caracteristicas?.length ?? 0) > 0) && " O condomínio e o lazer do prédio já entram no anúncio."}
          </p>
        )}
          </>
        )}
        {comUnidade && (
          <Field
            label={unidadeEhSala(f.categoria) ? "Número da sala" : "Número do apartamento"}
            className="sm:col-span-6"
            hint={unidadeEhSala(f.categoria) ? "Ex.: 1204 (aparece como Sala 1204)" : "Ex.: 302 (aparece como Apto 302). Para cobertura ou studio, escreva: Cobertura 1801"}
          >
            <input className={inputCls} value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} />
          </Field>
        )}
        <div className={`space-y-2 sm:col-span-6 ${!comPredio || f.predioId ? "" : "hidden"}`}>
          {ponto ? (
            <>
              <Mapa lat={ponto.lat} lng={ponto.lng} onMover={setPonto} className="h-48" />
              <p className="text-xs text-muted">Se o marcador não estiver no lugar certo, arraste-o até o imóvel.</p>
            </>
          ) : (
            existente?.lat === undefined && (
              <>
                <button type="button" disabled={!enderecoOk || buscando === "mapa"} onClick={localizarNoMapa} className={`${btn.outline} w-full`}>
                  <MapPin className="size-4" /> {buscando === "mapa" ? "Localizando..." : "Marcar no mapa"}
                </button>
                {enderecoOk && <p className="text-xs text-muted">Obrigatório: marque o ponto exato do imóvel no mapa (dá para arrastar o marcador).</p>}
              </>
            )
          )}
          {perto && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
              <Info className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1">
                Já existe <strong>{nomePredio(perto.im)}</strong> a {Math.round(perto.m)} m deste ponto. É o mesmo endereço?
              </span>
              <button type="button" onClick={() => usarEndereco(perto.im)} className="rounded-full bg-white px-3 py-1 font-semibold text-amber-800 shadow-sm">
                Usar este
              </button>
            </div>
          )}
          {avisoMapa && <p className="text-xs font-medium text-amber-700">{avisoMapa}</p>}
        </div>

        {/* Dados do imóvel */}
        <p className="-mb-1 text-sm font-semibold sm:col-span-6">Dados do imóvel</p>
        <Field label="Área (m²)" className="sm:col-span-2">
          <input className={inputCls} inputMode="decimal" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} placeholder="Ex.: 92" />
        </Field>
        <Field
          label={f.finalidade === "venda" ? "Valor de venda" : "Aluguel mensal"}
          className="sm:col-span-4"
          hint={valor ? valorLabel(f.finalidade, valor) + (area ? ` · ${brl(valor / area)}/m²` : "") : undefined}
        >
          <input className={inputCls} inputMode="numeric" value={f.valor} onChange={(e) => setF({ ...f, valor: mascaraMoeda(e.target.value) })} placeholder={f.finalidade === "venda" ? "Ex.: 850.000,00" : "Ex.: 4.200,00"} />
        </Field>
        <div className="grid grid-cols-4 gap-3 sm:col-span-6">
          {campoNum("quartos", "Quartos")}
          {campoNum("suites", "Suítes")}
          {campoNum("banheiros", "Banheiros")}
          {campoNum("vagas", "Vagas")}
        </div>

        {/* Proprietário */}
        <div className="sm:col-span-6">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">Proprietário</span>
            <Segmented
              id="prop-modo"
              size="sm"
              value={f.modo}
              onChange={(v) => setF({ ...f, modo: v })}
              options={[
                { value: "novo", label: "Cadastrar novo" },
                { value: "existente", label: "Escolher da lista" },
              ]}
            />
          </div>
          {f.modo === "existente" ? (
            <SelectField
              value={f.proprietarioId}
              onChange={(v) => setF({ ...f, proprietarioId: v })}
              placeholder={corretorId ? (props.length ? "Selecione o proprietário" : "Nenhum proprietário cadastrado") : "Escolha o corretor primeiro"}
              options={props.map((p) => ({ value: p.id, label: p.nome }))}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={inputCls} value={f.propNome} onChange={(e) => setF({ ...f, propNome: e.target.value })} placeholder="Nome do proprietário" />
              <input className={inputCls} inputMode="tel" value={f.propWhats} onChange={(e) => setF({ ...f, propWhats: e.target.value })} placeholder="WhatsApp com DDD" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Parceiro externo ----------

export function ParceiroFormModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (id: string) => void }) {
  const { addParceiro } = useStore();
  const criado = useRef<string | null>(null);
  const [f, setF] = useState({ nome: "", creci: "", empresa: "", telefone: "" });
  useEffect(() => {
    if (open) setF({ nome: "", creci: "", empresa: "", telefone: "" });
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner
      title="Novo parceiro externo"
      subtitle="Corretor de fora da imobiliária. Ele não recebe acesso; serve só para registrar parcerias."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar
            disabled={!f.nome.trim()}
            depois={() => {
              onClose();
              if (criado.current) onCreated?.(criado.current);
            }}
            onSalvar={() => {
              criado.current = null;
              const p = addParceiro({
                nome: f.nome.trim(),
                creci: f.creci.trim() || undefined,
                empresa: f.empresa.trim() || undefined,
                telefone: f.telefone ? normalizePhone(f.telefone) : undefined,
              });
              criado.current = p.id;
            }}
          >
            Cadastrar parceiro
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2">
          <input autoFocus className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <Field label="CRECI">
          <input className={inputCls} value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} placeholder="Ex.: 58231-F" />
        </Field>
        <Field label="Imobiliária ou autônomo">
          <input className={inputCls} value={f.empresa} onChange={(e) => setF({ ...f, empresa: e.target.value })} placeholder="Ex.: Autônomo" />
        </Field>
        <Field label="WhatsApp" className="sm:col-span-2">
          <input className={inputCls} inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 98765-4321" />
        </Field>
      </div>
    </Modal>
  );
}

// ---------- Registrar venda/locação (só administrador) ----------

const today = () => new Date().toISOString().slice(0, 10);

export function TransacaoFormModal({
  open,
  onClose,
  captacaoId,
  fechamento,
}: {
  open: boolean;
  onClose: () => void;
  captacaoId?: string;
  fechamento?: FechamentoInformado;
}) {
  const { addTransacao } = useStore();
  const [tipo, setTipo] = useState<Finalidade>("venda");
  const [f, setF] = useState({ captacaoId: "", valor: "", honorarios: "6", cliente: "", data: today() });
  const [parts, setParts] = useState<Participante[]>([]);
  const [novoParceiro, setNovoParceiro] = useState<number | null>(null);

  const iniciar = (cid: string, t: Finalidade, valor?: number, data?: string) => {
    const c = captacaoById(cid);
    setTipo(t);
    setF({ captacaoId: cid, valor: moeda(valor ?? c?.valor), honorarios: String(HONORARIOS_PADRAO[t]), cliente: "", data: data ?? today() });
    setParts(c ? [{ tipo: "corretor", refId: c.corretorId, pct: 50 }] : []);
  };

  useEffect(() => {
    if (!open) return;
    if (fechamento) iniciar(fechamento.captacaoId, fechamento.tipo, fechamento.valor, fechamento.data.slice(0, 10));
    else if (captacaoId) iniciar(captacaoId, captacaoById(captacaoId)?.finalidade ?? "venda");
    else {
      setTipo("venda");
      setF({ captacaoId: "", valor: "", honorarios: "6", cliente: "", data: today() });
      setParts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, captacaoId, fechamento?.id]);

  const disponiveis = captacoesOf({}).filter((c) => c.status === "ativa" && c.finalidade === tipo);
  const cap = f.captacaoId ? captacaoById(f.captacaoId) : undefined;
  const valor = num(f.valor);
  const honPct = num(f.honorarios);
  const totalHon = (valor * honPct) / 100;
  const soma = parts.reduce((s, p) => s + p.pct, 0);
  const partsOk = parts.length > 0 && parts.every((p) => p.refId && p.pct > 0) && soma <= 100;
  const ok = cap && valor > 0 && honPct > 0 && partsOk && f.data;

  const setPart = (i: number, patch: Partial<Participante>) => setParts((ps) => ps.map((p, k) => (k === i ? { ...p, ...patch } : p)));

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        banner
        title={tipo === "venda" ? "Registrar venda" : "Registrar locação"}
        subtitle="Somente o administrador registra. Defina os honorários e quem recebe cada parte."
        footer={
          <>
            <button onClick={onClose} className={btn.outline}>
              Cancelar
            </button>
            <BotaoSalvar
              disabled={!ok}
              className={btn.accent}
              depois={onClose}
              onSalvar={() => {
                addTransacao(
                  {
                    tipo,
                    captacaoId: cap!.id,
                    valor,
                    honorariosPct: honPct,
                    data: new Date(`${f.data}T12:00:00`).toISOString(),
                    cliente: f.cliente.trim() || undefined,
                    participantes: parts,
                  },
                  fechamento?.id,
                );
              }}
            >
              {tipo === "venda" ? "Registrar venda" : "Registrar locação"}
            </BotaoSalvar>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {fechamento && (
            <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                Informado por <span className="font-semibold">{userById(fechamento.corretorId)?.nome}</span>
                {fechamento.observacao && <> — “{fechamento.observacao}”</>}. Confira os valores antes de registrar.
              </span>
            </p>
          )}
          {!fechamento && !captacaoId && (
            <div className="flex items-center justify-between sm:col-span-2">
              <span className="text-xs font-semibold text-muted">Tipo</span>
              <Segmented
                id="tr-tipo"
                size="sm"
                value={tipo}
                onChange={(v) => {
                  setTipo(v);
                  setF((x) => ({ ...x, captacaoId: "", valor: "", honorarios: String(HONORARIOS_PADRAO[v]) }));
                  setParts([]);
                }}
                options={[
                  { value: "venda", label: "Venda" },
                  { value: "locacao", label: "Locação" },
                ]}
              />
            </div>
          )}
          <Field label="Captação" className="sm:col-span-2">
            <SelectField
              value={f.captacaoId}
              onChange={(v) => iniciar(v, tipo)}
              placeholder={disponiveis.length ? "Selecione a captação" : "Nenhuma captação ativa"}
              options={(cap && !disponiveis.includes(cap) ? [cap, ...disponiveis] : disponiveis).map((c) => ({
                value: c.id,
                label: `${captacaoTitulo(c)} · ${valorLabel(c.finalidade, c.valor)} · ${userById(c.corretorId)?.nome.split(" ")[0]}`,
              }))}
            />
          </Field>
          <Field label={tipo === "venda" ? "Valor da venda" : "Aluguel mensal"} hint={valor ? valorLabel(tipo, valor) : undefined}>
            <input className={inputCls} inputMode="numeric" value={f.valor} onChange={(e) => setF({ ...f, valor: mascaraMoeda(e.target.value) })} placeholder="0,00" />
          </Field>
          <Field label={tipo === "venda" ? "Honorários (% do valor)" : "Honorários (% do 1º aluguel)"} hint={valor ? `Total: ${brl(totalHon)}` : undefined}>
            <input className={inputCls} inputMode="decimal" value={f.honorarios} onChange={(e) => setF({ ...f, honorarios: e.target.value })} />
          </Field>
          <Field label={tipo === "venda" ? "Comprador (opcional)" : "Locatário (opcional)"}>
            <input className={inputCls} value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} />
          </Field>
          <Field label="Data">
            <DateInput value={f.data} max={today()} onChange={(v) => setF({ ...f, data: v })} />
          </Field>

          {/* Divisão dos honorários */}
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <p className="text-sm font-semibold">Divisão dos honorários</p>
                <p className="text-xs text-muted">
                  % dos honorários que cada participante recebe.{" "}
                  {ehSolo(imobiliaria.plano) ? "Sem parceria, os honorários ficam todos com você." : "O restante fica com a imobiliária."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {parts.map((p, i) => (
                <div key={i} className="grid grid-cols-[7.5rem_1fr_4.5rem_auto] items-center gap-2 rounded-xl bg-canvas p-2">
                  <select
                    value={p.tipo}
                    onChange={(e) => setPart(i, { tipo: e.target.value as Participante["tipo"], refId: "" })}
                    className="h-10 rounded-lg border border-line-strong bg-bg px-2 text-xs font-semibold outline-hidden"
                  >
                    <option value="corretor">{ehSolo(imobiliaria.plano) ? "Você" : "Da equipe"}</option>
                    <option value="parceiro">Parceiro externo</option>
                  </select>
                  <div className="flex min-w-0 items-center gap-2">
                  {p.refId && <Avatar user={participanteAvatar(p)} className="size-8 text-[0.5625rem]" />}
                  <select
                    value={p.refId}
                    onChange={(e) => (e.target.value === "__novo" ? setNovoParceiro(i) : setPart(i, { refId: e.target.value }))}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-line-strong bg-bg px-2 text-sm outline-hidden"
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {(p.tipo === "corretor" ? corretoresParaVenda() : parceiros).map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.nome}
                      </option>
                    ))}
                    {p.tipo === "parceiro" && <option value="__novo">+ Cadastrar parceiro…</option>}
                  </select>
                  </div>
                  <label className="relative">
                    <input
                      value={p.pct || ""}
                      onChange={(e) => setPart(i, { pct: num(e.target.value) })}
                      inputMode="decimal"
                      className="h-10 w-full rounded-lg border border-line-strong bg-bg pl-2 pr-6 text-right text-sm outline-hidden"
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted">%</span>
                  </label>
                  <button onClick={() => setParts((ps) => ps.filter((_, k) => k !== i))} aria-label="Remover participante" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="size-4" />
                  </button>
                  {valor > 0 && p.pct > 0 && <p className="col-span-4 -mt-1 px-1 text-xs text-muted">Recebe {brl((totalHon * p.pct) / 100)}</p>}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setParts((ps) => [...ps, { tipo: "corretor", refId: "", pct: 0 }])}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-accent"
            >
              <Plus className="size-3.5" /> Adicionar participante (parceria)
            </button>
            <div className={`mt-3 rounded-xl p-3 text-sm ${soma > 100 ? "bg-rose-50 text-rose-700" : "bg-accent-soft/60"}`}>
              {soma > 100 ? (
                "A soma das partes passou de 100% dos honorários."
              ) : (
                <>
                  {ehSolo(imobiliaria.plano) ? "Participantes" : "Corretores e parceiros"}: <span className="font-semibold">{soma}%</span>
                  {valor > 0 && ` (${brl((totalHon * soma) / 100)})`} · {ehSolo(imobiliaria.plano) ? "Sua conta" : "Imobiliária"}: <span className="font-semibold">{100 - soma}%</span>
                  {valor > 0 && ` (${brl((totalHon * (100 - soma)) / 100)})`}
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
      <ParceiroFormModal
        open={novoParceiro !== null}
        onClose={() => setNovoParceiro(null)}
        onCreated={(id) => {
          if (novoParceiro !== null) setPart(novoParceiro, { refId: id });
        }}
      />
    </>
  );
}

// ---------- Informar fechamento (corretor) ----------

export function InformarFechamentoModal({ open, onClose, captacaoId }: { open: boolean; onClose: () => void; captacaoId?: string }) {
  const { informarFechamento } = useStore();
  const { user } = useScope();
  const minhas = captacoesOf({ corretorId: user.id }).filter((c) => c.status === "ativa");
  const [f, setF] = useState({ captacaoId: "", valor: "", data: today(), obs: "" });
  useEffect(() => {
    if (open) {
      const c = captacaoId ? captacaoById(captacaoId) : undefined;
      setF({ captacaoId: c?.id ?? "", valor: moeda(c?.valor), data: today(), obs: "" });
    }
  }, [open, captacaoId]);
  const cap = f.captacaoId ? captacaoById(f.captacaoId) : undefined;
  const valor = num(f.valor);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Informar fechamento"
      subtitle="O administrador confere os valores, define a divisão e registra a venda ou locação."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar
            disabled={!cap || !valor}
            className={btn.accent}
            depois={onClose}
            onSalvar={() => {
              informarFechamento({ corretorId: user.id, captacaoId: cap!.id, tipo: cap!.finalidade, valor, data: new Date(`${f.data}T12:00:00`).toISOString(), observacao: f.obs.trim() || undefined });
            }}
          >
            Enviar ao administrador
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Captação" className="sm:col-span-2">
          <SelectField
            value={f.captacaoId}
            onChange={(v) => setF({ ...f, captacaoId: v, valor: moeda(captacaoById(v)?.valor) })}
            placeholder={minhas.length ? "Selecione" : "Nenhuma captação ativa"}
            options={minhas.map((c) => ({ value: c.id, label: `${captacaoTitulo(c)} · ${c.finalidade === "venda" ? "Venda" : "Locação"}` }))}
          />
        </Field>
        <Field label={cap?.finalidade === "locacao" ? "Aluguel combinado" : "Valor combinado"} hint={valor && cap ? valorLabel(cap.finalidade, valor) : undefined}>
          <input className={inputCls} inputMode="numeric" value={f.valor} onChange={(e) => setF({ ...f, valor: mascaraMoeda(e.target.value) })} placeholder="0,00" />
        </Field>
        <Field label="Data do fechamento">
          <DateInput value={f.data} max={today()} onChange={(v) => setF({ ...f, data: v })} />
        </Field>
        <Field label="Observações para o administrador" className="sm:col-span-2" hint="Ex.: parceria 50/50 com o corretor X, condições de pagamento...">
          <textarea rows={3} className={`${inputCls} h-auto resize-none py-3`} value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

// ---------- Relatório ao proprietário ----------

export function buildReport(c: Captacao) {
  const prop = proprietarioById(c.proprietarioId);
  const corretor = userById(c.corretorId);
  const im = imovelById(c.imovelId);
  const feitos = c.checklistMarketing.filter(Boolean).length;
  return [
    `Olá, ${prop?.nome.split(" ")[0] ?? ""}! Tudo bem?`,
    "",
    `Segue o relatório de divulgação do seu imóvel (${captacaoTitulo(c)}${im ? `, ${im.endereco.bairro}` : ""}):`,
    "",
    ...CHECKLIST_MARKETING.map((a, i) => `${c.checklistMarketing[i] ? "✅" : "⏳"} ${a}`),
    "",
    `${feitos} de ${CHECKLIST_MARKETING.length} ações concluídas.`,
    "",
    "Qualquer dúvida, estou à disposição.",
    `${corretor?.nome ?? ""} · ${imobiliaria.nome}`,
  ].join("\n");
}

export function ReportModal({ captacao, open, onClose }: { captacao: Captacao; open: boolean; onClose: () => void }) {
  const { toggleMarketing, toast } = useStore();
  const prop = proprietarioById(captacao.proprietarioId);
  const text = buildReport(captacao);
  const last = CHECKLIST_MARKETING.length - 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Relatório ao proprietário"
      subtitle={`Será enviado para ${prop?.nome} pelo WhatsApp.`}
      footer={
        <>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(text);
                toast("Texto copiado.");
              } catch {
                /* clipboard indisponível */
              }
            }}
            className={btn.outline}
          >
            Copiar texto
          </button>
          <a
            href={prop ? waLink(prop.whatsapp, text) : undefined}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              // Enviar o relatório conta como a última ação do checklist de marketing.
              if (!captacao.checklistMarketing[last]) toggleMarketing(captacao.id, last, true);
              onClose();
            }}
            className={btn.whatsapp}
          >
            <WhatsAppIcon className="size-4" /> Enviar pelo WhatsApp
          </a>
        </>
      }
    >
      <div className="rounded-2xl bg-[#e7f8ec] p-4">
        <div className="ml-auto max-w-[92%] whitespace-pre-wrap rounded-2xl rounded-tr-xs bg-white p-4 text-sm leading-relaxed shadow-xs">{text}</div>
      </div>
      <p className="mt-3 text-xs text-subtle">Ao enviar, a ação “Relatório ao proprietário” é marcada automaticamente no checklist.</p>
    </Modal>
  );
}

// ---------- Excluir (lead, proprietário, captação, venda/locação, parceiro) ----------

type TipoExcluir = "lead" | "proprietario" | "captacao" | "transacao" | "parceiro";
const NOME_EXCLUIR: Record<TipoExcluir, string> = {
  lead: "este lead",
  proprietario: "este proprietário",
  captacao: "esta captação",
  transacao: "esta venda/locação",
  parceiro: "este parceiro",
};
const AVISO_EXCLUIR: Record<TipoExcluir, string> = {
  lead: "O histórico, a agenda ligada a ele e os documentos enviados também saem.",
  proprietario: "Os documentos enviados também saem.",
  captacao: "O anúncio e as fotos também saem do portal. O endereço continua cadastrado para outras captações.",
  transacao: "Os valores saem do VGV, da locação e das comissões. O imóvel volta a ficar disponível.",
  parceiro: "Ele deixa de aparecer na lista de parceiros.",
};

/** Botão "Excluir" com confirmação. Não é prática comum, mas fica disponível quando necessário. */
export function BotaoExcluir({ tipo, id, nome, onExcluido, icone }: { tipo: TipoExcluir; id: string; nome: string; onExcluido?: () => void; icone?: boolean }) {
  const { excluir, toast } = useStore();
  const [aberto, setAberto] = useState(false);
  const [indo, setIndo] = useState(false);
  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAberto(true);
        }}
        title={`Excluir ${NOME_EXCLUIR[tipo]}`}
        className={icone ? "grid size-8 place-items-center rounded-full text-muted transition hover:bg-rose-50 hover:text-rose-600" : `${btn.outline} mr-auto text-rose-600`}
      >
        <Trash2 className="size-4" /> {!icone && "Excluir"}
      </button>
      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={`Excluir ${NOME_EXCLUIR[tipo]}?`}
        subtitle={nome}
        footer={
          <>
            <button onClick={() => setAberto(false)} className={btn.outline}>
              Cancelar
            </button>
            <button
              disabled={indo}
              onClick={async () => {
                setIndo(true);
                const erro = await excluir(tipo, id);
                setIndo(false);
                if (erro) return toast(erro);
                setAberto(false);
                onExcluido?.();
              }}
              className={`${btn.primary} !bg-rose-600 hover:!bg-rose-700`}
            >
              <Trash2 className="size-4" /> {indo ? "Excluindo..." : "Excluir"}
            </button>
          </>
        }
      >
        <p className="text-sm text-muted">
          {AVISO_EXCLUIR[tipo]} <span className="font-semibold text-ink">Não dá para desfazer.</span>
        </p>
      </Modal>
    </>
  );
}

// ---------- Seletor de endereço (lead "interessado em" e imóveis do proprietário) ----------

/** Texto do interesse ligado: o imóvel captado ou o endereço (+ unidade). */
export function rotuloInteresse(v: { captacaoId?: string; imovelId?: string; unidade?: string }) {
  if (v.captacaoId) {
    const c = captacaoById(v.captacaoId);
    return c ? captacaoTitulo(c) : "";
  }
  return rotuloLigado(v.imovelId, v.unidade);
}

/** Texto curto de um endereço ligado: "Ed. Solar · Apto 302" ou "Casa térrea na Pedreira". */
export function rotuloLigado(imovelId?: string, unidade?: string) {
  const im = imovelId ? imoveis.find((i) => i.id === imovelId) : undefined;
  if (!im) return "";
  return `${nomePredio(im)}${unidade ? ` · ${unidade}` : ""}`;
}

/**
 * Escolhe um endereço da aba Endereços (ou cadastra um novo na hora, com o mapa).
 * Prédio pede a unidade (apto/sala); casa, galpão e terreno já são o próprio endereço.
 * Com `captacoes`, também lista os imóveis captados (o lead pode estar interessado num imóvel à venda/aluguel).
 */
export function EnderecoPicker({
  valor,
  onChange,
  captacoes: comCaptacoes = false,
  rotulo = "Imóvel ou endereço",
}: {
  valor: { captacaoId?: string; imovelId?: string; unidade?: string };
  onChange: (v: { captacaoId?: string; imovelId?: string; unidade?: string }) => void;
  captacoes?: boolean;
  rotulo?: string;
}) {
  const { scope } = useScope();
  const [novo, setNovo] = useState(false);
  const caps = comCaptacoes ? captacoesOf(scope).filter((c) => c.status === "ativa") : [];
  const lista = [...imoveis].sort((a, b) => nomePredio(a).localeCompare(nomePredio(b), "pt-BR"));
  const atual = valor.captacaoId ? `c:${valor.captacaoId}` : valor.imovelId ? `i:${valor.imovelId}` : "";
  const im = valor.imovelId ? imoveis.find((i) => i.id === valor.imovelId) : undefined;
  return (
    <div className="space-y-2">
      <Field label={rotulo}>
        <SelectField
          value={atual}
          onChange={(v) => {
            if (v === "novo") return setNovo(true);
            if (v.startsWith("c:")) return onChange({ captacaoId: v.slice(2) });
            if (v.startsWith("i:")) return onChange({ imovelId: v.slice(2) });
            onChange({});
          }}
          options={[
            { value: "", label: "Nenhum" },
            ...caps.map((c) => ({ value: `c:${c.id}`, label: `Captado: ${captacaoTitulo(c)} · ${valorLabel(c.finalidade, c.valor)}` })),
            ...lista.map((i) => ({ value: `i:${i.id}`, label: `Endereço: ${nomePredio(i)} · ${i.endereco.bairro}` })),
            { value: "novo", label: "+ Cadastrar novo endereço" },
          ]}
        />
      </Field>
      {im && ehPredio(im) && (
        <Field label={unidadeEhSala(im.categoria) ? "Número da sala" : "Número do apartamento"} hint="Ex.: 302">
          <input
            className={inputCls}
            value={(valor.unidade ?? "").replace(/^(Apto|Sala)\s*/i, "")}
            onChange={(e) => {
              const n = e.target.value.slice(0, 20);
              onChange({ imovelId: im.id, unidade: n.trim() ? `${unidadeEhSala(im.categoria) ? "Sala" : "Apto"} ${n.trim()}` : undefined });
            }}
          />
        </Field>
      )}
      <ImovelFormModal open={novo} onClose={() => setNovo(false)} categoriaInicial="Apartamento" onCreated={(id) => onChange({ imovelId: id })} />
    </div>
  );
}

/** Lista de endereços de um proprietário: mostra, tira e acrescenta (com o mesmo seletor). */
export function ListaEnderecos({ lista, onChange }: { lista: EnderecoLigado[]; onChange: (l: EnderecoLigado[]) => void }) {
  const [novo, setNovo] = useState<{ imovelId?: string; unidade?: string }>({});
  const im = novo.imovelId ? imoveis.find((i) => i.id === novo.imovelId) : undefined;
  const pronto = !!im && (!ehPredio(im) || !!novo.unidade);
  return (
    <div className="space-y-3">
      {lista.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {lista.map((l, i) => (
            <li key={`${l.imovelId}-${l.unidade ?? ""}`} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-deep">
              <MapPin className="size-3.5" /> {rotuloLigado(l.imovelId, l.unidade) || "Endereço excluído"}
              <button type="button" aria-label="Tirar" onClick={() => onChange(lista.filter((_, k) => k !== i))} className="ml-0.5 rounded-full px-1 hover:bg-white/60">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-2xl bg-canvas p-3">
        <EnderecoPicker rotulo="Acrescentar imóvel" valor={novo} onChange={setNovo} />
        <button
          type="button"
          disabled={!pronto}
          onClick={() => {
            if (!lista.some((l) => l.imovelId === novo.imovelId && (l.unidade ?? "") === (novo.unidade ?? ""))) onChange([...lista, { imovelId: novo.imovelId!, unidade: novo.unidade }]);
            setNovo({});
          }}
          className={`${btn.outline} mt-2 h-9 px-3 text-xs`}
        >
          <Plus className="size-3.5" /> Acrescentar
        </button>
      </div>
    </div>
  );
}
