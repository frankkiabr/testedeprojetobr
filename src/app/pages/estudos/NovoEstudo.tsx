import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Briefcase, Building2, Check, CheckCircle2, Home, Layers, MoreHorizontal, Pencil, Square, UserPlus } from "lucide-react";
import { anuncios, imobiliaria } from "@/data/demo";
import { captacaoTitulo, captacoesOf, imovelById, proprietarioById, proprietariosOf } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Finalidade } from "@/data/types";
import { criarAvaliacao, TIPOS_ESTUDO, type DadosImovel } from "@/data/avaliacoes";
import { mensagemErro } from "@/integrations/frankkia/client";
import { brl } from "@/lib/format";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { PageHeader, Segmented } from "../../kit";
import { btn, Field, formatPhone, inputCls, Modal, normalizePhone, SelectField } from "../../forms";
import { useScope, useSession } from "../../session";
import { CamposEndereco, CamposImovel } from "./partes";

const ICONES: Record<string, typeof Building2> = {
  Apartamento: Building2,
  Casa: Home,
  Cobertura: Layers,
  "Sala comercial": Briefcase,
  Terreno: Square,
  Outros: MoreHorizontal,
};

/** Tipo escolhido no estudo a partir da categoria da captação. */
const tipoDaCategoria = (c: string) => (c === "Loja" ? "Sala comercial" : c === "Galpão" ? "Outros" : c);

/**
 * NOVO ESTUDO (/app/mercado/estudos/novo): os passos do BrokerApp (tipo, localização, proprietário, título, revisar),
 * mas com TODOS os dados do imóvel já no passo 3, para não precisar preencher de novo depois.
 * Atalho Frankkia: começar de uma captação já cadastrada (preenche quase tudo).
 */
