import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AtSign, BadgeCheck, Bell, Building2, Camera, Check, CreditCard, GraduationCap, Mail, Rocket, UserRound } from "lucide-react";
import { pricing, site } from "@/content";
import { imobiliaria, UFS } from "@/data/demo";
import { ehSolo, pedidoAberto, PLANOS } from "@/data/platform";
import { vagasUsadas } from "@/data/queries";
import { useStore } from "@/data/store";
import type { PlanoNome } from "@/data/types";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { useScope, useSession } from "../session";
import { acaoAssinatura, mensagemErro, supabase } from "@/integrations/frankkia/client";
import { Avatar, Card, PageHeader, ProgressBar, Segmented, stagger } from "../kit";
import { BotaoSalvar, btn, DateInput, Field, formatPhone, inputCls, Modal, normalizePhone, SelectField } from "../forms";
import { PedidoUpgradeStatus, useIrParaPagamento } from "../upgrade";
import { Link, useSearchParams } from "react-router-dom";
import { CicloToggle } from "@/components/CicloToggle";
import { mensalNoAnual, reais, totalAnual, valorPlano, type Ciclo } from "@/lib/planos";
import { linkDaRede, REDES, redesLimpas, textoDaRede } from "@/lib/redes";

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
        <BotaoSalvar
          disabled={!f.nome.trim()}
          onSalvar={() => updateImobiliaria({ nome: f.nome.trim(), cnpj: f.cnpj, creciJ: f.creciJ, mostrarCorretorVendidos: !!f.mostrarCorretorVendidos, email: f.email, telefone: normalizePhone(f.telefone), cidade: f.cidade })}
        >
          Salvar alterações
        </BotaoSalvar>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da imobiliária" className="sm:col-span-2">
          <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        </Field>
        <Field label="CNPJ">
          <input className={inputCls} value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} />
        </Field>
        <Field label="CRECI da imobiliária (CRECI-J)" hint="Aparece nos anúncios do portal, como exige o conselho.">
          <input className={inputCls} value={f.creciJ} onChange={(e) => setF({ ...f, creciJ: e.target.value })} placeholder="Ex.: 12345-J" />
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
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-canvas p-4 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-accent"
            checked={!!f.mostrarCorretorVendidos}
            onChange={(e) => setF({ ...f, mostrarCorretorVendidos: e.target.checked })}
          />
          <span className="text-sm">
            <span className="font-semibold">Mostrar o nome do corretor nos imóveis vendidos</span>
            <span className="mt-0.5 block text-muted">
              No Estudo de mercado, a equipe vê os imóveis vendidos pela imobiliária (sem cliente e sem comissão). Ligue para mostrar também quem
              vendeu, para os corretores trocarem informações.
            </span>
          </span>
        </label>
      </div>
    </Section>
  );
}

/** Troca para um plano menor: só se os corretores ativos + convites cabem no plano novo (o banco confere de novo). */
function ReducaoModal({ plano, onClose }: { plano: PlanoNome | null; onClose: () => void }) {
  const { solicitarReducao } = useStore();
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setErro(""), [plano]);
  if (!plano) return null;
  const usadas = vagasUsadas();
  const limite = PLANOS[plano].limite;
  const sobra = usadas - limite;
  return (
    <Modal
      open={!!plano}
      onClose={onClose}
      title={`Trocar para o plano ${plano}`}
      subtitle={`Hoje: ${imobiliaria.plano} · ${usadas} de ${imobiliaria.limiteCorretores} vagas em uso.`}
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button
            disabled={sobra > 0 || enviando}
            className={btn.primary}
            onClick={async () => {
              setEnviando(true);
              const e = await solicitarReducao(plano);
              setEnviando(false);
              if (e) setErro(e);
              else onClose();
            }}
          >
            {enviando ? "Enviando..." : "Pedir a troca"}
          </button>
        </>
      }
    >
      {sobra > 0 ? (
        <div className="space-y-3 text-sm">
          <p className="rounded-2xl bg-amber-50 p-4 text-amber-900">
            O plano {plano} tem <strong>{limite} vagas</strong>, e hoje há <strong>{usadas}</strong> corretores ativos ou convidados. Desative{" "}
            <strong>{sobra}</strong> {sobra === 1 ? "corretor" : "corretores"} (ou cancele convites) antes de pedir a troca.
          </p>
          <p className="text-muted">
            Corretores desativados não perdem nada: vendas, captações e resultados continuam no histórico e no ranking. Para reativar depois, é só pedir à
            equipe Frankkia (a vaga precisa estar livre no plano).
          </p>
          <Link to="/app/equipe" onClick={onClose} className="inline-block font-semibold text-accent">
            Ir para Equipe →
          </Link>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-muted">
          <p>
            Sua equipe cabe no plano {plano} ({usadas} de {limite} vagas). A equipe Frankkia confirma a troca e o novo valor (
            <strong className="text-ink">R$ {pricing.plans.find((p) => p.name === plano)?.price}/mês</strong>) passa a valer na próxima cobrança.
          </p>
          <p>Nada é apagado: todos os dados e resultados da equipe continuam guardados.</p>
        </div>
      )}
      {erro && <p className="mt-3 text-sm text-rose-600">{erro}</p>}
    </Modal>
  );
}

