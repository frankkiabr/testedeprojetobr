/** Peças compartilhadas pelas abas de Negócios: capas, etiquetas e formulários de cadastro. */
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { useEffect, useMemo, useState } from "react";
import { Briefcase, Building2, Home, Info, MapPin, Plus, Store, TreePine, Trash2, Warehouse } from "lucide-react";
import {
  CATEGORIAS,
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
  proprietarioById,
  proprietariosOf,
  userById,
  participanteAvatar,
} from "@/data/queries";
import { useStore } from "@/data/store";
import type { Captacao, CategoriaImovel, EtapaLead, FechamentoInformado, Finalidade, Participante, Imovel } from "@/data/types";
import { brl } from "@/lib/format";
import { useScope } from "../../session";
import { btn, DateInput, Field, inputCls, mascaraMoeda, Modal, moeda, normalizePhone, SelectField, waLink } from "../../forms";
import { Avatar, Segmented } from "../../kit";

// ---------- Visual ----------

const CATEGORIA_STYLE: Record<CategoriaImovel, { hue: number; icon: typeof Home }> = {
  Apartamento: { hue: 226, icon: Building2 },
  Casa: { hue: 158, icon: Home },
  "Sala comercial": { hue: 268, icon: Briefcase },
  Loja: { hue: 32, icon: Store },
  Galpão: { hue: 200, icon: Warehouse },
  Terreno: { hue: 95, icon: TreePine },
};

export const CategoriaIcon = ({ categoria, className = "size-4" }: { categoria: CategoriaImovel; className?: string }) => {
  const Icon = CATEGORIA_STYLE[categoria].icon;
  return <Icon className={className} />;
};

/** Capa do imóvel: a foto de capa do anúncio, quando houver; senão, a ilustração da categoria. */
export function ImovelCover({ categoria, className = "", foto }: { categoria: CategoriaImovel; className?: string; foto?: string }) {
  const { hue, icon: Icon } = CATEGORIA_STYLE[categoria];
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

export function CorretorField({ value, onChange, label = "Corretor responsável" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <Field label={label}>
      <SelectField value={value} onChange={onChange} placeholder="Selecione" options={corretoresAtivos().map((c) => ({ value: c.id, label: c.nome }))} />
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
  const { addLead } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const [f, setF] = useState({ nome: "", telefone: "", interesse: "", origem: ORIGENS[0] });
  useEffect(() => {
    if (open) setF({ nome: "", telefone: "", interesse: "", origem: ORIGENS[0] });
  }, [open]);
  const ok = f.nome.trim() && normalizePhone(f.telefone).length >= 12 && corretorId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo lead"
      subtitle="O lead entra na etapa “Novo”, aguardando atendimento."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!ok}
            onClick={() => {
              addLead({ corretorId, nome: f.nome.trim(), telefone: normalizePhone(f.telefone), interesse: f.interesse.trim() || "Não informado", origem: f.origem });
              onClose();
            }}
            className={btn.primary}
          >
            Cadastrar lead
          </button>
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
        {isAdmin && (
          <div className="sm:col-span-2">
            <CorretorField value={corretorId} onChange={setCorretorId} />
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
  useEffect(() => {
    if (open) setF({ nome: "", whatsapp: "" });
  }, [open]);
  const ok = f.nome.trim() && normalizePhone(f.whatsapp).length >= 12 && corretorId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo proprietário"
      subtitle="O WhatsApp é usado para enviar os relatórios de divulgação."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!ok}
            onClick={() => {
              addProprietario({ corretorId, nome: f.nome.trim(), whatsapp: normalizePhone(f.whatsapp) });
              onClose();
            }}
            className={btn.primary}
          >
            Cadastrar proprietário
          </button>
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

  const comNome = CATEGORIAS_COM_UNIDADE.includes(f.categoria);
  const ok = f.logradouro.trim() && f.numero.trim() && f.bairro.trim() && f.cidade.trim() && f.uf && (!comNome || f.nome.trim());
  const endereco = { logradouro: f.logradouro.trim(), numero: f.numero.trim(), bairro: f.bairro.trim(), cidade: f.cidade.trim(), uf: f.uf };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={imovel ? "Editar endereço" : "Novo imóvel"}
      subtitle={
        imovel
          ? "Vale para todas as captações deste endereço (por exemplo, outros apartamentos do mesmo prédio)."
          : "O imóvel é o lugar físico. Depois ele pode ser usado em várias captações."
      }
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!ok}
            className={btn.primary}
            onClick={() => {
              const dados = { categoria: f.categoria, nome: f.nome.trim() || undefined, endereco, cep: f.cep.length === 8 ? f.cep : undefined, lat: ponto?.lat, lng: ponto?.lng };
              if (imovel) {
                updateImovel(imovel.id, dados);
                onClose();
                return;
              }
              const im = addImovel(dados);
              onClose();
              onCreated?.(im.id);
            }}
          >
            {imovel ? "Salvar endereço" : "Cadastrar imóvel"}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <Field label="Categoria" className="sm:col-span-6">
          <SelectField value={f.categoria} onChange={(v) => setF({ ...f, categoria: v as CategoriaImovel })} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
        </Field>
        <Field
          label={comNome ? "Nome do edifício ou condomínio" : "Nome (opcional)"}
          className="sm:col-span-6"
          hint={comNome ? "Ex.: Edifício Montpellier. As unidades (apto, cobertura, sala) entram na captação." : "Ex.: Galpão Logístico Norte. Pode deixar em branco."}
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
        {/* Localização no mapa (opcional): o marcador pode ser arrastado até o ponto exato */}
        <div className="space-y-2 sm:col-span-6">
          {ponto ? (
            <>
              <Mapa lat={ponto.lat} lng={ponto.lng} onMover={setPonto} className="h-52" />
              <p className="text-xs text-muted">Se o marcador não estiver no lugar certo, arraste-o até o imóvel.</p>
            </>
          ) : (
            <button type="button" disabled={!ok || buscando === "mapa"} onClick={localizarNoMapa} className={`${btn.outline} w-full`}>
              <MapPin className="size-4" /> {buscando === "mapa" ? "Localizando..." : "Localizar no mapa"}
            </button>
          )}
          {avisoMapa && <p className="text-xs font-medium text-amber-700">{avisoMapa}</p>}
        </div>
      </div>
    </Modal>
  );
}