export default function NovoEstudo() {
  const navigate = useNavigate();
  const { modo } = useSession();
  const { user, scope } = useScope();
  const { toast, addProprietario } = useStore();
  const [d, setD] = useState<Partial<DadosImovel>>({ finalidade: "venda" });
  const set = (p: Partial<DadosImovel>) => setD((x) => ({ ...x, ...p }));
  const [passo, setPasso] = useState(1);
  const [tituloEditado, setTituloEditado] = useState(false);
  const [propModal, setPropModal] = useState(false);
  const [criando, setCriando] = useState(false);

  const proprietario = d.proprietarioId ? proprietarioById(d.proprietarioId) : undefined;
  const tipoRotulo = TIPOS_ESTUDO.find((t) => t.valor === d.categoria)?.rotulo.split(" /")[0];
  const sugestao = [proprietario?.nome, tipoRotulo, d.bairro, d.cidade].filter(Boolean).join(" – ");
  const titulo = tituloEditado ? (d.titulo ?? "") : sugestao;
  const endereco = [d.logradouro, d.numero].filter(Boolean).join(", ") + (d.cidade ? ` – ${d.cidade}` : "");

  const ok = {
    1: !!d.categoria,
    2: !!(d.logradouro && d.cidade && d.uf),
    3: !!d.areaM2,
    4: true,
    5: titulo.trim().length >= 2,
  } as Record<number, boolean>;

  // Atalho: começar de uma captação
  const captacoes = useMemo(() => captacoesOf(scope).filter((c) => c.status === "ativa"), [scope]);
  const deCaptacao = (id: string) => {
    const c = captacoes.find((x) => x.id === id);
    if (!c) return;
    const im = imovelById(c.imovelId);
    const an = anuncios.find((a) => a.captacaoId === c.id);
    setD((x) => ({
      ...x,
      captacaoId: c.id,
      finalidade: c.finalidade,
      categoria: im ? tipoDaCategoria(im.categoria) : x.categoria,
      cep: im?.cep,
      logradouro: im?.endereco.logradouro,
      numero: im?.endereco.numero,
      complemento: c.unidade,
      bairro: im?.endereco.bairro,
      cidade: im?.endereco.cidade,
      uf: im?.endereco.uf,
      lat: im?.lat,
      lng: im?.lng,
      areaM2: c.areaM2,
      quartos: an?.quartos,
      suites: an?.suites,
      banheiros: an?.banheiros,
      vagas: an?.vagas,
      valorAnunciado: c.valor,
      proprietarioId: c.proprietarioId,
    }));
    setPasso(5);
    toast("Dados da captação preenchidos. Confira e crie o estudo.");
  };

  const criar = async () => {
    setCriando(true);
    try {
      const a = await criarAvaliacao(modo === "real", imobiliaria.id, user.id, { ...(d as DadosImovel), titulo: titulo.trim() });
      toast("Estudo de mercado criado.");
      navigate(`/app/mercado/estudos/${a.id}`, { replace: true });
    } catch (e) {
      toast(mensagemErro(e));
      setCriando(false);
    }
  };

  const avancar = (n: number) => setPasso(n + 1);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link to="/app/mercado" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Estudos de mercado
      </Link>
      <PageHeader title="Novo estudo" subtitle="Preencha tudo de uma vez: depois é só juntar as amostras." />

      {captacoes.length > 0 && passo < 5 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-4">
          <p className="text-sm font-semibold">Atalho: começar de uma captação</p>
          <div className="min-w-[16rem] flex-1">
            <SelectField
              value={d.captacaoId ?? ""}
              onChange={deCaptacao}
              placeholder="Escolha a captação"
              options={captacoes.map((c) => ({ value: c.id, label: `${captacaoTitulo(c)} · ${brl(c.valor)}` }))}
            />
          </div>
        </div>
      )}

      <Passo n={1} atual={passo} titulo="Tipo do imóvel" subtitulo="Qual é o tipo do imóvel que será avaliado?" resumo={tipoRotulo} onEditar={() => setPasso(1)}>
        <div className="mb-4">
          <Segmented
            id="estudo-finalidade"
            size="sm"
            value={d.finalidade ?? "venda"}
            onChange={(v: Finalidade) => set({ finalidade: v })}
            options={[
              { value: "venda", label: "Venda" },
              { value: "locacao", label: "Locação" },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {TIPOS_ESTUDO.map((t) => {
            const Icone = ICONES[t.valor];
            const ativo = d.categoria === t.valor;
            return (
              <button
                key={t.valor}
                type="button"
                onClick={() => {
                  set({ categoria: t.valor });
                  avancar(1);
                }}
                className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center text-xs font-semibold transition ${
                  ativo ? "border-accent bg-accent-soft/60 text-ink" : "border-line text-muted hover:border-line-strong hover:text-ink"
                }`}
              >
                {ativo && <CheckCircle2 className="absolute right-2 top-2 size-4 text-verified" />}
                <Icone className={`size-6 ${ativo ? "text-accent" : ""}`} />
                {t.rotulo}
              </button>
            );
          })}
        </div>
      </Passo>

      <Passo n={2} atual={passo} titulo="Localização do imóvel" subtitulo="Busque pelo CEP ou digite o endereço" resumo={ok[2] ? endereco : undefined} onEditar={() => setPasso(2)}>
        <CamposEndereco f={d} set={set} />
        <Navegacao onVoltar={() => setPasso(1)} onAvancar={() => avancar(2)} pode={ok[2]} rotulo="Confirmar endereço" />
      </Passo>

      <Passo
        n={3}
        atual={passo}
        titulo="Dados do imóvel"
        subtitulo="Tudo o que influencia o preço, de uma vez só"
        resumo={ok[3] ? [`${d.areaM2} m²`, d.quartos && `${d.quartos} dorm.`, d.vagas && `${d.vagas} vagas`].filter(Boolean).join(" · ") : undefined}
        onEditar={() => setPasso(3)}
      >
        <CamposImovel f={d} set={set} />
        <Navegacao onVoltar={() => setPasso(2)} onAvancar={() => avancar(3)} pode={ok[3]} rotulo="Confirmar dados" />
      </Passo>

      <Passo n={4} atual={passo} titulo="Proprietário" subtitulo="Vincule ou cadastre o proprietário" resumo={proprietario?.nome ?? (passo > 4 ? "Sem proprietário" : undefined)} onEditar={() => setPasso(4)}>
        <div className="flex flex-wrap items-center gap-3">
          {proprietario ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-verified-soft px-3 py-1.5 text-sm font-semibold text-verified">
              <Check className="size-4" /> {proprietario.nome}
            </span>
          ) : null}
          <button type="button" className={btn.outline} onClick={() => setPropModal(true)}>
            <UserPlus className="size-4" /> {proprietario ? "Trocar proprietário" : "Adicionar proprietário"}
          </button>
        </div>
        <Navegacao onVoltar={() => setPasso(3)} onAvancar={() => avancar(4)} pode rotulo={proprietario ? "Continuar" : "Continuar sem proprietário"} />
      </Passo>

      <Passo n={5} atual={passo} titulo="Título do estudo" subtitulo="Para sua organização interna" resumo={passo > 5 ? titulo : undefined} onEditar={() => setPasso(5)}>
        <p className="mb-2 flex items-center gap-1.5 rounded-xl bg-canvas px-3 py-2 text-xs text-muted">
          <Pencil className="size-3.5" /> Sugestão com base nos dados informados. Edite como quiser.
        </p>
        <input
          className={inputCls}
          value={titulo}
          onChange={(e) => {
            setTituloEditado(true);
            set({ titulo: e.target.value });
          }}
        />
        <Navegacao onVoltar={() => setPasso(4)} onAvancar={() => avancar(5)} pode={ok[5]} rotulo="Confirmar título" />
      </Passo>

      <Passo n={6} atual={passo} titulo="Revisar e salvar" subtitulo="Confirme os dados antes de criar o estudo">
        <ul className="space-y-2 rounded-2xl bg-canvas p-4 text-sm">
          {[
            ["Tipo do imóvel", `${tipoRotulo ?? "—"} · ${d.finalidade === "locacao" ? "Locação" : "Venda"}`],
            ["Endereço", endereco || "—"],
            ["Imóvel", [d.areaM2 && `${d.areaM2} m²`, d.quartos && `${d.quartos} dormitórios`, d.suites && `${d.suites} suítes`, d.vagas && `${d.vagas} vagas`].filter(Boolean).join(" · ") || "—"],
            ["Proprietário", proprietario?.nome ?? "Sem proprietário"],
            ["Título do estudo", titulo],
          ].map(([k, v]) => (
            <li key={k} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-verified" />
              <span>
                <span className="font-semibold">{k}:</span> {v}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={() => setPasso(5)}>
            <ArrowLeft className="mr-1 inline size-4" /> Voltar
          </button>
          <button
            type="button"
            className={`${btn.accent} h-12 flex-1 text-base`}
            disabled={criando || !ok[1] || !ok[2] || !ok[3] || !ok[5]}
            onClick={criar}
          >
            <CheckCircle2 className="size-5" /> {criando ? "Criando..." : "Criar estudo de mercado"}
          </button>
        </div>
      </Passo>

      <ProprietarioModal
        open={propModal}
        onClose={() => setPropModal(false)}
        lista={proprietariosOf(scope)}
        onVincular={(id) => {
          set({ proprietarioId: id });
          setPropModal(false);
        }}
        onCadastrar={(nome, whatsapp) => {
          const p = addProprietario({ corretorId: user.id, nome, whatsapp });
          set({ proprietarioId: p.id });
          setPropModal(false);
        }}
      />
    </div>
  );
}

/** Um passo do assistente: número (verde com ✓ quando concluído), título e, fechado, o resumo com "Editar". */
function Passo({
  n,
  atual,
  titulo,
  subtitulo,
  resumo,
  onEditar,
  children,
}: {
  n: number;
  atual: number;
  titulo: string;
  subtitulo: string;
  resumo?: string;
  onEditar?: () => void;
  children: ReactNode;
}) {
  const aberto = atual === n;
  const feito = atual > n;
  return (
    <motion.section
      layout
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
      className={`rounded-3xl border bg-bg p-5 sm:p-6 ${aberto ? "border-line shadow-soft" : "border-line/70"} ${!aberto && !feito ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-4">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-full font-display font-semibold ${
            feito ? "bg-verified text-white" : aberto ? "bg-accent text-white" : "border border-line text-subtle"
          }`}
        >
          {feito ? <Check className="size-5" /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-lg font-semibold tracking-tight">{titulo}</p>
          <p className="text-sm text-muted">{subtitulo}</p>
        </div>
        {feito && resumo && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[18rem] truncate rounded-full border border-verified/30 bg-verified-soft px-3 py-1 text-xs font-semibold text-verified sm:inline">
              ✓ {resumo}
            </span>
            {onEditar && (
              <button type="button" onClick={onEditar} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                <Pencil className="size-3.5" /> Editar
              </button>
            )}
          </div>
        )}
      </div>
      {aberto && <div className="mt-5">{children}</div>}
    </motion.section>
  );
}

function Navegacao({ onVoltar, onAvancar, pode, rotulo }: { onVoltar: () => void; onAvancar: () => void; pode: boolean; rotulo: string }) {
  return (
    <div className="mt-5 flex items-center gap-3">
      <button type="button" className="text-sm font-semibold text-muted hover:text-ink" onClick={onVoltar}>
        <ArrowLeft className="mr-1 inline size-4" /> Voltar
      </button>
      <button type="button" className={btn.accent} disabled={!pode} onClick={onAvancar}>
        {rotulo} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/** "Adicionar/Vincular um proprietário": já cadastrado ou novo (como no BrokerApp). */
function ProprietarioModal({
  open,
  onClose,
  lista,
  onVincular,
  onCadastrar,
}: {
  open: boolean;
  onClose: () => void;
  lista: { id: string; nome: string; whatsapp: string }[];
  onVincular: (id: string) => void;
  onCadastrar: (nome: string, whatsapp: string) => void;
}) {
  const [aba, setAba] = useState<"existente" | "novo">(lista.length ? "existente" : "novo");
  const [escolhido, setEscolhido] = useState("");
  const [nome, setNome] = useState("");
  const [whats, setWhats] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Adicionar ou vincular um proprietário">
      <div className="space-y-4">
        <Segmented
          id="estudo-proprietario"
          value={aba}
          onChange={setAba}
          options={[
            { value: "existente", label: "Já cadastrado" },
            { value: "novo", label: "Cadastrar novo" },
          ]}
        />
        {aba === "existente" ? (
          <>
            <Field label="Proprietário">
              <SelectField
                value={escolhido}
                onChange={setEscolhido}
                placeholder={lista.length ? "Escolha na lista" : "Nenhum proprietário cadastrado"}
                options={lista.map((p) => ({ value: p.id, label: `${p.nome}${p.whatsapp ? ` · ${formatPhone(p.whatsapp)}` : ""}` }))}
              />
            </Field>
            <button className={`${btn.accent} w-full`} disabled={!escolhido} onClick={() => onVincular(escolhido)}>
              Vincular proprietário
            </button>
          </>
        ) : (
          <>
            <Field label="Nome completo">
              <input className={inputCls} value={nome} onChange={(e) => setNome(e.target.value)} />
            </Field>
            <Field label="WhatsApp">
              <input className={inputCls} inputMode="tel" value={whats} onChange={(e) => setWhats(e.target.value)} placeholder="(91) 98765-4321" />
            </Field>
            <button
              className={`${btn.accent} w-full`}
              disabled={nome.trim().length < 2 || normalizePhone(whats).length < 12}
              onClick={() => onCadastrar(nome.trim(), normalizePhone(whats))}
            >
              Cadastrar e vincular
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
