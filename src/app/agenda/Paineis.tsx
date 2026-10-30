/** Formulário de compromisso, painel de detalhes e conexão com o Google Agenda (real no login real; simulada na demonstração). */
import { useEffect, useState } from "react";
import { Mapa } from "@/components/Mapa";
import { linkGoogleMaps, localizar } from "@/lib/mapa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck2, CalendarPlus, Check, Clock, ExternalLink, Link2, Loader2, MapPin, Pencil, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { conexoesGoogle } from "@/data/demo";
import { captacaoById, captacaoTitulo, captacoesOf, enderecoCompleto, imovelById, leadById, leadsOf, userById } from "@/data/queries";
import { useStore } from "@/data/store";
import type { Compromisso, TipoCompromisso, Usuario } from "@/data/types";
import { relTime } from "@/lib/format";
import { BotaoSalvar, btn, DateInput, Drawer, Field, inputCls, Modal, SelectField, TimeInput } from "../forms";
import { Avatar } from "../kit";
import { useSession } from "../session";
import { googleAgenda, mensagemErro } from "@/integrations/frankkia/client";
import { dataLonga, deInputs, hhmm, linkGoogleAgenda, ORDEM_TIPOS, paraInputData, paraInputHora, TIPOS, rotuloDoTipo } from "./utils";

// ---------- Formulário ----------

