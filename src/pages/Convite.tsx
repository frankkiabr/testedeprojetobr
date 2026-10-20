import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, GraduationCap, Info, MailCheck, PartyPopper } from "lucide-react";
import { convites, imobiliaria, UFS } from "@/data/demo";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { DateInput, Field, inputCls, normalizePhone, SelectField, Toaster } from "@/app/forms";
import { inicioDe, useSession } from "@/app/session";
import { mensagemErro, supabase } from "@/integrations/frankkia/client";

type ConviteInfo = { email: string; imobiliaria: string; papel: "admin" | "corretor"; demo: boolean; solo?: boolean };

/**
 * PRIMEIRO ACESSO (convite).
 * O convidado completa o cadastro: nome, WhatsApp, aniversário e CRECI
 * (ou marca que é estagiário, e aí o CRECI deixa de ser obrigatório) e cria a senha.
 * O endereço /convite/<código> vem do convite real (banco) ou de um convite de exemplo (demonstração).
 */
export default function Convite() {
  const { id = "" } = useParams();
  const { aceitarConvite } = useStore();
  const { modo, conta, carregando, recarregar, role } = useSession();
  const navigate = useNavigate();
  const demo = convites.find((c) => c.id === id);

  const [info, setInfo] = useState<ConviteInfo | null | undefined>(
    demo ? { email: demo.email, imobiliaria: imobiliaria.nome, papel: "corretor", demo: true } : undefined,
  );
  useEffect(() => {
    if (demo) return;
    let vivo = true;
    supabase.rpc("ver_convite", { p_token: id }).then(({ data }) => {
      if (!vivo) return;
      const c = data?.[0];
      setInfo(c ? { email: c.email, imobiliaria: c.imobiliaria, papel: c.papel as "admin" | "corretor", demo: false, solo: !!c.solo } : null);
    });
    return () => {
      vivo = false;
    };
  }, [id, demo]);

  const [f, setF] = useState({ nome: "", telefone: "", aniversario: "", estagiario: false, creci: "", creciUF: "SP", senha: "", confirma: "" });
  const [feito, setFeito] = useState<string | null>(null);
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Já entrou com a conta do convite: só completa o cadastro (sem criar senha)
  const logadoNoConvite = !!info && !info.demo && modo === "real" && conta?.email.toLowerCase() === info.email.toLowerCase();
  const logadoOutraConta = !!info && !info.demo && modo === "real" && !logadoNoConvite;
  const pedeSenha = !logadoNoConvite;

  // Solo: o dono da conta é o próprio corretor, então o CRECI é obrigatório (sem a opção de estagiário)
  const creciObrigatorio = !!info?.solo || (info?.papel === "corretor" && !f.estagiario);
  const creciOk = !creciObrigatorio || f.creci.trim().length >= 3;
  const senhaOk = !pedeSenha || (f.senha.length >= 8 && f.senha === f.confirma);
  const ok = f.nome.trim().split(/\s+/).length >= 2 && normalizePhone(f.telefone).length >= 12 && f.aniversario && creciOk && senhaOk;

  const dados = () => ({
    nome: f.nome.trim(),
    telefone: normalizePhone(f.telefone),
    aniversario: f.aniversario,
    estagiario: f.estagiario,
    creci: f.creci.trim(),
    creci_uf: f.creci.trim() ? f.creciUF : "",
  });

  const aceitar = async () => {
    const d = dados();
    const { error } = await supabase.rpc("aceitar_convite", {
      p_token: id,
      p_nome: d.nome,
      p_telefone: d.telefone,
      p_aniversario: d.aniversario,
      p_creci: d.creci,
      p_creci_uf: d.creci_uf,
      p_estagiario: d.estagiario,
    });
    if (error) throw error;
    await recarregar();
  };

  const concluir = async () => {
    if (!info) return;
    setErro(null);
    if (info.demo) {
      const u = aceitarConvite(id, {
        nome: f.nome.trim(),
        telefone: normalizePhone(f.telefone),
        aniversario: f.aniversario,
        estagiario: f.estagiario,
        creci: f.creci.trim() || undefined,
        creciUF: f.creci.trim() ? f.creciUF : undefined,
      });
      if (u) setFeito(u.nome.split(" ")[0]);
      return;
    }
    setEnviando(true);
    try {
      if (logadoNoConvite) {
        await aceitar();
        setFeito(f.nome.trim().split(" ")[0]);
        return;
      }
      // Cria a conta. Os dados ficam guardados nela: se o e-mail precisar de confirmação,
      // o convite é aceito automaticamente no primeiro login.
      const d = dados();
      const { data, error } = await supabase.auth.signUp({
        email: info.email,
        password: f.senha,
        options: { data: { ...d, convite_token: id }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      // Conta já existente: o Supabase não revela; devolve um usuário sem identidades
      if (data.user && !data.user.identities?.length) {
        setErro("Este e-mail já tem uma conta. Entre com sua senha na tela de login e abra este convite de novo.");
        return;
      }
      if (data.session) {
        // sem confirmação de e-mail: o convite é aceito agora
        setFeito(d.nome.split(" ")[0]);
      } else setConfirmarEmail(true);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const nomeImob = info?.imobiliaria ?? imobiliaria.nome;

  return (
    <div className="min-h-screen bg-canvas/60">
      <header className="flex h-16 items-center justify-between border-b border-line bg-bg px-6">
        <Link to="/">
          <Logo className="text-[1.75rem]" />
        </Link>
        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-muted">Primeiro acesso</span>
      </header>

      <main className="mx-auto w-full max-w-xl px-4 py-12">
        <>
          {info === undefined || (carregando && !info?.demo) ? null : feito ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE_OUT_EXPO }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-verified-soft text-verified">
                <PartyPopper className="size-7" />
              </span>
              <h1 className="type-title mt-6">Tudo pronto, {feito}!</h1>
              {info?.demo ? (
                <>
                  <p className="mt-3 text-muted">Seu cadastro na {nomeImob} foi concluído (demonstração: a senha não é salva).</p>
                  <Link to="/app/equipe" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg">
                    Ver na equipe (como administrador) <ArrowRight className="size-4" />
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-3 text-muted">Seu cadastro na {nomeImob} foi concluído. A partir de agora, entre com seu e-mail e senha.</p>
                  <button
                    onClick={() => navigate(inicioDe(role), { replace: true })}
                    className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg"
                  >
                    Entrar na plataforma <ArrowRight className="size-4" />
                  </button>
                </>
              )}
            </motion.div>
          ) : confirmarEmail ? (
            <motion.div key="email" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
                <MailCheck className="size-7" />
              </span>
              <h1 className="type-title mt-6">Confirme seu e-mail</h1>
              <p className="mt-3 text-muted">
                Enviamos um link para <span className="font-semibold text-ink">{info?.email}</span>. Clique nele e depois entre com sua senha: seu acesso
                à {nomeImob} é liberado automaticamente.
              </p>
            </motion.div>
          ) : !info ? (
            <motion.div key="invalido" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <h1 className="type-title">Convite não encontrado</h1>
              <p className="mt-3 text-muted">Este convite já foi usado, foi cancelado ou expirou. Peça um novo convite ao administrador da imobiliária.</p>
              <Link to="/" className="mt-6 inline-block text-sm font-semibold text-accent">
                Voltar ao site
              </Link>
            </motion.div>
          ) : logadoOutraConta ? (
            <motion.div key="outra" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <h1 className="type-title">Convite para outro e-mail</h1>
              <p className="mt-3 text-muted">
                Este convite é para <span className="font-semibold text-ink">{info.email}</span>, mas você entrou como{" "}
                <span className="font-semibold text-ink">{conta?.email}</span>. Saia e abra o convite de novo.
              </p>
              <button
                onClick={() => supabase.auth.signOut()}
                className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-bg"
              >
                Sair desta conta
              </button>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
              <p className="type-eyebrow text-accent">Convite</p>
              <h1 className="type-title mt-2">Bem-vindo(a) à {nomeImob}</h1>
              <p className="mt-3 text-muted">
                Complete seu cadastro para acessar a Frankkia com o e-mail <span className="font-semibold text-ink">{info.email}</span>
                {info.papel === "admin" ? " como administrador(a) da imobiliária." : "."}
              </p>

              <div className="mt-8 space-y-6 rounded-3xl border border-line bg-bg p-6 sm:p-8">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nome completo" className="sm:col-span-2">
                    <input autoFocus className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
                  </Field>
                  <Field label="WhatsApp">
                    <input className={inputCls} inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 98765-4321" />
                  </Field>
                  <Field label="Data de nascimento" hint="Para a equipe comemorar com você.">
                    <DateInput value={f.aniversario} onChange={(v) => setF({ ...f, aniversario: v })} />
                  </Field>
                </div>

                {/* CRECI */}
                <div className="rounded-2xl bg-canvas p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <BadgeCheck className="size-4 text-accent" /> Registro no CRECI
                    </p>
                    {!info.solo && (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" className="size-4 accent-accent" checked={f.estagiario} onChange={(e) => setF({ ...f, estagiario: e.target.checked })} />
                        <GraduationCap className="size-4 text-muted" /> Sou estagiário(a)
                      </label>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_6rem] gap-3">
                    <Field
                      label={creciObrigatorio ? "Número do CRECI" : "Número do CRECI (opcional)"}
                      hint={info.solo ? "Obrigatório: aparece nos seus anúncios, como exige o conselho." : undefined}
                    >
                      <input className={inputCls} value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} placeholder="Ex.: 84213-F" />
                    </Field>
                    <Field label="Estado">
                      <SelectField value={f.creciUF} onChange={(v) => setF({ ...f, creciUF: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
                    </Field>
                  </div>
                  {f.estagiario && (
                    <p className="mt-3 flex items-start gap-1.5 text-xs text-muted">
                      <Info className="mt-0.5 size-3.5 shrink-0" /> Como estagiário(a), o CRECI não é obrigatório. Você pode informá-lo depois em Configurações.
                    </p>
                  )}
                </div>

                {pedeSenha && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Crie uma senha" hint="Mínimo de 8 caracteres.">
                      <input type="password" className={inputCls} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="new-password" />
                    </Field>
                    <Field label="Confirme a senha" hint={f.confirma && f.confirma !== f.senha ? "As senhas não conferem." : undefined}>
                      <input type="password" className={inputCls} value={f.confirma} onChange={(e) => setF({ ...f, confirma: e.target.value })} autoComplete="new-password" />
                    </Field>
                  </div>
                )}

                {erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

                <button
                  disabled={!ok || enviando}
                  onClick={concluir}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition hover:bg-ink/85 disabled:pointer-events-none disabled:opacity-40"
                >
                  {enviando ? "Concluindo..." : "Concluir cadastro"} <ArrowRight className="size-4" />
                </button>
                <p className="text-center text-xs text-subtle">
                  Ao concluir, você concorda com os{" "}
                  <a href="/termos" target="_blank" rel="noreferrer" className="underline hover:text-muted">
                    Termos de Uso
                  </a>{" "}
                  e a{" "}
                  <a href="/privacidade" target="_blank" rel="noreferrer" className="underline hover:text-muted">
                    Política de Privacidade
                  </a>
                  .
                </p>
                {info.demo && <p className="text-center text-xs text-subtle">Convite de demonstração: a senha não é salva.</p>}
              </div>
            </motion.div>
          )}
        </>
      </main>
      <Toaster />
    </div>
  );
}
