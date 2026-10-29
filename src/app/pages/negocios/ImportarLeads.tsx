import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Upload } from "lucide-react";
import { ETAPAS, leads, ORIGENS } from "@/data/demo";
import { useStore } from "@/data/store";
import type { EtapaLead } from "@/data/types";
import { lerPlanilha, lerTexto, type Linhas } from "@/lib/planilha";
import { btn, Field, formatPhone, inputCls, Modal, normalizePhone, SelectField } from "../../forms";
import { CorretorField, useTargetCorretor } from "./shared";

const LIMITE = 2000;
type Campo = "nome" | "telefone" | "interesse" | "origem" | "email" | "observacoes";
const CAMPOS: { k: Campo; rotulo: string; obrigatorio?: boolean; busca: RegExp }[] = [
  { k: "telefone", rotulo: "WhatsApp / telefone", obrigatorio: true, busca: /whats|telefone|celular|fone|\btel\b|n[uú]mero/i },
  { k: "nome", rotulo: "Nome", obrigatorio: true, busca: /nome|cliente|lead/i },
  { k: "interesse", rotulo: "Interesse", busca: /interesse|im[oó]vel|procura|busca|produto|perfil/i },
  { k: "origem", rotulo: "Origem", busca: /origem|fonte|canal|m[ií]dia|campanha/i },
  { k: "email", rotulo: "E-mail", busca: /e-?mail/i },
  { k: "observacoes", rotulo: "Observações", busca: /observa|\bobs\b|nota|coment|anota/i },
];

/** Telefone da planilha → só números com 55 (aceita "+55 (91) 98095-9265", "091980959265", "91980959265"). Vazio se não parecer celular/fixo. */
function telefoneDe(s: string) {
  let d = s.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 12 || d.length === 13) d = d.startsWith("55") ? d : "";
  else d = normalizePhone(d);
  return d.length === 12 || d.length === 13 ? d : "";
}

const letra = (i: number) => String.fromCharCode(65 + (i % 26));
const MODELO = "Nome;WhatsApp;Interesse;Origem;E-mail;Observações\nMaria Souza;(91) 98888-7777;Apartamento 2 quartos no Umarizal;Instagram;maria@email.com;Prefere contato à tarde\n";

/** Descobre a linha de cabeçalho e qual coluna é cada campo. */
function mapear(linhas: Linhas) {
  const cab = linhas[0] ?? [];
  const temCabecalho = cab.some((c) => CAMPOS.some((f) => f.busca.test(c)));
  const colunas = Array.from({ length: Math.max(0, ...linhas.map((l) => l.length)) }, (_, i) => (temCabecalho && cab[i] ? cab[i] : `Coluna ${letra(i)}`));
  const dados = temCabecalho ? linhas.slice(1) : linhas;
  const mapa: Partial<Record<Campo, number>> = {};
  if (temCabecalho)
    for (const f of CAMPOS) {
      const i = cab.findIndex((c, j) => f.busca.test(c) && !Object.values(mapa).includes(j));
      if (i >= 0) mapa[f.k] = i;
    }
  // Sem cabeçalho: telefone = a coluna com mais números de telefone; nome = a primeira coluna de texto
  if (mapa.telefone === undefined) {
    const nota = colunas.map((_, i) => dados.slice(0, 50).filter((l) => telefoneDe(l[i] ?? "")).length);
    const melhor = nota.indexOf(Math.max(...nota));
    if (nota[melhor] > 0) mapa.telefone = melhor;
  }
  if (mapa.nome === undefined) {
    const i = colunas.findIndex((_, j) => j !== mapa.telefone && dados.slice(0, 20).some((l) => /[a-zà-ú]{2}/i.test(l[j] ?? "")));
    if (i >= 0) mapa.nome = i;
  }
  return { colunas, dados, mapa };
}

