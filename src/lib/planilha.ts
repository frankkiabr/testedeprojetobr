/**
 * Leitura de planilhas no navegador, sem biblioteca externa: Excel (.xlsx), CSV/TXT e texto colado do Excel ou Google Planilhas.
 * O .xlsx é um arquivo zip com XML dentro; o navegador descompacta com DecompressionStream.
 * Devolve as linhas como listas de textos (a primeira costuma ser o cabeçalho).
 */

export type Linhas = string[][];

export async function lerPlanilha(arquivo: File): Promise<Linhas> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".xlsx")) return lerXlsx(await arquivo.arrayBuffer());
  if (nome.endsWith(".xls") || nome.endsWith(".numbers") || nome.endsWith(".ods"))
    throw new Error("FORMATO: abra a planilha e salve como .xlsx ou .csv.");
  return lerTexto(decodificar(await arquivo.arrayBuffer()));
}

/** CSV do Excel brasileiro costuma vir em Windows-1252 (acentos quebrados em UTF-8). */
function decodificar(buf: ArrayBuffer) {
  const utf8 = new TextDecoder("utf-8").decode(buf);
  return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buf) : utf8.replace(/^﻿/, "");
}

/** Texto separado por tabulação (colado do Excel), ponto e vírgula (CSV brasileiro) ou vírgula. */
export function lerTexto(texto: string): Linhas {
  const primeira = texto.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const conta = (c: string) => primeira.split(c).length - 1;
  const sep = conta("\t") ? "\t" : conta(";") >= conta(",") && conta(";") ? ";" : ",";
  const linhas: Linhas = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (aspas) {
      if (ch === '"' && texto[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"' && campo === "") aspas = true;
    else if (ch === sep) {
      linha.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && texto[i + 1] === "\n") i++;
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += ch;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return limpar(linhas);
}

const limpar = (l: Linhas) => l.map((r) => r.map((c) => (c ?? "").trim())).filter((r) => r.some(Boolean));

// ---------- .xlsx ----------

async function inflar(dados: Uint8Array, metodo: number): Promise<Uint8Array> {
  if (metodo === 0) return dados;
  if (metodo !== 8) throw new Error("FORMATO: compressão não suportada.");
  const fluxo = new Blob([dados as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/** Lê os arquivos de dentro do zip (só os que interessam). */
async function abrirZip(buf: ArrayBuffer, quero: (nome: string) => boolean) {
  const v = new DataView(buf);
  const bytes = new Uint8Array(buf);
  let fim = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 66000); i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  if (fim < 0) throw new Error("FORMATO: o arquivo não parece um .xlsx válido.");
  const total = v.getUint16(fim + 10, true);
  let p = v.getUint32(fim + 16, true);
  const dec = new TextDecoder();
  const saida = new Map<string, string>();
  for (let k = 0; k < total; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const metodo = v.getUint16(p + 10, true);
    const tam = v.getUint32(p + 20, true);
    const nLen = v.getUint16(p + 28, true);
    const eLen = v.getUint16(p + 30, true);
    const cLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nome = dec.decode(bytes.subarray(p + 46, p + 46 + nLen));
    if (quero(nome)) {
      const ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      saida.set(nome, dec.decode(await inflar(bytes.subarray(ini, ini + tam), metodo)));
    }
    p += 46 + nLen + eLen + cLen;
  }
  return saida;
}

const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");
const textoDe = (el: Element) => Array.from(el.getElementsByTagName("t"), (t) => t.textContent ?? "").join("");
const coluna = (ref: string) => {
  const letras = ref.replace(/\d+/g, "");
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

async function lerXlsx(buf: ArrayBuffer): Promise<Linhas> {
  const arqs = await abrirZip(buf, (n) => n === "xl/sharedStrings.xml" || n === "xl/workbook.xml" || n === "xl/_rels/workbook.xml.rels" || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  // Primeira aba, na ordem em que aparece no Excel
  let aba = "";
  const wb = arqs.get("xl/workbook.xml");
  const rels = arqs.get("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const sheet = xml(wb).getElementsByTagName("sheet")[0];
    const rid = sheet?.getAttribute("r:id") ?? sheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
    const alvo = Array.from(xml(rels).getElementsByTagName("Relationship")).find((r) => r.getAttribute("Id") === rid)?.getAttribute("Target");
    if (alvo) aba = alvo.startsWith("/") ? alvo.slice(1) : `xl/${alvo.replace(/^\.\//, "")}`;
  }
  if (!arqs.has(aba)) aba = [...arqs.keys()].filter((n) => n.startsWith("xl/worksheets/")).sort()[0] ?? "";
  const folha = arqs.get(aba);
  if (!folha) throw new Error("FORMATO: não encontramos nenhuma aba com dados.");

  const ss = arqs.get("xl/sharedStrings.xml");
  const comuns = ss ? Array.from(xml(ss).getElementsByTagName("si"), textoDe) : [];
  const linhas: Linhas = [];
  for (const row of Array.from(xml(folha).getElementsByTagName("row"))) {
    const linha: string[] = [];
    for (const c of Array.from(row.getElementsByTagName("c"))) {
      const t = c.getAttribute("t");
      const val = c.getElementsByTagName("v")[0]?.textContent ?? "";
      const txt = t === "s" ? (comuns[Number(val)] ?? "") : t === "inlineStr" ? textoDe(c) : val;
      const ref = c.getAttribute("r");
      linha[ref ? coluna(ref) : linha.length] = txt;
    }
    linhas.push(Array.from(linha, (x) => x ?? ""));
  }
  return limpar(linhas);
}
