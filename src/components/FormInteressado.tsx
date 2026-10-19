import { useState } from "react";
import { demo } from "@/content";
import { enviarInteressado, type NovoInteressado } from "@/integrations/frankkia/client";

export type CamposInteressado = { nome: string; imobiliaria: string; email: string; telefone: string; equipe: string; mensagem: string; site: string };
const vazio: CamposInteressado = { nome: "", imobiliaria: "", email: "", telefone: "", equipe: "", mensagem: "", site: "" };

/** Estado e envio do pedido de apresentação (usado no site e na página de apresentação). */
export function useFormInteressado(origem: NovoInteressado["origem"]) {
  const [f, setF] = useState<CamposInteressado>(vazio);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const digitos = f.telefone.replace(/\D/g, "");
  const ok =
    f.nome.trim().length >= 2 && f.imobiliaria.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && digitos.length >= 10 && digitos.length <= 13;

  const campo = (k: keyof CamposInteressado) => ({
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setErro(null);
      setF({ ...f, [k]: e.target.value });
    },
  });

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ok) {
      setErro("Preencha nome, imobiliária, e-mail e WhatsApp com DDD.");
      return;
    }
    // Campo invisível: só robôs preenchem. Finge que enviou.
    if (f.site) {
      setEnviado(true);
      return;
    }
    setEnviando(true);
    // WhatsApp sem o 55 do Brasil: acrescenta
    const telefone = digitos.length <= 11 ? `55${digitos}` : digitos;
    const r = await enviarInteressado({ ...f, telefone, origem });
    setEnviando(false);
    if (r) setErro(r);
    else {
      setEnviado(true);
      setF(vazio);
    }
  };

  return { f, campo, ok, enviar, enviando, enviado, erro, setEnviado };
}

/** Campo escondido contra robôs (pessoas não veem nem preenchem). */
export function CampoArmadilha({ value, onChange }: { value: string; onChange: React.ChangeEventHandler<HTMLInputElement> }) {
  return (
    <input
      type="text"
      name="site"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden="true"
      value={value}
      onChange={onChange}
      className="absolute left-[-9999px] h-px w-px opacity-0"
    />
  );
}

export const TAMANHOS_EQUIPE = demo.teamSize;