/** IMPORTAR LEADS de uma planilha (.xlsx, .csv) ou de texto colado. Pula telefones inválidos e quem já está cadastrado. */
export function ImportarLeadsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importarLeads } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const arquivo = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<Linhas | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [colado, setColado] = useState("");
  const [colar, setColar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mapa, setMapa] = useState<Partial<Record<Campo, number>>>({});
  const [origemPadrao, setOrigemPadrao] = useState("Planilha");
  const [etapa, setEtapa] = useState<EtapaLead>("novo");
  const [pularRepetidos, setPularRepetidos] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLinhas(null);
    setNomeArquivo("");
    setColado("");
    setColar(false);
    setErro(null);
    setEtapa("novo");
    setOrigemPadrao("Planilha");
    setPularRepetidos(true);
  }, [open]);

  const leitura = useMemo(() => (linhas ? mapear(linhas) : null), [linhas]);
  useEffect(() => {
    if (leitura) setMapa(leitura.mapa);
  }, [leitura]);

  const carregar = (l: Linhas, nome: string) => {
    if (!l.length) return setErro("Não encontramos linhas com dados.");
    setErro(null);
    setNomeArquivo(nome);
    setLinhas(l);
  };
  const abrirArquivo = async (f: File | undefined) => {
    if (!f) return;
    try {
      carregar(await lerPlanilha(f), f.name);
    } catch (e) {
      const m = e instanceof Error ? e.message : "";
      setErro(m.startsWith("FORMATO: ") ? m.slice(9) : "Não conseguimos ler este arquivo. Salve como .xlsx ou .csv e tente de novo.");
    }
  };

  // Cada linha da planilha → lead (ou o motivo de ficar de fora)
  const resultado = useMemo(() => {
    if (!leitura) return null;
    const existentes = new Set(leads.map((l) => l.telefone));
    const vistos = new Set<string>();
    const cel = (l: string[], k: Campo) => (mapa[k] === undefined ? "" : (l[mapa[k]!] ?? "").trim());
    return leitura.dados.slice(0, LIMITE).map((l) => {
      const nome = cel(l, "nome").slice(0, 120);
      const telefone = telefoneDe(cel(l, "telefone"));
      const motivo = !nome ? "Sem nome" : !telefone ? "Telefone inválido" : vistos.has(telefone) ? "Repetido na planilha" : pularRepetidos && existentes.has(telefone) ? "Já cadastrado" : "";
      if (telefone) vistos.add(telefone);
      const extras = [cel(l, "email") && `E-mail: ${cel(l, "email")}`, cel(l, "observacoes")].filter(Boolean).join("\n");
      return {
        motivo,
        lead: {
          nome,
          telefone,
          interesse: cel(l, "interesse").slice(0, 300) || "Não informado",
          origem: cel(l, "origem").slice(0, 40) || origemPadrao,
          observacoes: extras.slice(0, 2000) || undefined,
        },
      };
    });
  }, [leitura, mapa, origemPadrao, pularRepetidos]);

  const validos = resultado?.filter((r) => !r.motivo) ?? [];
  const motivos = resultado ? Object.entries(resultado.filter((r) => r.motivo).reduce<Record<string, number>>((a, r) => ({ ...a, [r.motivo]: (a[r.motivo] ?? 0) + 1 }), {})) : [];
  const pronto = !!validos.length && mapa.nome !== undefined && mapa.telefone !== undefined && !!corretorId;

  const baixarModelo = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + MODELO], { type: "text/csv;charset=utf-8" }));
    a.download = "modelo-leads-frankkia.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      largo={!!leitura}
      title="Importar leads"
      subtitle={leitura ? `${nomeArquivo} · ${leitura.dados.length} ${leitura.dados.length === 1 ? "linha" : "linhas"}` : "De uma planilha do Excel, Google Planilhas ou CSV."}
      footer={
        leitura ? (
          <>
            <button className={btn.outline} onClick={() => setLinhas(null)}>
              Trocar arquivo
            </button>
            <button
              className={btn.accent}
              disabled={!pronto}
              onClick={() => {
                importarLeads(validos.map((v) => ({ ...v.lead, corretorId, etapa })));
                onClose();
              }}
            >
              <Upload className="size-4" /> Importar {validos.length} {validos.length === 1 ? "lead" : "leads"}
            </button>
          </>
        ) : undefined
      }
    >
      {!leitura ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => arquivo.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void abrirArquivo(e.dataTransfer.files[0]);
            }}
            className="flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-line-strong px-6 py-10 text-center transition hover:border-accent hover:bg-accent-soft/30"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent">
              <FileSpreadsheet className="size-6" />
            </span>
            <span className="font-semibold">Escolher ou arrastar a planilha</span>
            <span className="text-sm text-muted">Excel (.xlsx) ou CSV. A primeira aba é a que vale.</span>
          </button>
          <input ref={arquivo} type="file" accept=".xlsx,.csv,.txt,text/csv" className="hidden" onChange={(e) => (void abrirArquivo(e.target.files?.[0]), (e.target.value = ""))} />

          {colar ? (
            <div className="space-y-2">
              <textarea
                className={`${inputCls} h-32 resize-y py-2.5 font-mono text-xs`}
                value={colado}
                onChange={(e) => setColado(e.target.value)}
                placeholder={"Selecione as células na planilha, copie (Ctrl+C) e cole aqui (Ctrl+V).\nNome\tWhatsApp\tInteresse"}
                autoFocus
              />
              <button className={btn.primary} disabled={!colado.trim()} onClick={() => carregar(lerTexto(colado), "Texto colado")}>
                Conferir
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setColar(true)} className={`${btn.outline} w-full`}>
              <ClipboardPaste className="size-4" /> Prefiro copiar e colar da planilha
            </button>
          )}

          {erro && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{erro}</p>}

          <div className="rounded-2xl bg-canvas p-4 text-sm text-muted">
            <p>
              Precisa ter pelo menos <strong className="text-ink">nome</strong> e <strong className="text-ink">WhatsApp</strong>. Interesse, origem,
              e-mail e observações são opcionais. Quem já está cadastrado (mesmo WhatsApp) fica de fora.
            </p>
            <button type="button" onClick={baixarModelo} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-accent">
              <Download className="size-4" /> Baixar planilha modelo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold">Qual coluna é cada informação?</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {CAMPOS.map((f) => (
                <Field key={f.k} label={f.obrigatorio ? `${f.rotulo} *` : f.rotulo}>
                  <SelectField
                    value={mapa[f.k] === undefined ? "" : String(mapa[f.k])}
                    onChange={(v) => setMapa((m) => ({ ...m, [f.k]: v === "" ? undefined : Number(v) }))}
                    options={[{ value: "", label: f.obrigatorio ? "Escolha a coluna" : "Não tem" }, ...leitura.colunas.map((c, i) => ({ value: String(i), label: c }))]}
                  />
                </Field>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {mapa.origem === undefined && (
              <Field label="Origem dos leads">
                <SelectField value={origemPadrao} onChange={setOrigemPadrao} options={["Planilha", ...ORIGENS].map((o) => ({ value: o, label: o }))} />
              </Field>
            )}
            <Field label="Entram na etapa">
              <SelectField value={etapa} onChange={(v) => setEtapa(v as EtapaLead)} options={ETAPAS.filter((e) => e.id !== "fechado" && e.id !== "perdido").map((e) => ({ value: e.id, label: e.label }))} />
            </Field>
            {isAdmin && <CorretorField value={corretorId} onChange={setCorretorId} />}
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" className="size-4 accent-accent" checked={pularRepetidos} onChange={(e) => setPularRepetidos(e.target.checked)} />
            Pular quem já está cadastrado (mesmo WhatsApp)
          </label>

          <div className="flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-verified-soft px-3 py-1.5 font-semibold text-verified">
              <CheckCircle2 className="size-4" /> {validos.length} para importar
            </span>
            {motivos.map(([m, n]) => (
              <span key={m} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 font-semibold text-amber-800">
                <AlertTriangle className="size-4" /> {n} · {m}
              </span>
            ))}
            {leitura.dados.length > LIMITE && <span className="text-xs text-muted">Só as primeiras {LIMITE} linhas entram por vez.</span>}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-left text-xs text-muted">
                  <th className="px-3 py-2 font-semibold">Nome</th>
                  <th className="px-3 py-2 font-semibold">WhatsApp</th>
                  <th className="px-3 py-2 font-semibold">Interesse</th>
                  <th className="px-3 py-2 font-semibold">Origem</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {resultado!.slice(0, 8).map((r, i) => (
                  <tr key={i} className={`border-b border-line last:border-0 ${r.motivo ? "text-subtle" : ""}`}>
                    <td className="max-w-[10rem] truncate px-3 py-2 font-medium">{r.lead.nome || "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{r.lead.telefone ? formatPhone(r.lead.telefone) : "—"}</td>
                    <td className="max-w-[12rem] truncate px-3 py-2">{r.lead.interesse}</td>
                    <td className="px-3 py-2">{r.lead.origem}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">{r.motivo ? <span className="text-amber-700">{r.motivo}</span> : <span className="text-verified">ok</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {resultado!.length > 8 && <p className="border-t border-line px-3 py-2 text-xs text-muted">Mostrando 8 de {resultado!.length} linhas.</p>}
          </div>
        </div>
      )}
    </Modal>
  );
}
