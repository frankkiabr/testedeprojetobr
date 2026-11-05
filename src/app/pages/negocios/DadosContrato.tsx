import { useState } from "react";
import { ChevronDown, FileSignature, Lock } from "lucide-react";
import type { DadosContrato, TipoCliente } from "@/data/types";
import { Segmented } from "../../kit";
import { DateInput, Field, inputCls, mascaraMoeda, moeda, SelectField } from "../../forms";

export const TIPOS_CLIENTE: { valor: TipoCliente; rotulo: string }[] = [
  { valor: "comprador", rotulo: "Comprador" },
  { valor: "locatario", rotulo: "Locatário" },
  { valor: "proprietario", rotulo: "Proprietário" },
  { valor: "investidor", rotulo: "Investidor" },
  { valor: "fiador", rotulo: "Fiador" },
];
export const rotuloTipoCliente = (t: TipoCliente) => TIPOS_CLIENTE.find((x) => x.valor === t)?.rotulo ?? t;

const ESTADOS_CIVIS = [
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "uniao_estavel", label: "União estável" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "separado", label: "Separado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
];
const REGIMES = [
  { value: "comunhao_parcial", label: "Comunhão parcial de bens" },
  { value: "comunhao_universal", label: "Comunhão universal de bens" },
  { value: "separacao_total", label: "Separação total de bens" },
  { value: "participacao_final", label: "Participação final nos aquestos" },
];

const so = (s: string) => s.replace(/\D/g, "");
/** 123.456.789-09 */
export const mascaraCpf = (s: string) =>
  so(s)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
/** 12.345.678/0001-90 */
export const mascaraCnpj = (s: string) =>
  so(s)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
