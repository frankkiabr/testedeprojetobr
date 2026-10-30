import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, CreditCard, MailCheck, ShieldCheck } from "lucide-react";
import { contato, pricing, site } from "@/content";
import { UFS } from "@/data/demo";
import { PLANOS } from "@/data/platform";
import type { PlanoNome } from "@/data/types";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { precoPlano } from "@/lib/planos";
import { linkWhatsApp } from "@/lib/whatsapp";
import { Logo, Scaled } from "@/components/ui";
import { Dashboard, DASHBOARD_SIZE } from "@/components/mockups/Dashboard";
import { WhatsAppIcon } from "@/components/WhatsAppIcon";
import { Field, inputCls, normalizePhone, SelectField } from "@/app/forms";
import { useSession } from "@/app/session";
import { mensagemErro, supabase } from "@/integrations/frankkia/client";
import { BotaoGoogle } from "@/app/Google";

/**
 * Planos com teste grátis pelo site. Equipe 30 e 60 começam por uma conversa com a Frankkia (o banco também recusa).
 * Quem vem da página do corretor autônomo (?plano=Solo) vê só o Solo; quem vem de um plano de equipe vê só os de equipe.
 */
const EQUIPES: PlanoNome[] = ["Equipe 5", "Equipe 10"];
const opcoesDoCadastro = (plano: string | null): PlanoNome[] =>
  plano === "Solo" ? ["Solo"] : plano?.startsWith("Equipe") ? EQUIPES : ["Solo", ...EQUIPES];

/**
 * CADASTRO PELO SITE (/cadastro?plano=Solo).
 * A pessoa cria a conta sozinha e entra em teste grátis (dias definidos pela Frankkia em config_cadastro).
 * Os dados ficam guardados na conta: com confirmação de e-mail, a conta de teste é criada no primeiro login
 * (criarContaPendente em src/app/session.tsx, função criar_conta_teste no banco).
 * Pelo Google: a pessoa volta aqui já com a sessão e só completa plano, WhatsApp e CRECI (sem e-mail, senha nem confirmação).
 */
