/**
 * DOCUMENTOS POR CLIENTE (lead e proprietário): RG, comprovantes, contratos, matrícula...
 * Login real: tabela `documentos` + armazenamento privado "documentos", na pasta <imobiliária>/<corretor>/<tipo>/<cliente>/.
 * Quem vê é quem vê o cliente (o próprio corretor e o administrador). Demonstração: tudo fica na memória.
 */
import { supabase } from "@/integrations/frankkia/client";
import { contexto, ehReal, novoId } from "./sync";

export type TipoCliente = "lead" | "proprietario";
export type Documento = { id: string; nome: string; caminho: string; tamanho: number; mime?: string; criadoEm: string; url?: string };

export const TAMANHO_MAX = 15 * 1024 * 1024;
export const ACEITOS = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx,.xls,.xlsx";
const TIPOS = /\.(pdf|jpe?g|png|webp|heic|heif|docx?|xlsx?)$/i;

const memoria = new Map<string, Documento[]>();
const chave = (tipo: TipoCliente, ref: string) => `${tipo}:${ref}`;

/** Nome seguro para o caminho do arquivo (sem acento, espaço ou barra). */
const limpo = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w.-]+/g, "_").slice(-100);

export function problemaNoArquivo(f: File) {
  if (!TIPOS.test(f.name)) return `"${f.name}": envie PDF, foto (JPG, PNG, HEIC), Word ou Excel.`;
  if (f.size > TAMANHO_MAX) return `"${f.name}" passa de 15 MB.`;
  return null;
}

export async function listarDocumentos(tipo: TipoCliente, ref: string): Promise<Documento[]> {
  if (!ehReal()) return memoria.get(chave(tipo, ref)) ?? [];
  const { data, error } = await supabase
    .from("documentos")
    .select("id, nome, caminho, tamanho, mime, criado_em")
    .eq("tipo", tipo)
    .eq("ref_id", ref)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((d) => ({ id: d.id, nome: d.nome, caminho: d.caminho, tamanho: d.tamanho, mime: d.mime ?? undefined, criadoEm: d.criado_em }));
}

export async function enviarDocumento(tipo: TipoCliente, ref: string, corretorId: string, f: File): Promise<Documento> {
  const id = novoId("doc");
  const caminho = `${contexto.imobId}/${corretorId}/${tipo}/${ref}/${id}-${limpo(f.name)}`;
  const doc: Documento = { id, nome: f.name.slice(0, 200), caminho, tamanho: f.size, mime: f.type || undefined, criadoEm: new Date().toISOString() };
  if (!ehReal()) {
    doc.url = URL.createObjectURL(f);
    memoria.set(chave(tipo, ref), [doc, ...(memoria.get(chave(tipo, ref)) ?? [])]);
    return doc;
  }
  const up = await supabase.storage.from("documentos").upload(caminho, f, { contentType: f.type || undefined });
  if (up.error) throw up.error;
  const { error } = await supabase.from("documentos").insert({
    id,
    imobiliaria_id: contexto.imobId,
    corretor_id: corretorId,
    tipo,
    ref_id: ref,
    nome: doc.nome,
    caminho,
    tamanho: f.size,
    mime: doc.mime ?? null,
  });
  if (error) {
    // Não deixa arquivo solto se o registro não entrou
    await supabase.storage.from("documentos").remove([caminho]);
    throw error;
  }
  return doc;
}

/** Link temporário (2 minutos) para abrir ou baixar. */
export async function linkDocumento(d: Documento, baixar = false): Promise<string> {
  if (d.url) return d.url;
  const { data, error } = await supabase.storage.from("documentos").createSignedUrl(d.caminho, 120, baixar ? { download: d.nome } : undefined);
  if (error || !data) throw error ?? new Error("SEM_LINK");
  return data.signedUrl;
}

export async function excluirDocumento(tipo: TipoCliente, ref: string, d: Documento) {
  if (!ehReal()) {
    memoria.set(chave(tipo, ref), (memoria.get(chave(tipo, ref)) ?? []).filter((x) => x.id !== d.id));
    return;
  }
  const { error } = await supabase.from("documentos").delete().eq("id", d.id);
  if (error) throw error;
  await supabase.storage.from("documentos").remove([d.caminho]);
}