function Plano() {
  const irParaPagamento = useIrParaPagamento();
  const { addChamado, toast } = useStore();
  const { user } = useScope();
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  const [reducao, setReducao] = useState<PlanoNome | null>(null);
  const emAndamento = !!pedidoAberto(imobiliaria.id);
  const usadas = vagasUsadas();
  const solo = ehSolo(imobiliaria.plano);
  const atual = pricing.plans.find((p) => p.name === imobiliaria.plano) ?? pricing.solo;
  const { modo, conta } = useSession();
  const assinatura = modo === "real" ? conta?.imobiliaria?.assinatura : null;
  const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-bg sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(70%_80%_at_100%_0%,rgb(47_91_234/0.5),transparent_70%)]" />
        <div className="relative grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bg/60">Plano atual</p>
            <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{atual.name}</p>
            <p className="mt-1 text-bg/70">{atual.seats}</p>
            {!solo && (
            <div className="mt-5 max-w-sm">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-bg/70">Vagas em uso</span>
                <span className="font-semibold">
                  {usadas} de {imobiliaria.limiteCorretores}
                </span>
              </div>
              <ProgressBar value={usadas / imobiliaria.limiteCorretores} className="bg-white/15" />
            </div>
            )}
          </div>
          <div className="sm:text-right">
            <p className="font-display text-4xl font-semibold tracking-tight">
              <span className="text-lg text-bg/60">R$ </span>
              {atual.price}
              <span className="text-lg text-bg/60">/mês</span>
            </p>
            {assinatura?.cancelaEm ? (
              <p className="mt-1 text-sm text-bg/60">Assinatura termina em {dia(assinatura.cancelaEm)}</p>
            ) : assinatura?.proximaCobranca ? (
              <p className="mt-1 text-sm text-bg/60">Próxima cobrança em {dia(assinatura.proximaCobranca)}</p>
            ) : null}
          </div>
        </div>
      </div>

      <PedidoUpgradeStatus />

      {solo ? (
        <Section title="Sua operação cresceu?" subtitle="O plano Solo é para quem trabalha sozinho. Se você abriu uma imobiliária e vai ter corretores, a Frankkia muda sua conta para um plano de equipe e mantém todos os seus dados.">
          <button
            className={btn.accent}
            onClick={() => {
              addChamado({
                autorId: user.id,
                assunto: "Virar imobiliária (sair do plano Solo)",
                categoria: "Plano",
                mensagem: `Olá! Sou ${imobiliaria.nome}, do plano Solo, e gostaria de mudar para um plano de equipe.`,
              });
              toast("Pedido enviado à equipe Frankkia. Acompanhe em Ajuda → Chamados.");
            }}
          >
            <Mail className="size-4" /> Pedir à Frankkia
          </button>
        </Section>
      ) : (
      <Section title="Mudar de plano" subtitle="Escolha o plano e pague por cartão, PIX ou boleto. As vagas extras são liberadas após a confirmação do pagamento.">
        <div className="mb-4 flex justify-center sm:justify-start">
          <CicloToggle ciclo={ciclo} onChange={setCiclo} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pricing.plans.map((p) => {
            const current = p.name === imobiliaria.plano;
            const mensal = valorPlano(p.price);
            return (
              <div key={p.name} className={`flex flex-col rounded-2xl border p-5 ${current ? "border-accent bg-accent-soft/50" : "border-line"}`}>
                <p className="font-display text-lg font-semibold">{p.name}</p>
                <p className="text-sm text-muted">{p.seats}</p>
                <p className="mt-4 font-display text-2xl font-semibold">
                  R$ {ciclo === "anual" ? reais(mensalNoAnual(mensal)) : p.price}
                  <span className="text-sm font-normal text-muted">/mês</span>
                </p>
                <p className="h-4 text-xs text-muted">{ciclo === "anual" && `R$ ${reais(totalAnual(mensal))} por ano`}</p>
                {current ? (
                  <span className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-white">
                    <Check className="size-4" /> Plano atual
                  </span>
                ) : PLANOS[p.name as PlanoNome].limite > imobiliaria.limiteCorretores ? (
                  <button onClick={() => irParaPagamento(p.name as PlanoNome, ciclo)} className={`${btn.accent} mt-4`}>
                    <Rocket className="size-4" /> Fazer upgrade
                  </button>
                ) : (
                  <button
                    onClick={() => setReducao(p.name as PlanoNome)}
                    disabled={emAndamento}
                    title={emAndamento ? "Já existe um pedido de plano em andamento" : undefined}
                    className={`${btn.outline} mt-4 disabled:opacity-40`}
                  >
                    Trocar para este
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-subtle">{pricing.note}</p>
        <ReducaoModal plano={reducao} onClose={() => setReducao(null)} />
      </Section>
      )}

      {assinatura && <AssinaturaSecao />}
    </div>
  );
}

/** Cartão, faturas e cancelamento da assinatura (só existe depois do primeiro pagamento pela Stripe). */
function AssinaturaSecao() {
  const { conta, recarregar } = useSession();
  const { toast } = useStore();
  const imob = conta?.imobiliaria;
  const a = imob?.assinatura;
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState<"cancelar" | "manter" | "portal" | null>(null);
  if (!imob || !a) return null;
  const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");
  const fim = a.cancelaEm ?? a.proximaCobranca;

  const agir = async (acao: "cancelar" | "manter" | "portal") => {
    setEnviando(acao);
    const r = await acaoAssinatura(imob.id, acao);
    if (r.url) {
      window.location.href = r.url;
      return;
    }
    setEnviando(null);
    if (r.erro) return toast(mensagemErro(r.erro));
    setConfirmar(false);
    await recarregar();
    toast(acao === "cancelar" ? "Assinatura cancelada. O acesso continua até o fim do período pago." : "Pronto! Sua assinatura continua ativa.");
  };

  return (
    <Section
      title="Assinatura e pagamento"
      subtitle={`Cobrança ${a.ciclo === "anual" ? "anual" : "mensal"} no cartão, pela Stripe. A assinatura renova sozinha até você cancelar.`}
    >
      {a.situacao === "pagamento_recusado" && (
        <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          O pagamento da última renovação foi recusado. Atualize o cartão: a Stripe tenta cobrar de novo nos próximos dias.
        </p>
      )}
      {a.situacao === "cancelamento_agendado" && a.cancelaEm && (
        <p className="mb-4 rounded-xl bg-canvas px-3 py-2 text-sm text-muted">
          Você cancelou a assinatura. O acesso continua até <span className="font-semibold text-ink">{dia(a.cancelaEm)}</span> e não haverá nova
          cobrança. Mudou de ideia? Dá para manter a assinatura até essa data.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button className={btn.outline} disabled={!!enviando} onClick={() => agir("portal")}>
          <CreditCard className="size-4" /> {enviando === "portal" ? "Abrindo..." : "Cartão e faturas"}
        </button>
        {a.situacao === "cancelamento_agendado" ? (
          <button className={btn.accent} disabled={!!enviando} onClick={() => agir("manter")}>
            <Check className="size-4" /> {enviando === "manter" ? "Salvando..." : "Manter assinatura"}
          </button>
        ) : (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            disabled={!!enviando}
            onClick={() => setConfirmar(true)}
          >
            Cancelar assinatura
          </button>
        )}
      </div>

      <Modal
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title="Cancelar a assinatura?"
        subtitle={fim ? `O acesso continua até ${dia(fim)} e não haverá nova cobrança.` : "Não haverá nova cobrança."}
        footer={
          <>
            <button className={btn.outline} onClick={() => setConfirmar(false)}>
              Voltar
            </button>
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
              disabled={!!enviando}
              onClick={() => agir("cancelar")}
            >
              {enviando === "cancelar" ? "Cancelando..." : "Cancelar assinatura"}
            </button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-muted">
          <p>Os dados da {imob.nome} continuam guardados. Para voltar depois, é só contratar um plano de novo.</p>
          <p>
            Contratou há menos de 7 dias? Você pode pedir o <span className="font-semibold text-ink">reembolso integral</span> pelo e-mail{" "}
            {site.email} (direito de arrependimento).
          </p>
        </div>
      </Modal>
    </Section>
  );
}

function Perfil() {
  const { updateUsuario, updateImobiliaria, toast, setFotoPerfil } = useStore();
  const entradaFoto = useRef<HTMLInputElement>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const trocarFoto = async (arquivo: File | null) => {
    setEnviandoFoto(true);
    const erro = await setFotoPerfil(user.id, arquivo);
    setEnviandoFoto(false);
    toast(erro ?? (arquivo ? "Foto de perfil atualizada." : "Foto de perfil removida."));
  };
  const { user } = useScope();
  const { modo, conta } = useSession();
  const init = () => ({
    nome: user.nome,
    email: user.email,
    telefone: user.telefone ? formatPhone(user.telefone) : "",
    aniversario: user.aniversario ?? "",
    creci: user.creci ?? "",
    creciUF: user.creciUF ?? "SP",
    estagiario: !!user.estagiario,
    redes: Object.fromEntries(REDES.map((r) => [r.chave, textoDaRede(r.chave, user.redes?.[r.chave])])) as Record<string, string>,
    cidade: imobiliaria.cidade,
  });
  const [f, setF] = useState(init);
  const [senha, setSenha] = useState({ atual: "", nova: "", confirma: "" });
  useEffect(() => setF(init()), [user]); // eslint-disable-line react-hooks/exhaustive-deps
  const senhaOk = senha.atual && senha.nova.length >= 8 && senha.nova === senha.confirma;
  // Corretor sem ser estagiário precisa informar o CRECI.
  // Solo: o dono da conta é o próprio corretor, então o CRECI é sempre obrigatório.
  const solo = ehSolo(imobiliaria.plano);
  const creciObrigatorio = solo || (user.papel === "corretor" && !f.estagiario);
  const perfilOk = f.nome.trim() && (!creciObrigatorio || f.creci.trim());

  return (
    <div className="space-y-6">
      <Section
        title="Meu perfil"
        footer={
          <BotaoSalvar
            disabled={!perfilOk}
            onSalvar={() => {
              // Solo: a conta leva o nome do corretor e a cidade onde ele atua (usada nos novos imóveis)
              if (solo && (f.nome.trim() !== imobiliaria.nome || f.cidade !== imobiliaria.cidade))
                updateImobiliaria({ nome: f.nome.trim(), cidade: f.cidade.trim() }, true);
              return updateUsuario(user.id, {
                nome: f.nome.trim(),
                email: f.email.trim(),
                telefone: f.telefone ? normalizePhone(f.telefone) : undefined,
                aniversario: f.aniversario || undefined,
                estagiario: f.estagiario,
                creci: f.creci.trim() || undefined,
                creciUF: f.creci.trim() ? f.creciUF : undefined,
                redes: redesLimpas(f.redes),
              });
            }}
          >
            Salvar perfil
          </BotaoSalvar>
        }
      >
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => entradaFoto.current?.click()}
            title="Trocar foto"
            className="group relative rounded-full ring-offset-2 transition hover:ring-2 hover:ring-accent/40"
          >
            <Avatar user={user} className="size-16 text-lg" />
            <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border-2 border-bg bg-ink text-bg">
              <Camera className="size-3.5" />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{user.nome}</p>
            <p className="text-sm text-muted">{solo ? "Corretor autônomo · Plano Solo" : `${user.papel === "admin" ? "Administrador" : "Corretor"} · ${imobiliaria.nome}`}</p>
            <div className="mt-1.5 flex gap-3 text-xs font-semibold">
              <button type="button" onClick={() => entradaFoto.current?.click()} disabled={enviandoFoto} className="text-accent">
                {enviandoFoto ? "Enviando..." : user.fotoUrl ? "Trocar foto" : "Adicionar foto"}
              </button>
              {user.fotoUrl && (
                <button type="button" onClick={() => trocarFoto(null)} disabled={enviandoFoto} className="text-muted hover:text-rose-600">
                  Remover
                </button>
              )}
            </div>
          </div>
          <input
            ref={entradaFoto}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const arq = e.target.files?.[0];
              e.target.value = "";
              if (arq) trocarFoto(arq);
            }}
          />
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
          <Field label="Data de nascimento" hint={solo ? undefined : "Usada para avisar a equipe no seu aniversário."}>
            <DateInput value={f.aniversario} onChange={(v) => setF({ ...f, aniversario: v })} />
          </Field>
          {solo && (
            <Field label="Cidade onde você atua" hint="Já vem preenchida ao cadastrar um imóvel.">
              <input className={inputCls} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="Ex.: Belém, PA" />
            </Field>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-canvas p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="size-4 text-accent" /> Registro no CRECI
            </p>
            {user.papel === "corretor" && !solo && (
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="size-4 accent-accent" checked={f.estagiario} onChange={(e) => setF({ ...f, estagiario: e.target.checked })} />
                <GraduationCap className="size-4 text-muted" /> Sou estagiário(a)
              </label>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[1fr_6rem] gap-3">
            <Field label={creciObrigatorio ? "Número do CRECI" : "Número do CRECI (opcional)"} hint={creciObrigatorio && !f.creci.trim() ? (solo ? "Obrigatório: aparece nos seus anúncios." : "Obrigatório para corretores.") : undefined}>
              <input className={inputCls} value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} placeholder="Ex.: 84213-F" />
            </Field>
            <Field label="Estado">
              <SelectField value={f.creciUF} onChange={(v) => setF({ ...f, creciUF: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
            </Field>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-canvas p-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AtSign className="size-4 text-accent" /> Redes sociais
          </p>
          <p className="mt-1 text-xs text-muted">Aparecem na sua página pública no portal. Preencha só as que você usa.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {REDES.map(({ chave, nome, exemplo, Icone }) => (
              <Field key={chave} label={nome} hint={f.redes[chave]?.trim() ? linkDaRede(chave, f.redes[chave]) : undefined}>
                <div className="relative">
                  <Icone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    className={`${inputCls} pl-10`}
                    value={f.redes[chave] ?? ""}
                    onChange={(e) => setF({ ...f, redes: { ...f.redes, [chave]: e.target.value } })}
                    placeholder={exemplo}
                  />
                </div>
              </Field>
            ))}
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
            onClick={async () => {
              if (modo !== "real") {
                setSenha({ atual: "", nova: "", confirma: "" });
                toast("Demonstração: no login real, a senha é alterada com segurança.");
                return;
              }
              // Confere a senha atual antes de trocar
              const { error: errAtual } = await supabase.auth.signInWithPassword({ email: conta?.email ?? "", password: senha.atual });
              if (errAtual) {
                toast("A senha atual não confere.");
                return;
              }
              const { error } = await supabase.auth.updateUser({ password: senha.nova });
              if (error) toast(mensagemErro(error));
              else {
                setSenha({ atual: "", nova: "", confirma: "" });
                toast("Senha alterada.");
              }
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
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 35 }} className={`absolute top-1 size-5 rounded-full bg-white shadow-sm ${on ? "right-1" : "left-1"}`} />
    </button>
  );
}

function Notificacoes() {
  const { isAdmin, solo } = useScope();
  const { toast } = useStore();
  const itens = [
    { id: "lead", label: "Novo lead atribuído a mim", desc: "Aviso assim que um lead chegar." },
    { id: "visita", label: "Lembrete de visita", desc: "Uma hora antes de cada visita agendada." },
    { id: "semanal", label: "Resumo semanal de performance", desc: "Toda segunda-feira, por e-mail." },
    ...(solo ? [] : [{ id: "academy", label: "Novas trilhas na Academy", desc: "Quando uma trilha nova for publicada." }]),
    ...(isAdmin && !solo ? [{ id: "venda", label: "Vendas da equipe", desc: "Sempre que um corretor registrar uma venda." }] : []),
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
  const { isAdmin, solo } = useScope();
  const abas: { value: Aba; label: string; icon: typeof Bell }[] = [
    ...(isAdmin && !solo ? [{ value: "imobiliaria" as const, label: "Imobiliária", icon: Building2 }] : []),
    ...(isAdmin ? [{ value: "plano" as const, label: "Plano", icon: CreditCard }] : []),
    { value: "perfil", label: "Meu perfil", icon: UserRound },
    { value: "notificacoes", label: "Notificações", icon: Bell },
  ];
  // Permite abrir direto numa aba (ex.: /app/configuracoes?aba=plano, usado ao voltar do pagamento)
  const [params] = useSearchParams();
  const pedida = params.get("aba") as Aba | null;
  const [aba, setAba] = useState<Aba>(
    pedida && abas.some((a) => a.value === pedida) ? pedida : isAdmin && !solo ? "imobiliaria" : "perfil",
  );
  useEffect(() => {
    if (!abas.some((a) => a.value === aba)) setAba(abas[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <motion.div {...stagger(0)}>
        <PageHeader title="Configurações" subtitle={solo ? "Seu perfil, plano e preferências." : isAdmin ? "Dados da imobiliária, plano e preferências." : "Seu perfil e preferências."} />
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
