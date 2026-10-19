import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, GraduationCap, Info, PartyPopper } from "lucide-react";
import { convites, imobiliaria, UFS } from "@/data/demo";
import { useStore } from "@/data/store";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";
import { Field, inputCls, normalizePhone, SelectField, Toaster } from "@/app/forms";

/**
 * PRIMEIRO ACESSO (convite).
 * O corretor convidado completa o cadastro: nome, WhatsApp, aniversário e CRECI
 * (ou marca que é estagiário, e aí o CRECI deixa de ser obrigatório).
 */
export default function Convite() {
  const { id } = useParams();
  const { aceitarConvite } = useStore();
  const convite = convites.find((c) => c.id === id);
  const [f, setF] = useState({ nome: "", telefone: "", aniversario: "", estagiario: false, creci: "", creciUF: "SP", senha: "", confirma: "" });
  const [feito, setFeito] = useState<string | null>(null);

  const creciOk = f.estagiario || f.creci.trim().length >= 3;
  const ok = f.nome.trim().split(/\s+/).length >= 2 && normalizePhone(f.telefone).length >= 12 && f.aniversario && creciOk && f.senha.length >= 8 && f.senha === f.confirma;

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
          {feito ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE_OUT_EXPO }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-verified-soft text-verified">
                <PartyPopper className="size-7" />
              </span>
              <h1 className="type-title mt-6">Tudo pronto, {feito}!</h1>
              <p className="mt-3 text-muted">
                Seu cadastro na {imobiliaria.nome} foi concluído. Na versão final, você entra direto na plataforma com seu e-mail e senha.
              </p>
              <Link to="/app/equipe" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg">
                Ver na equipe (como administrador) <ArrowRight className="size-4" />
              </Link>
            </motion.div>
          ) : !convite ? (
            <motion.div key="invalido" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl border border-line bg-bg p-10 text-center">
              <h1 className="type-title">Convite não encontrado</h1>
              <p className="mt-3 text-muted">Este convite já foi usado, foi cancelado ou expirou. Peça um novo convite ao administrador da imobiliária.</p>
              <Link to="/" className="mt-6 inline-block text-sm font-semibold text-accent">
                Voltar ao site
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
              <p className="type-eyebrow text-accent">Convite</p>
              <h1 className="type-title mt-2">Bem-vindo(a) à {imobiliaria.nome}</h1>
              <p className="mt-3 text-muted">
                Complete seu cadastro para acessar a Frankkia com o e-mail <span className="font-semibold text-ink">{convite.email}</span>.
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
                    <input type="date" className={inputCls} value={f.aniversario} onChange={(e) => setF({ ...f, aniversario: e.target.value })} />
                  </Field>
                </div>

                {/* CRECI */}
                <div className="rounded-2xl bg-canvas p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <BadgeCheck className="size-4 text-accent" /> Registro no CRECI
                    </p>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" className="size-4 accent-accent" checked={f.estagiario} onChange={(e) => setF({ ...f, estagiario: e.target.checked })} />
                      <GraduationCap className="size-4 text-muted" /> Sou estagiário(a)
                    </label>
                  </div>
                  <div className="mt-3 grid grid-cols-[1fr_6rem] gap-3">
                    <Field label={f.estagiario ? "Número do CRECI (opcional)" : "Número do CRECI"}>
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Crie uma senha" hint="Mínimo de 8 caracteres.">
                    <input type="password" className={inputCls} value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} autoComplete="new-password" />
                  </Field>
                  <Field label="Confirme a senha" hint={f.confirma && f.confirma !== f.senha ? "As senhas não conferem." : undefined}>
                    <input type="password" className={inputCls} value={f.confirma} onChange={(e) => setF({ ...f, confirma: e.target.value })} autoComplete="new-password" />
                  </Field>
                </div>

                <button
                  disabled={!ok}
                  onClick={() => {
                    const u = aceitarConvite(convite.id, {
                      nome: f.nome.trim(),
                      telefone: normalizePhone(f.telefone),
                      aniversario: f.aniversario,
                      estagiario: f.estagiario,
                      creci: f.creci.trim() || undefined,
                      creciUF: f.creci.trim() ? f.creciUF : undefined,
                    });
                    if (u) setFeito(u.nome.split(" ")[0]);
                  }}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-bg transition hover:bg-ink/85 disabled:pointer-events-none disabled:opacity-40"
                >
                  Concluir cadastro <ArrowRight className="size-4" />
                </button>
                <p className="text-center text-xs text-subtle">Demonstração: a senha não é salva. O login real chega com o Lovable Cloud.</p>
              </div>
            </motion.div>
          )}
        </>
      </main>
      <Toaster />
    </div>
  );
}
