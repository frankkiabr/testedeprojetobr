import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Download, FileSpreadsheet, Upload } from "lucide-react";
import { captacoes, imobiliaria, imoveis, proprietarios } from "@/data/demo";
import { useStore } from "@/data/store";
import type { CategoriaImovel, Finalidade } from "@/data/types";
import { TIPOS_IMOVEL } from "@/lib/imovel";
import { lerPlanilha, lerTexto, type Linhas } from "@/lib/planilha";
import { brl } from "@/lib/format";
import { btn, Field, formatPhone, inputCls, Modal, normalizePhone, SelectField } from "../../forms";
import { chaveEndereco, CorretorField, useTargetCorretor } from "./shared";

const LIMITE = 2000;
type Tipo = "imoveis" | "proprietarios";
type Def = { k: string; rotulo: string; obrigatorio?: boolean; busca: RegExp };

const PROP: Def[] = [
  { k: "propNome", rotulo: "Nome do proprietário", obrigatorio: true, busca: /propriet|dono|nome|cliente/i },
  { k: "propWhats", rotulo: "WhatsApp do proprietário", obrigatorio: true, busca: /whats|telefone|celular|fone|\btel\b/i },
];
const CAMPOS: Record<Tipo, Def[]> = {
  proprietarios: PROP,
  imoveis: [
    ...PROP,
    { k: "logradouro", rotulo: "Rua / logradouro", obrigatorio: true, busca: /logradouro|\brua\b|endere[cç]o|avenida/i },
    { k: "numero", rotulo: "Número", obrigatorio: true, busca: /^n[uú]mero$|^n[ºo°.]*$|^num/i },
    { k: "bairro", rotulo: "Bairro", obrigatorio: true, busca: /bairro/i },
    { k: "valor", rotulo: "Valor (venda ou aluguel)", obrigatorio: true, busca: /valor|pre[cç]o|aluguel/i },
    { k: "area", rotulo: "Área (m²)", obrigatorio: true, busca: /[aá]rea|m2|m²|metragem/i },
    { k: "categoria", rotulo: "Tipo de imóvel", busca: /^tipo|categoria/i },
    { k: "finalidade", rotulo: "Finalidade", busca: /finalidade|neg[oó]cio|venda|loca/i },
    { k: "cidade", rotulo: "Cidade", busca: /cidade|munic/i },
    { k: "uf", rotulo: "UF", busca: /^uf$|estado/i },
    { k: "cep", rotulo: "CEP", busca: /cep/i },
    { k: "unidade", rotulo: "Unidade (apto/sala)", busca: /unidade|apto|apartamento|sala|bloco/i },
    { k: "predio", rotulo: "Nome do prédio/condomínio", busca: /pr[eé]dio|edif[ií]cio|condom[ií]nio|empreendimento/i },
    { k: "quartos", rotulo: "Quartos", busca: /quarto|dormit/i },
    { k: "suites", rotulo: "Suítes", busca: /su[ií]te/i },
    { k: "banheiros", rotulo: "Banheiros", busca: /banheiro|wc/i },
    { k: "vagas", rotulo: "Vagas", busca: /vaga|garagem/i },
  ],
};

const MODELOS: Record<Tipo, string> = {
  proprietarios: "Nome;WhatsApp\nJoão Pereira;(91) 98888-7777\n",
  imoveis:
    "Proprietário;WhatsApp;Tipo;Finalidade;Valor;Área;Rua;Número;Bairro;Cidade;UF;CEP;Unidade;Prédio;Quartos;Suítes;Banheiros;Vagas\n" +
    "João Pereira;(91) 98888-7777;Apartamento;Venda;850.000,00;95;Rua Antônio Barreto;1200;Umarizal;Belém;PA;66055050;Apto 302;Ed. Solar;3;1;2;2\n",
};

/** Telefone → só números com 55. Vazio se não parecer telefone. */
function telefoneDe(s: string) {
  let d = s.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 12 || d.length === 13) d = d.startsWith("55") ? d : "";
  else d = normalizePhone(d);
  return d.length === 12 || d.length === 13 ? d : "";
}

