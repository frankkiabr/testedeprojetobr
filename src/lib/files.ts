/** Utilidades de arquivos: tamanhos, formatos aceitos, PDF de exemplo e verificação de PNG. */
import type { FormatoAula } from "@/data/types";

export function fmtBytes(b: number) {
  if (b >= 1e9) return `${(b / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
  if (b >= 1e6) return `${(b / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`;
  if (b >= 1e3) return `${Math.round(b / 1e3)} KB`;
  return `${b} B`;
}

export const extOf = (name: string) => name.split(".").pop()?.toUpperCase() ?? "";

/** Formatos aceitos na Academy: vídeo (MP4/MOV) ou documento (PDF/DOC/DOCX). */
export function classifyAula(name: string): { tipo: "video" | "documento"; formato: FormatoAula } | null {
  const ext = extOf(name);
  if (ext === "MP4" || ext === "MOV") return { tipo: "video", formato: ext };
  if (ext === "PDF" || ext === "DOC" || ext === "DOCX") return { tipo: "documento", formato: ext };
  return null;
}

export const ACCEPT_AULA = ".mp4,.mov,.pdf,.doc,.docx,video/mp4,video/quicktime,application/pdf";

/**
 * Gera um PDF simples e válido (uma página) para os materiais de exemplo,
 * assim o botão de download funciona mesmo sem arquivo real.
 */
export function samplePdfUrl(title: string) {
  const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const lines: [number, number, string][] = [
    [26, 760, title],
    [13, 720, "Material de exemplo da Frankkia Academy."],
    [13, 700, "Na versão final, aqui estará o arquivo enviado pelo administrador da imobiliária."],
  ];
  const stream = lines.map(([size, y, t]) => `BT /F1 ${size} Tf 72 ${y} Td (${esc(t)}) Tj ET`).join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  body += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  body += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  // Todos os caracteres usados cabem em 1 byte (Latin-1), então posição = byte.
  const bytes = Uint8Array.from(body, (ch) => ch.charCodeAt(0) & 0xff);
  return URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
}

/** Lê um PNG e verifica dimensões e se há pixels transparentes. */
export function inspectPng(url: string): Promise<{ largura: number; altura: number; transparente: boolean | null }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      try {
        const scale = Math.min(1, 400 / Math.max(w, h));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(w * scale));
        c.height = Math.max(1, Math.round(h * scale));
        const g = c.getContext("2d")!;
        g.drawImage(img, 0, 0, c.width, c.height);
        const data = g.getImageData(0, 0, c.width, c.height).data;
        let transparente = false;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 250) {
            transparente = true;
            break;
          }
        }
        resolve({ largura: w, altura: h, transparente });
      } catch {
        resolve({ largura: w, altura: h, transparente: null });
      }
    };
    img.onerror = () => resolve({ largura: 0, altura: 0, transparente: null });
    img.src = url;
  });
}
