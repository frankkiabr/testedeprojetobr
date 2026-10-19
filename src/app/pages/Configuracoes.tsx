import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgeCheck, Bell, Building2, Check, CreditCard, GraduationCap, Mail, Rocket, UserRound } from "lucide-react";
import { pricing, site } from "@/content";
import { imobiliaria, UFS } from "@/data/demo";
import { PLANOS } from "@/data/platform";
import { vagasUsadas } from "@/data/queries";
import { useStore } from "@/data/store";
import type { PlanoNome } from "@/data/types";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope } from "../session";
import { Avatar, Card, PageHeader, ProgressBar, Segmented, stagger } from "../kit";
import { btn, Field, formatPhone, inputCls, normalizePhone, SelectField } from "../forms";
import { PedidoUpgradeStatus, useIrParaPagamento } from "../upgrade";
import { useSearchParams } from "react-router-dom";

type Aba = "imobiliaria" | "plano" | "perfil" | "notificacoes";

function Section({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <Card>
      <div className="border-b border-line px-6 py-5">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="p-6">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-line bg-canvas/50 px-6 py-4">{footer}</div>}
    </Card>
  );
}

function ImobiliariaForm() {
  const { updateImobiliaria } = useStore();
  const init = () => ({ ...imobiliaria, telefone: formatPhone(imobiliaria.telefone) });
  const [f, setF] = useState(init);
  return (
    <Section
      title="Dados da imobiliária"
      subtitle="Aparecem no topo da plataforma e nos relatórios enviados aos proprietários."
      footer={
        <button
          className={btn.primary}
          disabled={!f.nome.trim()}
          onClick={() => updateImobiliaria({ nome: f.nome.trim(), cnpj: f.cnpj, email: f.email, telefone: normalizePhone(f.telefone), cidade: f.cidade })}
        >
          Salvar alterações
        </button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da imobiliária" className="sm:col-span-2">
          <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <Field label="CNPJ">
          <input className={inputCls} value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} />
        </Field>
        <Field label="Cidade">
          <input className={inputCls} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} />
        </Field>
        <Field label="E-mail de contato">
          <input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </Field>
        <Field label="Telefone">
          <input className={inputCls} value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} />
        </Field>
      </div>
    </Section>
  );
}