export default function Cadastro() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { modo, conta, recarregar } = useSession();
  const [opcoes] = useState(() => opcoesDoCadastro(params.get("plano")));
  const inicial = opcoes.find((p) => p === params.get("plano")) ?? (opcoes.includes("Equipe 10") ? "Equipe 10" : opcoes[0]);

  const [f, setF] = useState({
    plano: inicial as PlanoNome,
    nome: "",
    imobiliaria: "",
    cidade: "",
    telefone: "",
    creci: "",
    creciUF: "PA",
    email: "",
    senha: "",
    confirma: "",
    aceite: false,
  });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmarEmail, setConfirmarEmail] = useState(false);

  useEffect(() => {
    document.title = `Teste grátis · ${site.name}`;
  }, []);

  // Entrou pelo Google e ainda não tem conta: completa só o que falta
  const completar = modo === "real" && !!conta?.semCadastro;
  useEffect(() => {
    if (completar && conta?.nome) setF((x) => (x.nome ? x : { ...x, nome: conta.nome }));
  }, [completar, conta?.nome]);

  const solo = f.plano === "Solo";
  const creciOk = !solo || f.creci.trim().length >= 3;
  const ok =
    f.nome.trim().split(/\s+/).length >= 2 &&
    (solo || f.imobiliaria.trim().length >= 2) &&
    normalizePhone(f.telefone).length >= 12 &&
    creciOk &&
    (completar || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && f.senha.length >= 8 && f.senha === f.confirma)) &&
    f.aceite;

  // Já entrou com uma conta: o cadastro é para quem ainda não tem
  const logado = modo === "real" && !!conta && !conta.semCadastro;

  const criar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      const cadastro = {
        plano: f.plano,
        imobiliaria: solo ? "" : f.imobiliaria.trim(),
        cidade: f.cidade.trim(),
        nome: f.nome.trim(),
        telefone: normalizePhone(f.telefone),
        creci: f.creci.trim(),
        creci_uf: f.creci.trim() ? f.creciUF : "",
      };
      if (completar) {
        // Já entrou pelo Google (e-mail confirmado): cria a conta de teste agora
        const { error } = await supabase.rpc("criar_conta_teste", {
          p_plano: cadastro.plano,
          p_imobiliaria: cadastro.imobiliaria,
          p_cidade: cadastro.cidade,
          p_nome: cadastro.nome,
          p_telefone: cadastro.telefone,
          p_creci: cadastro.creci,
          p_creci_uf: cadastro.creci_uf,
        } as never);
        if (error) throw error;
        // A foto do Google vira a foto do perfil
        if (conta?.fotoGoogle) await supabase.from("perfis").update({ foto_url: conta.fotoGoogle }).eq("id", conta.usuarioId).is("foto_url", null);
        await recarregar();
        navigate("/app/visao-geral", { replace: true });
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: f.email.trim().toLowerCase(),
        password: f.senha,
        options: { data: { nome: cadastro.nome, cadastro }, emailRedirectTo: `${window.location.origin}/login` },
      });
      if (error) throw error;
      // Conta já existente: o Supabase não revela; devolve um usuário sem identidades
      if (data.user && !data.user.identities?.length) {
        setErro("Este e-mail já tem uma conta. Entre com sua senha na tela de login.");
        return;
      }
      // Sem confirmação de e-mail: a sessão já começa e a conta de teste é criada ao carregar
      if (data.session) navigate("/app/visao-geral", { replace: true });
      else setConfirmarEmail(true);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setEnviando(false);
    }
  };

  const whatsapp = linkWhatsApp(`Olá, ${contato.primeiroNome}! Estou criando minha conta na Frankkia e tenho uma dúvida.`);

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo className="text-[1.75rem]" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao site
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="mx-auto my-auto w-full max-w-md py-12"
        >
          {confirmarEmail ? (
            <div className="text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
                <MailCheck className="size-7" />
              </span>
              <h1 className="type-title mt-6">Confirme seu e-mail</h1>
              <p className="mt-3 text-muted">
                Enviamos um link para <span className="font-semibold text-ink">{f.email.trim().toLowerCase()}</span>. Clique nele para entrar:
                o seu teste grátis começa nesse momento.
              </p>
              <Link to="/login" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85">
                Ir para o login <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : logado ? (
            <div className="text-center">
              <h1 className="type-title">Você já tem uma conta</h1>
              <p className="mt-3 text-muted">
                Você entrou como <span className="font-semibold text-ink">{conta?.email}</span>. Para criar outra conta, saia primeiro.
              </p>
              <Link to="/app" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85">
                Ir para a plataforma <ArrowRight className="size-4" />
              </Link>
            </div>
          ) : (
            <>
              <p className="type-eyebrow text-accent">Teste grátis</p>
              <h1 className="type-title mt-3">{completar ? "Falta pouco" : "Crie sua conta na Frankkia"}</h1>
              <p className="mt-3 text-muted">
                {completar ? (
                  <>
                    Você entrou com o Google como <span className="font-semibold text-ink">{conta?.email}</span>. Complete os dados abaixo para começar o
                    teste grátis.
                  </>
                ) : (
                  "Comece agora, sem cartão. No fim do teste você escolhe se quer continuar."
                )}
              </p>

              {!completar && (
                <div className="mt-8">
                  <BotaoGoogle caminho={`/cadastro?plano=${encodeURIComponent(f.plano)}`} texto="Começar com o Google" />
                </div>
              )}

              <div className={`space-y-5 ${completar ? "mt-8" : ""}`}>
                {/* Plano */}
                <div>
                  <p className="mb-2 text-sm font-medium">Plano</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {opcoes.map((p) => {
                      const ativo = f.plano === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setF({ ...f, plano: p })}
                          className={`rounded-2xl border px-3 py-2.5 text-left transition-colors ${
                            ativo ? "border-accent bg-accent-soft/60" : "border-line hover:border-line-strong"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{p}</span>
                          <span className="block text-xs text-muted">{precoPlano(PLANOS[p].preco)}/mês</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {solo ? pricing.solo.seats : pricing.plans.find((x) => x.name === f.plano)?.seats}. Dá para trocar de plano depois.
                  </p>
                  {opcoes.includes("Equipe 10") && (
                    <p className="mt-1 text-xs text-muted">
                      Equipe com 30 ou 60 corretores?{" "}
                      <a
                        href={linkWhatsApp(`Olá, ${contato.primeiroNome}! Quero conhecer os planos Equipe 30/60 da Frankkia.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-ink underline-offset-4 hover:underline"
                      >
                        Fale com a Frankkia no WhatsApp
                      </a>
                    </p>
                  )}
                </div>

                <Field label="Seu nome completo">
                  <input className={inputCls} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoComplete="name" />
                </Field>
                {!solo && (
                  <Field label="Nome da imobiliária">
                    <input className={inputCls} value={f.imobiliaria} onChange={(e) => setF({ ...f, imobiliaria: e.target.value })} autoComplete="organization" />
                  </Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="WhatsApp">
                    <input
                      className={inputCls}
                      inputMode="tel"
                      value={f.telefone}
                      onChange={(e) => setF({ ...f, telefone: e.target.value })}
                      placeholder="(91) 98765-4321"
                      autoComplete="tel"
                    />
                  </Field>
                  <Field label="Cidade (opcional)">
                    <input className={inputCls} value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} placeholder="Ex.: Belém" />
                  </Field>
                </div>

                {/* CRECI */}
                <div className="rounded-2xl bg-canvas p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <BadgeCheck className="size-4 text-accent" /> Registro no CRECI
                  </p>
                  <div className="mt-3 grid grid-cols-[1fr_6rem] gap-3">
                    <Field
                      label={solo ? "Número do CRECI" : "Número do CRECI (opcional)"}
                      hint={solo ? "Obrigatório: aparece nos seus anúncios, como exige o conselho." : undefined}
                    >
                      <input className={inputCls} value={f.creci} onChange={(e) => setF({ ...f, creci: e.target.value })} placeholder="Ex.: 84213-F" />
                    </Field>
                    <Field label="Estado">
                      <SelectField value={f.creciUF} onChange={(v) => setF({ ...f, creciUF: v })} options={UFS.map((u) => ({ value: u, label: u }))} />
                    </Field>
                  </div>
                </div>

                {!completar && (<>
                <Field label="E-mail" hint="É com ele que você vai entrar.">
                  <input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Crie uma senha" hint="Mínimo de 8 caracteres.">
                    <input type="password" className={inputCls} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="new-password" />
                  </Field>
                  <Field label="Confirme a senha" hint={f.confirma && f.confirma !== f.senha ? "As senhas não conferem." : undefined}>
                    <input type="password" className={inputCls} value={f.confirma} onChange={(e) => setF({ ...f, confirma: e.target.value })} autoComplete="new-password" />
                  </Field>
                </div>
                </>)}

                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted">
                  <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-accent" checked={f.aceite} onChange={(e) => setF({ ...f, aceite: e.target.checked })} />
                  <span>
                    Li e aceito os{" "}
                    <a href="/termos" target="_blank" rel="noreferrer" className="font-medium text-ink underline">
                      Termos de Uso
                    </a>{" "}
                    e a{" "}
                    <a href="/privacidade" target="_blank" rel="noreferrer" className="font-medium text-ink underline">
                      Política de Privacidade
                    </a>
                    .
                  </span>
                </label>

                {erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

                <button
                  disabled={!ok || enviando}
                  onClick={criar}
                  className="group/button inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition-[background-color,transform] hover:bg-ink/85 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40"
                >
                  {enviando ? "Criando sua conta..." : "Começar teste grátis"}
                  <ArrowRight className="size-4 transition-transform group-hover/button:translate-x-0.5" />
                </button>
              </div>

              <ul className="mt-8 space-y-2.5 text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <CreditCard className="size-4 shrink-0 text-accent" /> Sem cartão para começar.
                </li>
                <li className="flex items-center gap-2.5">
                  <CalendarCheck className="size-4 shrink-0 text-accent" /> Seus dados continuam guardados se você contratar depois.
                </li>
                <li className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-accent" /> Cada corretor vê só os próprios clientes e negócios.
                </li>
              </ul>
            </>
          )}
        </motion.div>

        <p className="text-center text-xs text-subtle">
          Prefere conversar antes?{" "}
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-ink hover:text-accent">
            <WhatsAppIcon className="size-3.5" /> Falar com a Frankkia
          </a>
          {" · "}
          Já tem conta?{" "}
          <Link to="/login" className="font-medium text-ink hover:text-accent">
            Entrar
          </Link>
        </p>
      </div>

      {/* Painel visual (igual ao do login) */}
      <div className="relative hidden overflow-hidden bg-ink p-4 lg:sticky lg:top-0 lg:block lg:h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_80%_10%,rgb(47_91_234/0.55),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-between rounded-[2.25rem] p-10 text-bg">
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="type-statement max-w-[34rem] !text-[3rem] !leading-[1.05]"
          >
            {site.slogan}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 60, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE_OUT_EXPO }}
            className="-mb-24 -mr-40 overflow-hidden rounded-[28px] shadow-lift ring-8 ring-white/10"
          >
            <Scaled width={DASHBOARD_SIZE.width} height={DASHBOARD_SIZE.height}>
              <Dashboard active />
            </Scaled>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