/** "R$ 1.200.000,00" → 1200000; "85,5" → 85.5; "1200000" → 1200000. */
export function numeroDe(s: string) {
  let t = s.replace(/[^\d.,]/g, "");
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/\.\d{3}$/.test(t) || (t.match(/\./g) ?? []).length > 1) t = t.replace(/\./g, "");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

const sem = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
function categoriaDe(s: string): CategoriaImovel | null {
  const t = sem(s);
  if (!t) return null;
  const exato = TIPOS_IMOVEL.find((x) => sem(x.valor) === t || sem(x.rotulo) === t);
  if (exato) return exato.valor as CategoriaImovel;
  if (/^apto|^ap\b|apart/.test(t)) return "Apartamento";
  const parte = TIPOS_IMOVEL.find((x) => t.includes(sem(x.valor)));
  return (parte?.valor as CategoriaImovel) ?? null;
}
const finalidadeDe = (s: string): Finalidade | null => (/alug|loca/i.test(s) ? "locacao" : /vend/i.test(s) ? "venda" : null);
const inteiro = (s: string) => (s.trim() === "" ? undefined : Math.min(50, Math.max(0, Math.round(numeroDe(s)))));
const letra = (i: number) => String.fromCharCode(65 + (i % 26));

function mapear(linhas: Linhas, campos: Def[]) {
  const cab = linhas[0] ?? [];
  const temCabecalho = cab.some((c) => campos.some((f) => f.busca.test(c)));
  const colunas = Array.from({ length: Math.max(0, ...linhas.map((l) => l.length)) }, (_, i) => (temCabecalho && cab[i] ? cab[i] : `Coluna ${letra(i)}`));
  const dados = temCabecalho ? linhas.slice(1) : linhas;
  const mapa: Record<string, number | undefined> = {};
  if (temCabecalho)
    for (const f of campos) {
      const i = cab.findIndex((c, j) => f.busca.test(c.trim()) && !Object.values(mapa).includes(j));
      if (i >= 0) mapa[f.k] = i;
    }
  if (mapa.propWhats === undefined) {
    const nota = colunas.map((_, i) => dados.slice(0, 50).filter((l) => telefoneDe(l[i] ?? "")).length);
    const melhor = nota.indexOf(Math.max(...nota));
    if (nota[melhor] > 0) mapa.propWhats = melhor;
  }
  if (mapa.propNome === undefined) {
    const i = colunas.findIndex((_, j) => !Object.values(mapa).includes(j) && dados.slice(0, 20).some((l) => /[a-zà-ú]{2}/i.test(l[j] ?? "")));
    if (i >= 0) mapa.propNome = i;
  }
  return { colunas, dados, mapa };
}