export function CompromissoForm({
  open,
  onClose,
  inicial,
  editar,
  donoPadrao,
  responsaveis,
  semVinculos,
}: {
  open: boolean;
  onClose: () => void;
  /** Horário sugerido ao clicar num espaço vazio da grade */
  inicial?: Date;
  editar?: Compromisso;
  donoPadrao: string;
  /** Administrador pode escolher o responsável (ele mesmo ou um corretor) */
  responsaveis?: Usuario[];
  /** Painel Frankkia: sem leads/captações */
  semVinculos?: boolean;
}) {
  const { addCompromisso, updateCompromisso } = useStore();
  const vazio = () => {
    const ini = inicial ?? (() => {
      const d = new Date();
      d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
      return d;
    })();
    const fim = new Date(ini.getTime() + 60 * 60_000);
    return { titulo: "", tipo: "visita" as TipoCompromisso, data: paraInputData(ini), inicio: paraInputHora(ini), fim: paraInputHora(fim), donoId: donoPadrao, leadId: "", captacaoId: "", local: "", localLat: undefined as number | undefined, localLng: undefined as number | undefined, observacoes: "", etiqueta: "" };
  };
  const [f, setF] = useState(vazio);

  useEffect(() => {
    if (!open) return;
    if (editar) {
      const ini = new Date(editar.inicio);
      const fim = new Date(editar.fim);
      setF({
        titulo: editar.titulo,
        tipo: editar.tipo,
        data: paraInputData(ini),
        inicio: paraInputHora(ini),
        fim: paraInputHora(fim),
        donoId: editar.donoId,
        leadId: editar.leadId ?? "",
        captacaoId: editar.captacaoId ?? "",
        local: editar.local ?? "",
        localLat: editar.localLat,
        localLng: editar.localLng,
        observacoes: editar.observacoes ?? "",
        etiqueta: editar.etiqueta ?? "",
      });
    } else setF(vazio());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editar?.id, inicial?.getTime()]);

  const ini = deInputs(f.data, f.inicio);
  const fim = deInputs(f.data, f.fim);
  const ehCorretor = userById(f.donoId)?.papel === "corretor";
  const leads = !semVinculos && ehCorretor ? leadsOf({ corretorId: f.donoId }).filter((l) => l.etapa !== "perdido" && l.etapa !== "fechado") : [];
  const caps = !semVinculos && ehCorretor ? captacoesOf({ corretorId: f.donoId }).filter((c) => c.status === "ativa") : [];
  const ok = f.titulo.trim() && f.data && fim > ini;

  // Local no mapa (busca só ao clicar, como pede o serviço gratuito de mapas)
  const [buscandoLocal, setBuscandoLocal] = useState(false);
  const [avisoLocal, setAvisoLocal] = useState("");
  const localizarLocal = async () => {
    setAvisoLocal("");
    setBuscandoLocal(true);
    const p = await localizar(f.local);
    setBuscandoLocal(false);
    if (p) setF((x) => ({ ...x, localLat: p.lat, localLng: p.lng }));
    else setAvisoLocal("Não encontramos este local no mapa. Tente com rua, número e cidade.");
  };

  // Sugere o título a partir do lead escolhido
  const escolherLead = (id: string) => {
    const l = leadById(id);
    const sugestao = l ? (f.tipo === "ligacao" ? `Ligar para ${l.nome}` : `Visita com ${l.nome}`) : "";
    setF((x) => ({ ...x, leadId: id, titulo: x.titulo.trim() ? x.titulo : sugestao }));
  };

  const salvar = () => {
    const dados = {
      donoId: f.donoId,
      titulo: f.titulo.trim(),
      tipo: f.tipo,
      inicio: ini.toISOString(),
      fim: fim.toISOString(),
      leadId: f.leadId || undefined,
      captacaoId: f.captacaoId || undefined,
      local: f.local.trim() || undefined,
      localLat: f.local.trim() ? f.localLat : undefined,
      localLng: f.local.trim() ? f.localLng : undefined,
      observacoes: f.observacoes.trim() || undefined,
      etiqueta: f.tipo === "outro" ? f.etiqueta.trim() || undefined : undefined,
    };
    if (editar) updateCompromisso(editar.id, dados);
    else addCompromisso(dados);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editar ? "Editar compromisso" : "Novo compromisso"}
      subtitle={f.tipo === "visita" && f.leadId ? "A data desta visita também fica registrada no lead." : undefined}
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <BotaoSalvar disabled={!ok} onSalvar={salvar} depois={onClose}>
            {editar ? "Salvar" : "Criar compromisso"}
          </BotaoSalvar>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        <div className="flex flex-wrap gap-1.5 sm:col-span-6">
          {ORDEM_TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setF({ ...f, tipo: t })}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${f.tipo === t ? "border-ink bg-ink text-bg" : "border-line-strong hover:border-ink/40"}`}
            >
              <span className={`size-2 rounded-full ${TIPOS[t].dot}`} />
              {t === "outro" ? "Outro (digitar)" : TIPOS[t].label}
            </button>
          ))}
        </div>
        {f.tipo === "outro" && (
          <Field label="Nome da etiqueta" className="sm:col-span-6" hint="Escreva o tipo do compromisso. Ex.: Cartório, Vistoria, Assinatura de contrato.">
            <input className={inputCls} maxLength={30} value={f.etiqueta} onChange={(e) => setF({ ...f, etiqueta: e.target.value })} placeholder="Ex.: Cartório" />
          </Field>
        )}
        <Field label="Título" className="sm:col-span-6">
          <input autoFocus className={inputCls} value={f.titulo} onChange={(e) => setF({ ...f, titulo: e.target.value })} placeholder="Ex.: Visita com Juliana" />
        </Field>
        <Field label="Data" className="sm:col-span-2">
          <DateInput value={f.data} onChange={(v) => setF({ ...f, data: v })} />
        </Field>
        <Field label="Início" className="sm:col-span-2">
          <TimeInput value={f.inicio} onChange={(v) => setF({ ...f, inicio: v })} />
        </Field>
        <Field label="Fim" className="sm:col-span-2" hint={f.data && fim <= ini ? "O fim precisa ser depois do início." : undefined}>
          <TimeInput value={f.fim} onChange={(v) => setF({ ...f, fim: v })} />
        </Field>
        {responsaveis && (
          <Field label="Responsável" className="sm:col-span-6">
            <SelectField
              value={f.donoId}
              onChange={(v) => setF({ ...f, donoId: v, leadId: "", captacaoId: "" })}
              options={responsaveis.map((u) => ({ value: u.id, label: u.id === donoPadrao ? `${u.nome} (você)` : u.nome }))}
            />
          </Field>
        )}
        {!semVinculos && ehCorretor && (
          <>
            <Field label="Lead (opcional)" className="sm:col-span-3">
              <SelectField
                value={f.leadId}
                onChange={escolherLead}
                options={[{ value: "", label: "Nenhum" }, ...leads.map((l) => ({ value: l.id, label: l.nome }))]}
              />
            </Field>
            <Field label="Captação (opcional)" className="sm:col-span-3">
              <SelectField
                value={f.captacaoId}
                onChange={(v) => {
                  // Captação escolhida e local vazio: usa o endereço do imóvel (e a posição dele no mapa)
                  const cap = v ? captacaoById(v) : undefined;
                  const im = cap ? imovelById(cap.imovelId) : undefined;
                  setF((x) =>
                    im && !x.local.trim()
                      ? { ...x, captacaoId: v, local: enderecoCompleto(im.endereco), localLat: im.lat, localLng: im.lng }
                      : { ...x, captacaoId: v },
                  );
                }}
                options={[{ value: "", label: "Nenhuma" }, ...caps.map((c) => ({ value: c.id, label: captacaoTitulo(c) }))]}
              />
            </Field>
          </>
        )}
        <Field label="Local (opcional)" className="sm:col-span-6" hint={avisoLocal || undefined}>
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={f.local}
              onChange={(e) => setF({ ...f, local: e.target.value, localLat: undefined, localLng: undefined })}
              placeholder="Endereço, escritório ou link da reunião"
            />
            <button type="button" onClick={localizarLocal} disabled={!f.local.trim() || buscandoLocal} className={`${btn.outline} shrink-0`} title="Mostrar no mapa">
              <MapPin className="size-4" /> {buscandoLocal ? "..." : "Mapa"}
            </button>
          </div>
        </Field>
        {f.localLat !== undefined && f.localLng !== undefined && (
          <div className="sm:col-span-6">
            <Mapa lat={f.localLat} lng={f.localLng} onMover={(p) => setF((x) => ({ ...x, localLat: p.lat, localLng: p.lng }))} className="h-44" />
          </div>
        )}
        <Field label="Observações (opcional)" className="sm:col-span-6">
          <textarea rows={3} className={`${inputCls} h-auto resize-none py-3`} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}

// ---------- Detalhes ----------

export function CompromissoDetalhes({ c, onClose, onEditar }: { c: Compromisso | null; onClose: () => void; onEditar: (c: Compromisso) => void }) {
  const { removeCompromisso } = useStore();
  const navigate = useNavigate();
  const [confirmar, setConfirmar] = useState(false);
  useEffect(() => setConfirmar(false), [c?.id]);
  const ini = c ? new Date(c.inicio) : null;
  const fim = c ? new Date(c.fim) : null;
  const dono = c ? userById(c.donoId) : undefined;
  const lead = c?.leadId ? leadById(c.leadId) : undefined;
  const cap = c?.captacaoId ? captacaoById(c.captacaoId) : undefined;
  const sincronizado = c ? !!conexoesGoogle[c.donoId] : false;
  const { modo } = useSession();

  return (
    <Drawer
      open={!!c}
      onClose={onClose}
      title={c?.titulo}
      subtitle={
        c && (
          <span className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${TIPOS[c.tipo].dot}`} />
            {rotuloDoTipo(c)}
          </span>
        )
      }
      footer={
        c && (
          <>
            {confirmar ? (
              <button
                onClick={() => {
                  removeCompromisso(c.id);
                  onClose();
                }}
                className={`${btn.primary} bg-rose-600 hover:bg-rose-700`}
              >
                Confirmar exclusão
              </button>
            ) : (
              <button onClick={() => setConfirmar(true)} className={`${btn.outline} text-rose-600`}>
                <Trash2 className="size-4" /> Excluir
              </button>
            )}
            <button onClick={() => onEditar(c)} className={btn.primary}>
              <Pencil className="size-4" /> Editar
            </button>
          </>
        )
      }
    >
      {c && ini && fim && (
        <div className="space-y-5">
          <div className="space-y-3 rounded-2xl bg-canvas p-4 text-sm">
            <p className="flex items-center gap-2.5">
              <Clock className="size-4 text-muted" />
              <span>
                <span className="font-semibold">{dataLonga(ini)}</span> · {hhmm(ini)} às {hhmm(fim)}
                <span className="ml-1.5 text-xs text-muted">({relTime(c.inicio)})</span>
              </span>
            </p>
            {c.local && (
              <p className="flex items-center gap-2.5">
                <MapPin className="size-4 text-muted" />
                <a
                  href={linkGoogleMaps(c.localLat !== undefined && c.localLng !== undefined ? { lat: c.localLat, lng: c.localLng } : null, c.local)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline-offset-2 hover:text-accent hover:underline"
                >
                  {c.local}
                </a>
              </p>
            )}
            {c.localLat !== undefined && c.localLng !== undefined && <Mapa key={c.id} lat={c.localLat} lng={c.localLng} className="h-40" />}
            {dono && (
              <p className="flex items-center gap-2.5">
                <Avatar user={dono} className="size-5 text-[0.5rem]" />
                {dono.nome}
              </p>
            )}
          </div>

          {(lead || cap) && (
            <div className="space-y-2">
              {lead && (
                <button
                  onClick={() => navigate(`/app/negocios/leads?lead=${lead.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left text-sm hover:bg-canvas"
                >
                  <UserRound className="size-4 text-accent" />
                  <span className="flex-1">
                    Lead: <span className="font-semibold">{lead.nome}</span>
                  </span>
                  <ExternalLink className="size-4 text-muted" />
                </button>
              )}
              {cap && (
                <button
                  onClick={() => navigate(`/app/negocios/captacoes?captacao=${cap.id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-line p-3 text-left text-sm hover:bg-canvas"
                >
                  <CalendarCheck2 className="size-4 text-accent" />
                  <span className="flex-1">
                    Captação: <span className="font-semibold">{captacaoTitulo(cap)}</span>
                  </span>
                  <ExternalLink className="size-4 text-muted" />
                </button>
              )}
            </div>
          )}

          {c.observacoes && <p className="whitespace-pre-wrap rounded-2xl border border-line p-4 text-sm leading-relaxed">{c.observacoes}</p>}

          <div className="rounded-2xl border border-line p-4">
            {sincronizado ? (
              <p className="flex items-center gap-2 text-sm text-verified">
                <Link2 className="size-4" /> Sincronizado com o Google Agenda de {conexoesGoogle[c.donoId].email}
                {modo === "demo" && " (simulação)"}
              </p>
            ) : (
              <>
                <p className="text-sm text-muted">Quer este compromisso no seu celular? Adicione ao Google Agenda.</p>
                <a href={linkGoogleAgenda(c)} target="_blank" rel="noreferrer" className={`${btn.outline} mt-3`}>
                  <CalendarPlus className="size-4" /> Adicionar ao Google Agenda
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ---------- Conexão com o Google ----------

const VOLTA_GOOGLE: Record<string, string> = {
  ok: "Google Agenda conectado! Seus compromissos aparecem lá em até 1 minuto.",
  cancelado: "Conexão com o Google cancelada.",
  sem_permissao: "Para conectar, marque a permissão de agenda na tela do Google.",
  expirado: "O tempo para conectar expirou. Tente de novo.",
  erro: "Não foi possível conectar ao Google agora. Tente de novo.",
};

export function ConexaoGoogle({ usuario }: { usuario: Usuario }) {
  const { conectarGoogle, desconectarGoogle, toast } = useStore();
  const { modo } = useSession();
  const real = modo === "real";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(usuario.email);
  const [etapa, setEtapa] = useState<"inicio" | "conectando">("inicio");
  const conexao = conexoesGoogle[usuario.id];
  const loc = useLocation();
  const [params, setParams] = useSearchParams();

  // Volta da tela do Google (?google=ok etc.)
  useEffect(() => {
    const r = params.get("google");
    if (!r) return;
    toast(VOLTA_GOOGLE[r] ?? VOLTA_GOOGLE.erro);
    params.delete("google");
    setParams(params, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setEmail(conexao?.email ?? usuario.email);
      setEtapa("inicio");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const conectar = async () => {
    setEtapa("conectando");
    if (real) {
      const r = await googleAgenda("conectar", loc.pathname.startsWith("/admin") ? "/admin/agenda" : "/app/agenda");
      if (r.url) window.location.href = r.url;
      else {
        setEtapa("inicio");
        toast(mensagemErro(r.erro));
      }
      return;
    }
    setTimeout(() => {
      conectarGoogle(usuario.id, email.trim());
      setOpen(false);
    }, 1200);
  };

  const desconectar = async () => {
    if (real) {
      const r = await googleAgenda("desconectar");
      if (r.erro) return toast(mensagemErro(r.erro));
    }
    desconectarGoogle(usuario.id);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
          conexao ? "border-verified/30 bg-verified-soft text-verified" : "border-line-strong bg-bg hover:bg-canvas"
        }`}
      >
        <GoogleG />
        {conexao ? "Google Agenda conectado" : "Conectar Google Agenda"}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={conexao ? "Google Agenda" : "Conectar Google Agenda"}
        subtitle={
          conexao
            ? `Conectado como ${conexao.email}.`
            : real
              ? "Seus compromissos da Frankkia aparecem no seu Google Agenda."
              : "Sincronize seus compromissos nos dois sentidos."
        }
        footer={
          conexao ? (
            <>
              <button onClick={desconectar} className={`${btn.outline} text-rose-600`}>
                Desconectar
              </button>
              <button onClick={() => setOpen(false)} className={btn.primary}>
                Fechar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setOpen(false)} className={btn.outline}>
                Cancelar
              </button>
              <button disabled={(!real && !email.trim()) || etapa === "conectando"} onClick={conectar} className={btn.primary}>
                {etapa === "conectando" ? <Loader2 className="size-4 animate-spin" /> : <GoogleG />}
                {etapa === "conectando" ? "Conectando..." : "Continuar com Google"}
              </button>
            </>
          )
        }
      >
        <>
          {conexao ? (
            <motion.ul key="on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2.5 text-sm">
              {(real
                ? [
                    "Compromissos criados, alterados ou excluídos na Frankkia vão para o seu Google Agenda em até 1 minuto.",
                    "Lembretes chegam no seu celular pelo próprio Google.",
                    "Se você mudar o horário, o título ou o local de um desses eventos no Google, ou excluir, a Frankkia acompanha em até 5 minutos.",
                  ]
                : ["Compromissos criados na Frankkia aparecem no Google Agenda.", "Mudanças feitas no Google Agenda voltam para a Frankkia.", "Lembretes chegam no seu celular pelo próprio Google."]
              ).map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-verified" /> {t}
                </li>
              ))}
            </motion.ul>
          ) : (
            <motion.div key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="rounded-2xl bg-canvas p-4 text-sm">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldCheck className="size-4 text-accent" /> A Frankkia vai pedir permissão para:
                </p>
                <ul className="mt-2 space-y-1.5 text-muted">
                  <li>• Ver e editar os eventos da sua agenda</li>
                  <li>• Criar eventos a partir dos seus compromissos</li>
                </ul>
              </div>
              {real ? (
                <p className="text-xs text-subtle">
                  Você vai para a tela oficial do Google para escolher a conta e autorizar. A Frankkia só mexe nos eventos que ela mesma criou.
                </p>
              ) : (
                <>
                  <Field label="Conta Google">
                    <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <p className="text-xs text-subtle">Demonstração: a conexão é simulada.</p>
                </>
              )}
            </motion.div>
          )}
        </>
      </Modal>
    </>
  );
}

/** "G" colorido simples (ícone ilustrativo). */
function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  );
}