/** CPF válido pelos dígitos verificadores. */
export function cpfValido(s: string) {
  const d = so(s);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (n: number) => {
    let soma = 0;
    for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
    const r = (soma * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}
/** CPF escondido nas listas: ***.456.789-** */
export const cpfMascarado = (s?: string) => (s && so(s).length === 11 ? `***.${so(s).slice(3, 6)}.${so(s).slice(6, 9)}-**` : "");

/** Quantos dados essenciais do contrato já foram preenchidos. */
export function progressoContrato(d: DadosContrato = {}) {
  const pj = d.pessoa === "juridica";
  const campos = pj
    ? [d.cnpj, d.razaoSocial, d.representanteNome, d.representanteCpf, d.endereco]
    : [d.cpf, d.rg, d.nascimento, d.nacionalidade, d.profissao, d.estadoCivil, d.endereco];
  const casado = !pj && (d.estadoCivil === "casado" || d.estadoCivil === "uniao_estavel");
  const extra = casado ? [d.regimeBens, d.conjugeNome, d.conjugeCpf] : [];
  const todos = [...campos, ...extra];
  return { feitos: todos.filter((x) => x !== undefined && String(x).trim() !== "").length, total: todos.length };
}

/** Escolha dos papéis do cliente (mais de um ao mesmo tempo). */
export function TiposCliente({ valor, onChange }: { valor: TipoCliente[]; onChange: (v: TipoCliente[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted">Tipo do cliente</p>
      <div className="flex flex-wrap gap-2">
        {TIPOS_CLIENTE.map((t) => {
          const on = valor.includes(t.valor);
          return (
            <button
              key={t.valor}
              type="button"
              onClick={() => onChange(on ? valor.filter((x) => x !== t.valor) : [...valor, t.valor])}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${on ? "border-accent bg-accent text-white" : "border-line-strong text-muted hover:border-ink/30"}`}
            >
              {t.rotulo}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * "Dados para contrato": qualificação do cliente para autorizações, propostas e contratos.
 * Opcional e recolhido; abre sozinho quando `abrirDeInicio` (ex.: lead em Proposta).
 */
export function DadosContratoCampos({
  valor,
  onChange,
  abrirDeInicio = false,
}: {
  valor: DadosContrato;
  onChange: (v: DadosContrato) => void;
  abrirDeInicio?: boolean;
}) {
  const [aberto, setAberto] = useState(abrirDeInicio);
  const d = valor;
  const set = (patch: Partial<DadosContrato>) => onChange({ ...d, ...patch });
  const txt = (k: keyof DadosContrato, label: string, extra?: { placeholder?: string; className?: string; mascara?: (s: string) => string; hint?: string }) => (
    <Field label={label} className={extra?.className} hint={extra?.hint}>
      <input
        className={inputCls}
        value={(d[k] as string) ?? ""}
        placeholder={extra?.placeholder}
        onChange={(e) => set({ [k]: (extra?.mascara ? extra.mascara(e.target.value) : e.target.value) || undefined } as Partial<DadosContrato>)}
      />
    </Field>
  );
  const pj = d.pessoa === "juridica";
  const casado = d.estadoCivil === "casado" || d.estadoCivil === "uniao_estavel";
  const { feitos, total } = progressoContrato(d);
  const cpfRuim = !!d.cpf && so(d.cpf).length === 11 && !cpfValido(d.cpf);

  return (
    <div className="rounded-2xl border border-line">
      <button type="button" onClick={() => setAberto(!aberto)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
          <FileSignature className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Dados para contrato</span>
          <span className="block text-xs text-muted">
            {feitos ? `${feitos} de ${total} preenchidos` : "Opcional: preencha quando o negócio avançar. Eles preenchem autorizações e contratos."}
          </span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>
      {aberto && (
        <div className="space-y-4 border-t border-line px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs text-muted">
              <Lock className="size-3.5" /> Só você e o administrador veem estes dados.
            </p>
            <Segmented
              id="pessoa-contrato"
              size="sm"
              value={pj ? "juridica" : "fisica"}
              onChange={(v) => set({ pessoa: v as "fisica" | "juridica" })}
              options={[
                { value: "fisica", label: "Pessoa física" },
                { value: "juridica", label: "Pessoa jurídica" },
              ]}
            />
          </div>

          {pj ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {txt("razaoSocial", "Razão social", { className: "sm:col-span-2" })}
              {txt("cnpj", "CNPJ", { placeholder: "00.000.000/0000-00", mascara: mascaraCnpj })}
              {txt("email", "E-mail para contratos")}
              {txt("representanteNome", "Representante legal")}
              {txt("representanteCpf", "CPF do representante", { placeholder: "000.000.000-00", mascara: mascaraCpf })}
              {txt("endereco", "Endereço da sede", { className: "sm:col-span-2", placeholder: "Rua, número, bairro, cidade - UF, CEP" })}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="CPF" hint={cpfRuim ? "Confira o CPF: os dígitos não batem." : undefined}>
                <input className={`${inputCls} ${cpfRuim ? "!border-rose-300" : ""}`} value={d.cpf ?? ""} placeholder="000.000.000-00" onChange={(e) => set({ cpf: mascaraCpf(e.target.value) || undefined })} />
              </Field>
              <Field label="Data de nascimento">
                <DateInput value={d.nascimento ?? ""} onChange={(v) => set({ nascimento: v || undefined })} />
              </Field>
              {txt("rg", "RG")}
              {txt("rgOrgao", "Órgão emissor", { placeholder: "Ex.: SSP/PA" })}
              {txt("nacionalidade", "Nacionalidade", { placeholder: "Ex.: brasileira" })}
              {txt("profissao", "Profissão")}
              <Field label="Estado civil">
                <SelectField value={d.estadoCivil ?? ""} onChange={(v) => set({ estadoCivil: (v || undefined) as DadosContrato["estadoCivil"] })} placeholder="Escolha" options={ESTADOS_CIVIS} />
              </Field>
              <Field label="Renda mensal comprovada" hint="Útil para locatário e fiador.">
                <input className={inputCls} inputMode="numeric" value={moeda(d.renda)} placeholder="0,00" onChange={(e) => {
                  const v = mascaraMoeda(e.target.value);
                  const n = Number(v.replace(/\./g, "").replace(",", "."));
                  set({ renda: n > 0 ? n : undefined });
                }} />
              </Field>
              {casado && (
                <>
                  <Field label="Regime de bens" className="sm:col-span-2">
                    <SelectField value={d.regimeBens ?? ""} onChange={(v) => set({ regimeBens: (v || undefined) as DadosContrato["regimeBens"] })} placeholder="Escolha" options={REGIMES} />
                  </Field>
                  {txt("conjugeNome", "Nome do cônjuge", { hint: "Na venda, o cônjuge costuma assinar junto." })}
                  {txt("conjugeCpf", "CPF do cônjuge", { placeholder: "000.000.000-00", mascara: mascaraCpf })}
                  {txt("conjugeRg", "RG do cônjuge")}
                </>
              )}
              {txt("email", "E-mail para contratos")}
              {txt("endereco", "Endereço de residência", { className: "sm:col-span-2", placeholder: "Rua, número, bairro, cidade - UF, CEP" })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