function Plano() {
  const irParaPagamento = useIrParaPagamento();
  const usadas = vagasUsadas();
  const atual = pricing.plans.find((p) => p.name === imobiliaria.plano)!;
  const proxima = new Date();
  proxima.setMonth(proxima.getMonth() + 1, 10);
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">Plano atual</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{atual.name}</p>
            <p className="mt-1 text-bg/70">{atual.seats}</p>
            <div className="mt-5 max-w-sm">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-bg/70">Vagas em uso</span>
                <span className="font-semibold">
                  {usadas} de {imobiliaria.limiteCorretores}
                </span>
              </div>
              <ProgressBar value={usadas / imobiliaria.limiteCorretores} className="bg-white/15" />
            </div>
          </div>
          <div className="sm:text-right">
            <p className="font-display text-4xl font-semibold tracking-tight">
              <span className="text-lg text-bg/60">R$ </span>
              {atual.price}
              <span className="text-lg text-bg/60">/mês</span>
            </p>
            <p className="mt-1 text-sm text-bg/60">Próxima cobrança em {proxima.toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>

      <PedidoUpgradeStatus />

      <Section title="Mudar de plano" subtitle="Escolha o plano e pague por cartão, PIX ou boleto. As vagas extras são liberadas após a confirmação do pagamento.">
        <div className="grid gap-3 md:grid-cols-3">
          {pricing.plans.map((p) => {
            const current = p.name === imobiliaria.plano;
            return (
              <div key={p.name} className={`flex flex-col rounded-2xl border p-5 ${current ? "border-accent bg-accent-soft/50" : "border-line"}`}>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-muted">{p.seats}</p>
                <p className="mt-4 font-display text-2xl font-semibold">
                  R$ {p.price}
                  <span className="text-sm font-normal text-muted">/mês</span>
                </p>
                {current ? (
                  <span className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-white">
                    <Check className="size-4" /> Plano atual
                  </span>
                ) : PLANOS[p.name as PlanoNome].limite > imobiliaria.limiteCorretores ? (
                  <button onClick={() => irParaPagamento(p.name as PlanoNome)} className={`${btn.accent} mt-4`}>
                    <Rocket className="size-4" /> Fazer upgrade
                  </button>
                ) : (
                  <a
                    href={`mailto:${site.email}?subject=${encodeURIComponent(`Mudança de plano - ${imobiliaria.nome}`)}&body=${encodeURIComponent(
                      `Olá! Gostaria de mudar o plano da ${imobiliaria.nome} de ${imobiliaria.plano} para ${p.name}.`,
                    )}`}
                    className={`${btn.outline} mt-4`}
                  >
                    <Mail className="size-4" /> Solicitar
                  </a>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-subtle">{pricing.note}</p>
      </Section>
    </div>
  );
}

function Perfil() {
  const { updateUsuario, toast } = useStore();
  const { user } = useScope();
  const init = () => ({
    nome: user.nome,
    email: user.email,
    telefone: user.telefone ? formatPhone(user.telefone) : "",
    aniversario: user.aniversario ?? "",
    creci: user.creci ?? "",
    creciUF: user.creciUF ?? "SP",
    estagiario: !!user.estagiario,
  });
  const [f, setF] = useState(init);
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  useEffect(() => setF(init()), [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const senhaOk = senha.atual && senha.nova.length >= 8 && senha.nova === senha.confirma;
  // Corretor sem ser estagiário precisa informar o CRECI.
  const creciObrigatorio = user.papel === "corretor" && !f.estagiario;
  const perfilOk = f.nome.trim() && (!creciObrigatorio || f.creci.trim());

  return (
    <div className="space-y-6">
      <Section
        title="Meu perfil"
        footer={
          <button
            className={btn.primary}
            disabled={!perfilOk}
            onClick={() =>
              updateUsuario(user.id, {
                nome: f.nome.trim(),
                email: f.email.trim(),
                telefone: f.telefone ? normalizePhone(f.telefone) : undefined,
                aniversario: f.aniversario || undefined,
                estagiario: f.estagiario,
                creci: f.creci.trim() || undefined,
                creciUF: f.creci.trim() ? f.creciUF : undefined,
              })
            }
          >
            Salvar perfil
          </button>
        }
      >
        <div className="mb-6 flex items-center gap-4">
          <Avatar user={user} className="size-16 text-lg" />
          <div>
            <p className="font-semibold">{user.nome}</p>
            <p className="text-sm text-muted">{user.papel === "admin" ? "Administrador" : "Corretor"} · {imobiliaria.nome}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" className="sm:col-span-2">
            <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
          </Field>
          <Field label="E-mail">
            <input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <input className={inputCls} value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 98765-4321" />
          </Field>
          <Field label="Data de nascimento" hint="Usada para avisar a equipe no seu aniversário.">
            <input type="date" className={inputCls} value={f.aniversario} onChange={(e) => setF({ ...f, aniversario: e.target.value })} />
          </Field>
        </div>

        <div className="mt-6 rounded-2xl bg-canvas p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="size-4 text-accent" /> Registro no CRECI
            </p>
            {user.papel === "corretor" && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-accent" checked={f.estagiario} onChange={(e) => setF({ ...f, estagiario: e.target.checked })} />
                <GraduationCap className="size-4 text-muted" /> Sou estagiário(a)
              </label>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_6rem] gap-3">
            <Field label={creciObrigatorio ? "Número do CRECI" : "Número do CRECI (opcional)"} hint={creciObrigatorio && !f.creci.trim() ? "Obrigatório para corretores." : undefined}>
              <input className={inputCls} value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} placeholder="Ex.: 84213-F" />
            </Field>
            <Field label="Estado">
              <SelectField value={f.creciUF} onChange={(v) => setF({ ...f, creciUF: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
            </Field>
          </div>
        </div>
      </Section>

      <Section
        title="Alterar senha"
        subtitle="Mínimo de 8 caracteres."
        footer={
          <button
            className={btn.outline}
            disabled={!senhaOk}
            onClick={() => {
              setSenha({ atual: "", nova: "", confirma: "" });
              toast("Na versão final, a senha será alterada com segurança.");
            }}
          >
            Alterar senha
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Senha atual">
            <input type="password" className={inputCls} value={senha.atual} onChange={(e) => setSenha({ ...senha, atual: e.target.value })} autoComplete="off" />
          </Field>
          <Field label="Nova senha">
            <input type="password" className={inputCls} value={senha.nova} onChange={(e) => setSenha({ ...senha, nova: e.target.value })} autoComplete="new-password" />
          </Field>
          <Field label="Confirmar nova senha" hint={senha.confirma && senha.confirma !== senha.nova ? "As senhas não conferem." : undefined}>
            <input type="password" className={inputCls} value={senha.confirma} onChange={(e) => setSenha({ ...senha, confirma: e.target.value })} autoComplete="new-password" />
          </Field>
        </div>
      </Section>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-line-strong"}`}>
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className={`absolute top-1 size-5 rounded-full bg-white shadow ${on ? "right-1" : "left-1"}`} />
    </button>
  );
}

function Notificacoes() {
  const { isAdmin } = useScope();
  const { toast } = useStore();
  const itens = [
    { id: "lead", label: "Novo lead atribuído a mim", desc: "Aviso assim que um lead chegar." },
    { id: "visita", label: "Lembrete de visita", desc: "Uma hora antes de cada visita agendada." },
    { id: "semanal", label: "Resumo semanal de performance", desc: "Toda segunda-feira, por e-mail." },
    { id: "academy", label: "Novas trilhas na Academy", desc: "Quando uma trilha nova for publicada." },
    ...(isAdmin ? [{ id: "venda", label: "Vendas da equipe", desc: "Sempre que um corretor registrar uma venda." }] : []),
  ];
  const [on, setOn] = useState<Record<string, boolean>>({ lead: true, visita: true, semanal: true, academy: false, venda: true });
  return (
    <Section title="Notificações" subtitle="Escolha o que você quer receber.">
      <ul className="divide-y divide-line">
        {itens.map((it) => (
          <li key={it.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-semibold">{it.label}</p>
              <p className="text-xs text-muted">{it.desc}</p>
            </div>
            <Toggle
              on={!!on[it.id]}
              onChange={() => {
                setOn((s) => ({ ...s, [it.id]: !s[it.id] }));
                toast(on[it.id] ? "Notificação desativada." : "Notificação ativada.");
              }}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}

export default function Configuracoes() {
  useStore();
  const { isAdmin } = useScope();
  const abas: { value: Aba; label: string; icon: typeof Bell }[] = [
    ...(isAdmin
      ? [
          { value: "imobiliaria" as const, label: "Imobiliária", icon: Building2 },
          { value: "plano" as const, label: "Plano", icon: CreditCard },
        ]
      : []),
    { value: "perfil", label: "Meu perfil", icon: UserRound },
    { value: "notificacoes", label: "Notificações", icon: Bell },
  ];
  // Permite abrir direto numa aba (ex.: /app/configuracoes?aba=plano, usado ao voltar do pagamento)
  const [params] = useSearchParams();
  const pedida = params.get("aba") as Aba | null;
  const [aba, setAba] = useState<Aba>(pedida && (isAdmin || pedida === "perfil" || pedida === "notificacoes") ? pedida : isAdmin ? "imobiliaria" : "perfil");
  useEffect(() => {
    if (!abas.some((a) => a.value === aba)) setAba(abas[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Configurações" subtitle={isAdmin ? "Dados da imobiliária, plano e preferências." : "Seu perfil e preferências."} />
      </motion.div>
      <motion.div {...stagger(1)} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Segmented id="config" value={aba} onChange={setAba} options={abas.map((a) => ({ value: a.value, label: a.label }))} />
      </motion.div>
      <motion.div key={aba} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT_EXPO }} className="max-w-4xl">
        {aba === "imobiliaria" && <ImobiliariaForm />}
        {aba === "plano" && <Plano />}
        {aba === "perfil" && <Perfil />}
        {aba === "notificacoes" && <Notificacoes />}
      </motion.div>
    </div>
  );
}
