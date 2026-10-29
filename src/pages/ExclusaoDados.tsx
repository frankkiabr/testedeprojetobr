import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { enviarInteressado } from "@/integrations/frankkia/client";
import { PaginaSimples } from "@/components/PaginaSimples";

const campo =
  "h-11 w-full rounded-xl border border-line-strong bg-bg px-3.5 text-sm outline-hidden transition placeholder:text-subtle focus:border-accent focus:ring-4 focus:ring-accent/10";

const PEDIDOS = [
  "Excluir minha conta e meus dados",
  "Excluir dados específicos",
  "Receber uma cópia dos meus dados",
  "Saber quais dados vocês têm sobre mim",
  "Corrigir dados",
  "Parar de receber e-mails",
];

/**
 * EXCLUSÃO E PEDIDOS SOBRE DADOS PESSOAIS (/exclusao-de-dados), pela LGPD.
 * O pedido chega à Frankkia em Painel → Interessados (origem "lgpd"); a resposta sai em até 15 dias.
 */
export default function ExclusaoDados() {
  const [f, setF] = useState({ nome: "", email: "", telefone: "", pedido: PEDIDOS[0], detalhes: "", site: "" });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const digitos = f.telefone.replace(/\D/g, "");
  const ok = f.nome.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && digitos.length >= 10 && digitos.length <= 13;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) return setErro("Preencha nome, e-mail e WhatsApp com DDD.");
    if (f.site) return setEnviado(true); // campo invisível: só robôs preenchem
    setEnviando(true);
    const r = await enviarInteressado({
      nome: f.nome,
      imobiliaria: `Pedido LGPD: ${f.pedido}`,
      email: f.email,
      telefone: digitos.length <= 11 ? `55${digitos}` : digitos,
      equipe: "",
      mensagem: f.detalhes,
      origem: "lgpd",
    });
    setEnviando(false);
    if (r) setErro(r);
    else setEnviado(true);
  };

  return (
    <PaginaSimples titulo="Exclusão e pedidos sobre dados pessoais" largura="max-w-3xl">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}>
        <p className="type-eyebrow text-accent">LGPD</p>
        <h1 className="type-title mt-3">Seus dados, do seu jeito.</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Peça a exclusão da sua conta, uma cópia dos seus dados ou a correção de alguma informação. Respondemos em até{" "}
          <strong className="text-ink">15 dias</strong>.
        </p>
      </motion.section>

      <section className="mt-10 rounded-[2rem] border border-line p-5 shadow-soft sm:p-8">
        {enviado ? (
          <div className="flex flex-col items-start gap-3">
            <CheckCircle2 className="size-8 text-verified" />
            <p className="font-display text-xl font-semibold">Pedido recebido.</p>
            <p className="text-muted">
              Vamos confirmar que o pedido é seu pelo e-mail ou WhatsApp informados e responder em até 15 dias. Se precisar, escreva para {site.email}.
            </p>
          </div>
        ) : (
          <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-muted">O que você quer pedir?</span>
              <select className={campo} value={f.pedido} onChange={(e) => setF({ ...f, pedido: e.target.value })}>
                {PEDIDOS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Nome completo</span>
              <input className={campo} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} autoComplete="name" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">E-mail (o mesmo do cadastro, se tiver conta)</span>
              <input type="email" className={campo} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted">WhatsApp com DDD</span>
              <input className={campo} inputMode="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(91) 98765-4321" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-xs font-semibold text-muted">Detalhes (opcional)</span>
              <textarea
                className={`${campo} h-24 resize-y py-2.5`}
                maxLength={1500}
                value={f.detalhes}
                onChange={(e) => setF({ ...f, detalhes: e.target.value })}
                placeholder="Ex.: quais dados corrigir, ou o anúncio em que você deixou seu contato."
              />
            </label>
            <input tabIndex={-1} aria-hidden className="hidden" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} autoComplete="off" />
            {erro && <p className="text-sm text-rose-600 sm:col-span-2">{erro}</p>}
            <div className="sm:col-span-2">
              <button
                disabled={enviando}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-bg transition hover:bg-ink/85 active:scale-[0.98] disabled:opacity-50"
              >
                <ShieldCheck className="size-4" /> {enviando ? "Enviando..." : "Enviar pedido"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-12 space-y-4 leading-relaxed text-muted">
        <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Como funciona</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Antes de atender, confirmamos que o pedido é mesmo seu, para ninguém excluir ou ver dados de outra pessoa.</li>
          <li>
            Na exclusão da conta, apagamos seus dados de cadastro e os dados de negócio da conta. Registros de pagamento ficam guardados pelo prazo
            exigido pela lei fiscal (em geral, 5 anos).
          </li>
          <li>
            Deixou seu contato num anúncio do portal ou foi cadastrado por uma imobiliária? Quem decide sobre esses dados é a imobiliária ou o
            corretor. Encaminhamos o seu pedido a eles e acompanhamos a resposta.
          </li>
          <li>
            Se preferir, escreva para {site.email}. Também é possível reclamar à Autoridade Nacional de Proteção de Dados (ANPD). Mais detalhes na{" "}
            <Link to="/privacidade" className="font-semibold text-accent">
              Política de Privacidade
            </Link>
            .
          </li>
        </ul>
      </section>
    </PaginaSimples>
  );
}