/** IMPORTAR IMÓVEIS ou PROPRIETÁRIOS de uma planilha (.xlsx, .csv) ou de texto colado. */
export function ImportarCarteiraModal({ tipo, open, onClose }: { tipo: Tipo; open: boolean; onClose: () => void }) {
  const { importarImoveis, importarProprietarios } = useStore();
  const { isAdmin, corretorId, setCorretorId } = useTargetCorretor(open);
  const campos = CAMPOS[tipo];
  const ehImoveis = tipo === "imoveis";
  const arquivo = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<Linhas | null>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [colado, setColado] = useState("");
  const [colar, setColar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mapa, setMapa] = useState<Record<string, number | undefined>>({});
  const [finPadrao, setFinPadrao] = useState<Finalidade>("venda");
  const [catPadrao, setCatPadrao] = useState<CategoriaImovel>("Apartamento");
  const cidadePadrao = imobiliaria.cidade.split(",")[0]?.trim() ?? "";
  const ufPadrao = imobiliaria.cidade.split(",")[1]?.trim() ?? "";

  useEffect(() => {
    if (!open) return;
    setLinhas(null);
    setNomeArquivo("");
    setColado("");
    setColar(false);
    setErro(null);
  }, [open]);

  const leitura = useMemo(() => (linhas ? mapear(linhas, campos) : null), [linhas, campos]);
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

  const resultado = useMemo(() => {
    if (!leitura) return null;
    const cel = (l: string[], k: string) => (mapa[k] === undefined ? "" : (l[mapa[k]!] ?? "").trim());
    const propsExistentes = new Set(proprietarios.filter((p) => p.corretorId === corretorId).map((p) => p.whatsapp));
    // Captação já cadastrada = mesmo endereço + mesma unidade + mesma finalidade
    const chaveCap = (end: string, unidade: string, fin: string) => `${end}#${sem(unidade)}#${fin}`;
    const capsExistentes = new Set(
      captacoes.map((c) => {
        const im = imoveis.find((i) => i.id === c.imovelId);
        return im ? chaveCap(chaveEndereco(im.endereco), c.unidade ?? "", c.finalidade) : "";
      }),
    );
    const vistos = new Set<string>();
    return leitura.dados.slice(0, LIMITE).map((l) => {
      const propNome = cel(l, "propNome").slice(0, 120);
      const propWhats = telefoneDe(cel(l, "propWhats"));
      if (!ehImoveis) {
        const motivo = !propNome ? "Sem nome" : !propWhats ? "WhatsApp inválido" : vistos.has(propWhats) ? "Repetido na planilha" : propsExistentes.has(propWhats) ? "Já cadastrado" : "";
        if (propWhats) vistos.add(propWhats);
        return { motivo, propNome, propWhats, titulo: "", valor: 0, finalidade: "venda" as Finalidade, linha: null };
      }
      const endereco = {
        logradouro: cel(l, "logradouro").slice(0, 150),
        numero: cel(l, "numero").slice(0, 20) || "S/N",
        bairro: cel(l, "bairro").slice(0, 80),
        cidade: cel(l, "cidade").slice(0, 80) || cidadePadrao,
        uf: (cel(l, "uf").slice(0, 2) || ufPadrao).toUpperCase(),
      };
      const categoria = categoriaDe(cel(l, "categoria")) ?? catPadrao;
      const finalidade = finalidadeDe(cel(l, "finalidade")) ?? finPadrao;
      const valor = numeroDe(cel(l, "valor"));
      const area = numeroDe(cel(l, "area"));
      const unidade = cel(l, "unidade").slice(0, 40);
      const cep = cel(l, "cep").replace(/\D/g, "");
      const chave = chaveCap(chaveEndereco(endereco), unidade, finalidade);
      const motivo = !propNome
        ? "Sem proprietário"
        : !propWhats
          ? "WhatsApp inválido"
          : !endereco.logradouro || !endereco.bairro || !endereco.cidade || !endereco.uf
            ? "Endereço incompleto"
            : !(valor > 0)
              ? "Sem valor"
              : !(area > 0)
                ? "Sem área"
                : vistos.has(chave)
                  ? "Repetido na planilha"
                  : capsExistentes.has(chave)
                    ? "Já cadastrado"
                    : "";
      vistos.add(chave);
      return {
        motivo,
        propNome,
        propWhats,
        titulo: `${categoria}${unidade ? ` · ${unidade}` : ""} — ${endereco.logradouro}, ${endereco.numero} · ${endereco.bairro}`,
        valor,
        finalidade,
        linha: {
          corretorId,
          propNome,
          propWhats,
          categoria,
          nome: cel(l, "predio").slice(0, 120) || undefined,
          endereco,
          cep: cep.length === 8 ? cep : undefined,
          unidade: unidade || undefined,
          finalidade,
          valor,
          areaM2: area,
          comodos: { quartos: inteiro(cel(l, "quartos")), suites: inteiro(cel(l, "suites")), banheiros: inteiro(cel(l, "banheiros")), vagas: inteiro(cel(l, "vagas")) },
        },
      };
    });
  }, [leitura, mapa, corretorId, ehImoveis, finPadrao, catPadrao, cidadePadrao, ufPadrao]);

  const validos = resultado?.filter((r) => !r.motivo) ?? [];
  const motivos = resultado ? Object.entries(resultado.filter((r) => r.motivo).reduce<Record<string, number>>((a, r) => ({ ...a, [r.motivo]: (a[r.motivo] ?? 0) + 1 }), {})) : [];
  const obrigatoriosOk = campos.filter((f) => f.obrigatorio).every((f) => mapa[f.k] !== undefined);
  const pronto = !!validos.length && obrigatoriosOk && !!corretorId;
  const nomeItem = (n: number) => (ehImoveis ? (n === 1 ? "imóvel" : "imóveis") : n === 1 ? "proprietário" : "proprietários");

  const importar = () => {
    if (ehImoveis) importarImoveis(validos.map((v) => v.linha!), chaveEndereco);
    else importarProprietarios(validos.map((v) => ({ corretorId, nome: v.propNome, whatsapp: v.propWhats })));
    onClose();
  };

  const baixarModelo = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + MODELOS[tipo]], { type: "text/csv;charset=utf-8" }));
    a.download = `modelo-${tipo}-frankkia.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      largo={leitura ? "extra" : undefined}
      title={ehImoveis ? "Importar imóveis" : "Importar proprietários"}
      subtitle={
        leitura
          ? `${nomeArquivo} · ${leitura.dados.length} ${leitura.dados.length === 1 ? "linha" : "linhas"}`
          : "Traga sua carteira de outro sistema ou de uma planilha do Excel, Google Planilhas ou CSV."
      }
      footer={
        leitura ? (
          <>
            <button className={btn.outline} onClick={() => setLinhas(null)}>
              Trocar arquivo
            </button>
            <button className={btn.accent} disabled={!pronto} onClick={importar}>
              <Upload className="size-4" /> Importar {validos.length} {nomeItem(validos.length)}
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
                placeholder="Selecione as células na planilha (com o cabeçalho), copie (Ctrl+C) e cole aqui (Ctrl+V)."
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
            {ehImoveis ? (
              <p>
                Cada linha é um imóvel. Precisa ter <strong className="text-ink">proprietário</strong> (nome e WhatsApp), <strong className="text-ink">endereço</strong>{" "}
                (rua, número e bairro), <strong className="text-ink">valor</strong> e <strong className="text-ink">área</strong>. Tipo, finalidade, unidade, prédio e
                cômodos são opcionais. O proprietário é cadastrado junto (ou reaproveitado, se o WhatsApp já existe) e cada imóvel ganha o seu código FK.
              </p>
            ) : (
              <p>
                Precisa ter <strong className="text-ink">nome</strong> e <strong className="text-ink">WhatsApp</strong>. Quem já está cadastrado (mesmo WhatsApp) fica de
                fora.
              </p>
            )}
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
              {campos.map((f) => (
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

          {(ehImoveis || isAdmin) && (
            <div className="grid gap-3 sm:grid-cols-3">
              {ehImoveis && mapa.finalidade === undefined && (
                <Field label="Todos são para">
                  <SelectField
                    value={finPadrao}
                    onChange={(v) => setFinPadrao(v as Finalidade)}
                    options={[
                      { value: "venda", label: "Venda" },
                      { value: "locacao", label: "Locação" },
                    ]}
                  />
                </Field>
              )}
              {ehImoveis && (
                <Field label={mapa.categoria === undefined ? "Tipo de todos" : "Tipo quando não reconhecido"}>
                  <SelectField value={catPadrao} onChange={(v) => setCatPadrao(v as CategoriaImovel)} options={TIPOS_IMOVEL.map((t) => ({ value: t.valor, label: t.rotulo }))} />
                </Field>
              )}
              {isAdmin && <CorretorField value={corretorId} onChange={setCorretorId} />}
            </div>
          )}

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
                  {ehImoveis && <th className="px-3 py-2 font-semibold">Imóvel</th>}
                  {ehImoveis && <th className="px-3 py-2 font-semibold">Valor</th>}
                  <th className="px-3 py-2 font-semibold">{ehImoveis ? "Proprietário" : "Nome"}</th>
                  <th className="px-3 py-2 font-semibold">WhatsApp</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {resultado!.slice(0, 8).map((r, i) => (
                  <tr key={i} className={`border-b border-line last:border-0 ${r.motivo ? "text-subtle" : ""}`}>
                    {ehImoveis && <td className="max-w-[18rem] truncate px-3 py-2 font-medium">{r.titulo}</td>}
                    {ehImoveis && (
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                        {r.valor > 0 ? brl(r.valor) : "—"}
                        {r.finalidade === "locacao" && r.valor > 0 ? "/mês" : ""}
                      </td>
                    )}
                    <td className="max-w-[10rem] truncate px-3 py-2">{r.propNome || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{r.propWhats ? formatPhone(r.propWhats) : "—"}</td>
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