// ---------- Nova captação ----------

/** Mesmo endereço = mesmo imóvel (ex.: outro apartamento do mesmo prédio). */
const chaveEndereco = (e: { logradouro: string; numero: string; cidade: string }) =>
  [e.logradouro, e.numero, e.cidade].map((x) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "")).join("|");

/**
 * NOVA CAPTAÇÃO = cadastro único do imóvel.
 * O endereço é preenchido aqui mesmo (CEP e mapa); o "imóvel" (lugar físico) é criado por trás,
 * ou reaproveitado quando o endereço já existe (outra unidade do mesmo prédio). O estudo de mercado continua igual.
 */
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
        setF(empty());
        setPonto(null);
      }
      setAvisoMapa("");
    } else limparCaptacaoDoEstudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const props = useMemo(() => (corretorId ? proprietariosOf({ corretorId }) : []), [corretorId, open]); // eslint-disable-line react-hooks/exhaustive-deps
  const comUnidade = CATEGORIAS_COM_UNIDADE.includes(f.categoria);
  const valor = num(f.valor);
  const area = num(f.area);
  const endereco = { logradouro: f.logradouro.trim(), numero: f.numero.trim(), bairro: f.bairro.trim(), cidade: f.cidade.trim(), uf: f.uf };
  const enderecoOk = endereco.logradouro && endereco.numero && endereco.bairro && endereco.cidade && endereco.uf;
  // Prédio/casa já cadastrado no mesmo endereço?
  const existente = enderecoOk ? imoveis.find((i) => chaveEndereco(i.endereco) === chaveEndereco(endereco)) : undefined;
  const propOk = f.modo === "existente" ? !!f.proprietarioId : f.propNome.trim() && normalizePhone(f.propWhats).length >= 12;
  const ok = corretorId && enderecoOk && valor > 0 && area > 0 && propOk && (!comUnidade || f.unidade.trim()) && (!comUnidade || existente || f.nome.trim());
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
    if (Object.values(comodos).some((x) => x !== undefined)) salvarAnuncio(c.id, comodos, "");
    onClose();
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
      title="Novo imóvel"
      subtitle="Cadastre o imóvel captado de uma vez: endereço, dados e proprietário. Publicar no portal é opcional."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button disabled={!ok} onClick={save} className={btn.primary}>
            Cadastrar imóvel
          </button>
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
        <Field label="Categoria" className="sm:col-span-6">
          <SelectField value={f.categoria} onChange={(v) => setF({ ...f, categoria: v as CategoriaImovel })} options={CATEGORIAS.map((c) => ({ value: c, label: c }))} />
        </Field>

        {/* Endereço */}
        <p className="-mb-1 text-sm font-semibold sm:col-span-6">Endereço</p>
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
        {existente ? (
          <p className="flex items-start gap-1.5 rounded-xl bg-accent-soft/60 px-3 py-2.5 text-xs text-accent-deep sm:col-span-6">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Este endereço já está cadastrado{existente.nome ? ` (${existente.nome})` : ""}. O imóvel será ligado a ele, como outra unidade do mesmo prédio.
          </p>
        ) : (
          CATEGORIAS_COM_UNIDADE.includes(f.categoria) && (
            <Field label="Nome do edifício" className="sm:col-span-6" hint="Ex.: Edifício Montpellier">
              <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
            </Field>
          )
        )}
        {comUnidade && (
          <Field
            label={f.categoria === "Sala comercial" ? "Número da sala" : "Número do apartamento"}
            className="sm:col-span-6"
            hint={f.categoria === "Sala comercial" ? "Ex.: 1204 (aparece como Sala 1204)" : "Ex.: 302 (aparece como Apto 302). Para cobertura ou studio, escreva: Cobertura 1801"}
          >
            <input className={inputCls} value={f.unidade} onChange={(e) => setF({ ...f, unidade: e.target.value })} />
          </Field>
        )}
        <div className="space-y-2 sm:col-span-6">
          {ponto ? (
            <>
              <Mapa lat={ponto.lat} lng={ponto.lng} onMover={setPonto} className="h-48" />
              <p className="text-xs text-muted">Se o marcador não estiver no lugar certo, arraste-o até o imóvel.</p>
            </>
          ) : (
            !existente?.lat && (
              <button type="button" disabled={!enderecoOk || buscando === "mapa"} onClick={localizarNoMapa} className={`${btn.outline} w-full`}>
                <MapPin className="size-4" /> {buscando === "mapa" ? "Localizando..." : "Localizar no mapa (opcional)"}
              </button>
            )
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
  const [f, setF] = useState({ nome: "", creci: "", empresa: "", telefone: "" });
  useEffect(() => {
    if (open) setF({ nome: "", creci: "", empresa: "", telefone: "" });
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo parceiro externo"
      subtitle="Corretor de fora da imobiliária. Ele não recebe acesso; serve só para registrar parcerias."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={!f.nome.trim()}
            className={btn.primary}
            onClick={() => {
              const p = addParceiro({
                nome: f.nome.trim(),
                creci: f.creci.trim() || undefined,
                empresa: f.empresa.trim() || undefined,
                telefone: f.telefone ? normalizePhone(f.telefone) : undefined,
              });
              onClose();
              onCreated?.(p.id);
            }}
          >
            Cadastrar parceiro
          </button>
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
        title={tipo === "venda" ? "Registrar venda" : "Registrar locação"}
        subtitle="Somente o administrador registra. Defina os honorários e quem recebe cada parte."
        footer={
          <>
            <button onClick={onClose} className={btn.outline}>
              Cancelar
            </button>
            <button
              disabled={!ok}
              className={btn.accent}
              onClick={() => {
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
                onClose();
              }}
            >
              {tipo === "venda" ? "Registrar venda" : "Registrar locação"}
            </button>
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
          <button
            disabled={!cap || !valor}
            className={btn.accent}
            onClick={() => {
              informarFechamento({ corretorId: user.id, captacaoId: cap!.id, tipo: cap!.finalidade, valor, data: new Date(`${f.data}T12:00:00`).toISOString(), observacao: f.obs.trim() || undefined });
              onClose();
            }}
          >
            Enviar ao administrador
          </button>
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
