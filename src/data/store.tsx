/**
 * AÇÕES DA PLATAFORMA (cadastrar, editar, registrar...).
 * Cada ação atualiza a tela na hora. No login real, ela também grava no banco (`gravar`);
 * na demonstração, as mudanças ficam só na memória do navegador.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  admin,
  anuncios,
  chamados,
  CHECKLIST_CAPTACAO,
  CHECKLIST_LEAD,
  CHECKLIST_MARKETING,
  convites,
  corretores,
  captacoes,
  compromissos,
  conexoesGoogle,
  fechamentos,
  imobiliaria,
  imoveis,
  leads,
  marca,
  parceiros,
  progresso,
  proprietarios,
  transacoes,
  trilhas,
} from "./demo";
import { captacaoTitulo, captacaoById, vagasLivres } from "./queries";
import { enviarConvitePorEmail, mensagemErro } from "@/integrations/frankkia/client";
import { comprimirFoto } from "@/lib/files";
import { aoMudar, compromissoParaBanco, configurarGravacao, contexto as ctxDados, ehReal, enfileirar, falhou, gravar, leadParaBanco, novoId, supabase } from "./sync";
import { acessosDemo, clientes, errosSistema, interessados, linkDemo, nomeDaTela, novaReferencia, pedidoAberto, pedidoById, pedidosUpgrade, PLANOS, todosChamados } from "./platform";
import type {
  AcessoDemo,
  Anuncio,
  FotoAnuncio,
  Interessado,
  ArquivoMarca,
  Aula,
  Captacao,
  Chamado,
  Cliente,
  Compromisso,
  ClienteStatus,
  ErroSistema,
  FechamentoInformado,
  Imobiliaria,
  Imovel,
  Lead,
  Parceiro,
  PedidoUpgrade,
  PlanoNome,
  Proprietario,
  Transacao,
  Trilha,
  Usuario,
} from "./types";

type Toast = { id: number; text: string };

/** Visita ligada a um lead: a data do compromisso vira a data de visita do lead. */
function sincronizarVisita(c: Compromisso) {
  if (c.tipo !== "visita" || !c.leadId) return;
  const l = leads.find((x) => x.id === c.leadId);
  if (!l) return;
  l.visitaEm = c.inicio;
  if (l.etapa === "novo" || l.etapa === "contato") l.etapa = "visita";
  salvarLead(l);
}

const uid = novoId;

// ---------- Gravações no banco (só no login real) ----------

function salvarLead(l: Lead) {
  const { id, imobiliaria_id, criado_em, ...campos } = leadParaBanco(l);
  void imobiliaria_id;
  void criado_em;
  return gravar(() => supabase.from("leads").update(campos).eq("id", id));
}
const inserirCompromisso = (c: Compromisso) => gravar(() => supabase.from("compromissos").insert(compromissoParaBanco(c)));
function salvarCompromisso(c: Compromisso) {
  const { id, imobiliaria_id, ...campos } = compromissoParaBanco(c);
  void imobiliaria_id;
  return gravar(() => supabase.from("compromissos").update(campos).eq("id", id));
}
const removerCompromissoBanco = (id: string) => gravar(() => supabase.from("compromissos").delete().eq("id", id));
/** Anúncio da captação (cria um rascunho vazio na memória, se ainda não existir). */
export function anuncioDe(captacaoId: string): Anuncio {
  let a = anuncios.find((x) => x.captacaoId === captacaoId);
  if (!a) {
    a = { captacaoId, titulo: "", descricao: "", caracteristicas: [], publicado: false, fotos: [] };
    anuncios.push(a);
  }
  return a;
}
/** Garante que a linha do anúncio existe no banco (sem mexer no que já está lá). */
const garantirAnuncio = (captacaoId: string) =>
  supabase.from("anuncios").upsert({ captacao_id: captacaoId, imobiliaria_id: ctxDados.imobId }, { onConflict: "captacao_id", ignoreDuplicates: true });
async function salvarOrdem(a: Anuncio) {
  for (const f of a.fotos) await supabase.from("anuncio_fotos").update({ ordem: f.ordem }).eq("id", f.id);
}
/** Mensagens do banco ao publicar, em português simples. */
function mensagemPortal(e: { message?: string } | unknown) {
  const m = String((e as { message?: string })?.message ?? e);
  const mapa: [RegExp, string][] = [
    [/SEM_CRECI/, "O corretor responsável precisa ter CRECI cadastrado (estagiário não publica sozinho). Ajuste em Configurações › Perfil."],
    [/LIMITE_ANUNCIOS/, "O limite de anúncios publicados do seu plano foi atingido. Retire outro anúncio do portal ou mude de plano."],
    [/SEM_FOTOS/, "Adicione pelo menos uma foto."],
    [/TITULO_CURTO/, "Escreva um título com pelo menos 10 letras."],
    [/CAPTACAO_FECHADA/, "Só imóveis disponíveis podem ser anunciados."],
    [/LIMITE_FOTOS/, "O anúncio já tem 20 fotos, o máximo."],
  ];
  return mapa.find(([re]) => re.test(m))?.[1] ?? mensagemErro(e);
}

/**
 * Envia a foto (reduzida a 400 px) para o armazenamento "avatares" e grava o endereço dela.
 * `pasta`: <id do usuário> ou parceiros/<id da imobiliária>. Na demonstração, a foto fica só na memória.
 */
async function trocarAvatar(
  arquivo: File | null,
  dono: { fotoUrl?: string } | null,
  pasta: string,
  salvar: (url: string | null) => Promise<unknown>,
): Promise<string | null> {
  if (!dono) return "Não encontrado.";
  try {
    const antiga = dono.fotoUrl;
    if (!arquivo) {
      dono.fotoUrl = undefined;
      if (ehReal()) {
        const erro = await salvar(null);
        if (erro) return mensagemErro(erro);
        removerAvatarAntigo(antiga);
      }
      return null;
    }
    const f = await comprimirFoto(arquivo, 400);
    if (!ehReal()) {
      dono.fotoUrl = URL.createObjectURL(f.blob);
      return null;
    }
    const caminho = `${pasta}/foto-${Date.now()}.${f.tipo === "image/jpeg" ? "jpg" : "webp"}`;
    const up = await supabase.storage.from("avatares").upload(caminho, f.blob, { contentType: f.tipo });
    if (up.error) return "Não foi possível enviar a foto. Tente de novo.";
    const url = supabase.storage.from("avatares").getPublicUrl(caminho).data.publicUrl;
    const erro = await salvar(url);
    if (erro) return mensagemErro(erro);
    dono.fotoUrl = url;
    removerAvatarAntigo(antiga);
    return null;
  } catch {
    return "Não foi possível ler esta imagem.";
  }
}
function removerAvatarAntigo(url?: string) {
  const marca = "/storage/v1/object/public/avatares/";
  if (url?.includes(marca)) supabase.storage.from("avatares").remove([url.split(marca)[1]]);
}

const salvarChecklists = (c: Captacao) =>
  gravar(() => supabase.from("captacoes").update({ checklist_captacao: c.checklistCaptacao, checklist_marketing: c.checklistMarketing }).eq("id", c.id));

function createActions(bump: () => void, toast: (text: string) => void) {
  return {
    toast,

    addLead(input: Pick<Lead, "corretorId" | "nome" | "telefone" | "origem" | "interesse">) {
      const lead: Lead = {
        ...input,
        id: uid("l"),
        etapa: "novo",
        criadoEm: new Date().toISOString(),
        checklist: CHECKLIST_LEAD.map(() => false),
      };
      leads.unshift(lead);
      gravar(() => supabase.from("leads").insert(leadParaBanco(lead)));
      bump();
      toast("Lead cadastrado.");
      return lead;
    },

    updateLead(id: string, patch: Partial<Lead>) {
      const l = leads.find((x) => x.id === id);
      if (!l) return;
      Object.assign(l, patch);
      salvarLead(l);
      // A data de visita do lead e o compromisso de visita na agenda andam juntos.
      if ("visitaEm" in patch) {
        const i = compromissos.findIndex((c) => c.leadId === id && c.tipo === "visita");
        if (!patch.visitaEm) {
          if (i >= 0) removerCompromissoBanco(compromissos.splice(i, 1)[0].id);
        } else {
          const ini = new Date(patch.visitaEm);
          const fim = new Date(ini.getTime() + 60 * 60_000).toISOString();
          if (i >= 0) {
            Object.assign(compromissos[i], { inicio: ini.toISOString(), fim });
            salvarCompromisso(compromissos[i]);
          } else {
            const c: Compromisso = { id: uid("ag"), donoId: l.corretorId, titulo: `Visita com ${l.nome}`, tipo: "visita", inicio: ini.toISOString(), fim, leadId: l.id, local: "A combinar" };
            compromissos.push(c);
            inserirCompromisso(c);
          }
        }
      }
      bump();
    },

    // ---------- Agenda ----------

    addCompromisso(input: Omit<Compromisso, "id">) {
      const c: Compromisso = { ...input, id: uid("ag") };
      compromissos.push(c);
      inserirCompromisso(c);
      sincronizarVisita(c);
      bump();
      toast("Compromisso criado.");
      return c;
    },

    updateCompromisso(id: string, patch: Partial<Omit<Compromisso, "id">>, aviso = "Compromisso atualizado.") {
      const c = compromissos.find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch);
      salvarCompromisso(c);
      sincronizarVisita(c);
      bump();
      if (aviso) toast(aviso);
    },

    removeCompromisso(id: string) {
      const i = compromissos.findIndex((x) => x.id === id);
      if (i < 0) return;
      const [c] = compromissos.splice(i, 1);
      removerCompromissoBanco(c.id);
      if (c.tipo === "visita" && c.leadId) {
        const l = leads.find((x) => x.id === c.leadId);
        if (l) {
          l.visitaEm = undefined;
          salvarLead(l);
        }
      }
      bump();
      toast("Compromisso excluído.");
    },

    conectarGoogle(userId: string, email: string) {
      conexoesGoogle[userId] = { email, conectadoEm: new Date().toISOString() };
      bump();
      toast("Google Agenda conectado (simulação).");
    },

    desconectarGoogle(userId: string) {
      delete conexoesGoogle[userId];
      bump();
      toast("Google Agenda desconectado.");
    },

    toggleLeadStep(id: string, step: number) {
      const l = leads.find((x) => x.id === id);
      if (!l) return;
      l.checklist = l.checklist.map((v, k) => (k === step ? !v : v));
      salvarLead(l);
      bump();
    },

    addProprietario(input: Omit<Proprietario, "id">) {
      const p: Proprietario = { ...input, id: uid("p") };
      proprietarios.unshift(p);
      gravar(() =>
        supabase.from("proprietarios").insert({ id: p.id, imobiliaria_id: ctxDados.imobId, corretor_id: p.corretorId, nome: p.nome, whatsapp: p.whatsapp }),
      );
      bump();
      toast("Proprietário cadastrado.");
      return p;
    },

    /** Imóvel = lugar físico (edifício, casa, galpão...). */
    addImovel(input: Pick<Imovel, "categoria" | "nome" | "endereco" | "cep" | "lat" | "lng">) {
      const im: Imovel = { ...input, id: uid("im"), criadoEm: new Date().toISOString() };
      imoveis.unshift(im);
      const e = im.endereco;
      gravar(() =>
        supabase.from("imoveis").insert({
          id: im.id,
          imobiliaria_id: ctxDados.imobId,
          categoria: im.categoria,
          nome: im.nome ?? null,
          logradouro: e.logradouro,
          numero: e.numero,
          bairro: e.bairro,
          cidade: e.cidade,
          uf: e.uf,
          cep: im.cep ?? null,
          lat: im.lat ?? null,
          lng: im.lng ?? null,
          criado_por: ctxDados.userId,
        }),
      );
      bump();
      toast("Imóvel cadastrado.");
      return im;
    },

    /** Captação = oferta de um imóvel para venda ou locação. */
    addCaptacao(input: Pick<Captacao, "corretorId" | "proprietarioId" | "imovelId" | "unidade" | "finalidade" | "valor" | "areaM2">) {
      const c: Captacao = {
        ...input,
        id: uid("cp"),
        status: "ativa",
        captadoEm: new Date().toISOString(),
        checklistCaptacao: CHECKLIST_CAPTACAO.map(() => false),
        checklistMarketing: CHECKLIST_MARKETING.map(() => false),
      };
      captacoes.unshift(c);
      gravar(() =>
        supabase.from("captacoes").insert({
          id: c.id,
          imobiliaria_id: ctxDados.imobId,
          corretor_id: c.corretorId,
          proprietario_id: c.proprietarioId,
          imovel_id: c.imovelId,
          unidade: c.unidade ?? null,
          finalidade: c.finalidade,
          valor: c.valor,
          area_m2: c.areaM2,
          status: c.status,
          captado_em: c.captadoEm,
          checklist_captacao: c.checklistCaptacao,
          checklist_marketing: c.checklistMarketing,
        }),
      );
      bump();
      toast("Captação cadastrada.");
      return c;
    },

    toggleCaptacao(id: string, step: number) {
      const c = captacoes.find((x) => x.id === id);
      if (!c) return;
      c.checklistCaptacao = c.checklistCaptacao.map((v, k) => (k === step ? !v : v));
      salvarChecklists(c);
      bump();
    },

    toggleMarketing(id: string, step: number, value?: boolean) {
      const c = captacoes.find((x) => x.id === id);
      if (!c) return;
      c.checklistMarketing = c.checklistMarketing.map((v, k) => (k === step ? (value ?? !v) : v));
      salvarChecklists(c);
      bump();
    },

    // ---------- Portal: anúncio da captação ----------

    /** Salva os dados do anúncio (rascunho ou publicado). */
    salvarAnuncio(captacaoId: string, patch: Partial<Omit<Anuncio, "captacaoId" | "publicado" | "slug" | "fotos">>) {
      const a = anuncioDe(captacaoId);
      Object.assign(a, patch);
      gravar(
        () => garantirAnuncio(captacaoId),
        () =>
          supabase
            .from("anuncios")
            .update({
              titulo: a.titulo,
              descricao: a.descricao,
              quartos: a.quartos ?? null,
              suites: a.suites ?? null,
              banheiros: a.banheiros ?? null,
              vagas: a.vagas ?? null,
              condominio: a.condominio ?? null,
              iptu: a.iptu ?? null,
              caracteristicas: a.caracteristicas,
              atualizado_em: new Date().toISOString(),
            })
            .eq("captacao_id", captacaoId),
      );
      bump();
      toast("Anúncio salvo.");
    },

    /** Publica ou tira do portal. Devolve o motivo, se o banco recusar (sem CRECI, limite do plano...). */
    async publicarAnuncio(captacaoId: string, publicar: boolean): Promise<string | null> {
      const a = anuncioDe(captacaoId);
      if (ehReal()) {
        const r = await enfileirar(async () => {
          const g = await garantirAnuncio(captacaoId);
          if (g.error) return { erro: mensagemPortal(g.error) };
          const { data, error } = await supabase.rpc("publicar_anuncio", { p_captacao: captacaoId, p_publicar: publicar });
          return error ? { erro: mensagemPortal(error) } : { slug: data ?? undefined };
        });
        if (r.erro) return r.erro;
        a.slug = r.slug ?? a.slug;
      } else {
        if (publicar && a.titulo.trim().length < 10) return "Escreva um título com pelo menos 10 letras.";
        if (publicar && !a.fotos.length) return "Adicione pelo menos uma foto.";
        a.slug ??= `exemplo-${captacaoId}`;
      }
      a.publicado = publicar;
      if (publicar) a.publicadoEm ??= new Date().toISOString();
      bump();
      toast(publicar ? "Anúncio publicado no portal! Ele já conta no limite de anúncios do seu plano." : "Anúncio retirado do portal.");
      return null;
    },

    /** Reduz e envia fotos (no login real, direto para o Cloudflare R2). Devolve um aviso, se algo falhar. */
    async adicionarFotos(captacaoId: string, arquivos: File[]): Promise<string | null> {
      const a = anuncioDe(captacaoId);
      const vagas = 20 - a.fotos.length;
      if (vagas <= 0) return "O anúncio já tem 20 fotos, o máximo.";
      let aviso: string | null = arquivos.length > vagas ? `Só cabem mais ${vagas} fotos: as demais foram ignoradas.` : null;
      for (const arquivo of arquivos.slice(0, vagas)) {
        try {
          const f = await comprimirFoto(arquivo);
          const foto: FotoAnuncio = { id: uid("ft"), url: URL.createObjectURL(f.blob), chave: "", ordem: a.fotos.length };
          if (ehReal()) {
            const g = await enfileirar(async () => await garantirAnuncio(captacaoId));
            if (g.error) throw new Error(mensagemPortal(g.error));
            const { data, error } = await supabase.functions.invoke("fotos-r2", { body: { acao: "assinar", captacaoId, tipo: f.tipo } });
            const d = data as { uploadUrl?: string; chave?: string; url?: string } | null;
            if (error || !d?.uploadUrl) throw new Error(error ? "As fotos ainda não estão configuradas (Cloudflare R2)." : "Falha ao preparar o envio.");
            const put = await fetch(d.uploadUrl, { method: "PUT", body: f.blob, headers: { "Content-Type": f.tipo } });
            if (!put.ok) throw new Error("O envio da foto falhou. Tente de novo.");
            Object.assign(foto, { chave: d.chave!, url: d.url! });
            const ins = await supabase.from("anuncio_fotos").insert({
              id: foto.id,
              captacao_id: captacaoId,
              imobiliaria_id: ctxDados.imobId,
              chave: foto.chave,
              url: foto.url,
              ordem: foto.ordem,
              largura: f.largura,
              altura: f.altura,
              tamanho_bytes: f.blob.size,
            });
            if (ins.error) throw new Error(mensagemPortal(ins.error));
          }
          a.fotos.push(foto);
          bump();
        } catch (e) {
          aviso = e instanceof Error ? e.message : "Não foi possível enviar uma das fotos.";
          break;
        }
      }
      return aviso;
    },

    removerFoto(captacaoId: string, fotoId: string) {
      const a = anuncioDe(captacaoId);
      const foto = a.fotos.find((f) => f.id === fotoId);
      if (!foto) return;
      a.fotos = a.fotos.filter((f) => f.id !== fotoId).map((f, k) => ({ ...f, ordem: k }));
      if (ehReal())
        enfileirar(async () => {
          const { error } = await supabase.from("anuncio_fotos").delete().eq("id", fotoId);
          if (error) return falhou(error);
          await supabase.functions.invoke("fotos-r2", { body: { acao: "remover", captacaoId, chave: foto.chave } });
          await salvarOrdem(a);
        });
      bump();
    },

    /** Leva a foto para a primeira posição (capa do anúncio). */
    definirCapa(captacaoId: string, fotoId: string) {
      const a = anuncioDe(captacaoId);
      const foto = a.fotos.find((f) => f.id === fotoId);
      if (!foto) return;
      a.fotos = [foto, ...a.fotos.filter((f) => f.id !== fotoId)].map((f, k) => ({ ...f, ordem: k }));
      if (ehReal()) enfileirar(() => salvarOrdem(a));
      bump();
      toast("Foto de capa atualizada.");
    },

    /** Só o administrador registra vendas e locações (no banco, tudo numa operação só). */
    addTransacao(input: Omit<Transacao, "id">, fechamentoId?: string) {
      const t: Transacao = { ...input, id: uid("tr") };
      transacoes.unshift(t);
      transacoes.sort((a, b) => b.data.localeCompare(a.data));
      const c = captacoes.find((x) => x.id === input.captacaoId);
      if (c) c.status = input.tipo === "venda" ? "vendida" : "alugada";
      if (fechamentoId) {
        const f = fechamentos.find((x) => x.id === fechamentoId);
        if (f) f.status = "registrado";
      }
      if (ehReal())
        enfileirar(async () => {
          const { data, error } = await supabase.rpc("registrar_transacao", {
            p_captacao: input.captacaoId,
            p_valor: input.valor,
            p_honorarios: input.honorariosPct,
            p_data: input.data,
            p_cliente: input.cliente ?? "",
            p_participantes: input.participantes.map((p) => ({ tipo: p.tipo, ref_id: p.refId, pct: p.pct })),
            ...(fechamentoId ? { p_fechamento: fechamentoId } : {}),
          });
          if (error) falhou(error);
          else if (data) {
            t.id = data; // id definitivo, criado pelo banco
            bump();
          }
        });
      bump();
      toast(input.tipo === "venda" ? "Venda registrada. VGV e VGC atualizados." : "Locação registrada. Volume de locação e VGC atualizados.");
      return t;
    },

    addParceiro(input: Omit<Parceiro, "id">) {
      const p: Parceiro = { ...input, id: uid("pa") };
      parceiros.push(p);
      gravar(() =>
        supabase.from("parceiros").insert({
          id: p.id,
          imobiliaria_id: ctxDados.imobId,
          nome: p.nome,
          creci: p.creci ?? null,
          empresa: p.empresa ?? null,
          telefone: p.telefone ?? null,
        }),
      );
      bump();
      toast("Parceiro cadastrado.");
      return p;
    },

    /** O corretor informa o fechamento; o administrador confere e registra. */
    informarFechamento(input: Pick<FechamentoInformado, "corretorId" | "captacaoId" | "tipo" | "valor" | "data" | "observacao">) {
      const f: FechamentoInformado = { ...input, id: uid("fi"), criadoEm: new Date().toISOString(), status: "pendente" };
      fechamentos.unshift(f);
      gravar(() =>
        supabase.from("fechamentos_informados").insert({
          id: f.id,
          imobiliaria_id: ctxDados.imobId,
          corretor_id: f.corretorId,
          captacao_id: f.captacaoId,
          tipo: f.tipo,
          valor: f.valor,
          data: f.data,
          observacao: f.observacao ?? null,
          status: "pendente",
        }),
      );
      bump();
      const c = captacaoById(input.captacaoId);
      toast(`Fechamento de ${c ? captacaoTitulo(c) : "captação"} enviado ao administrador.`);
    },

    descartarFechamento(id: string) {
      const f = fechamentos.find((x) => x.id === id);
      if (!f) return;
      f.status = "descartado";
      gravar(() => supabase.from("fechamentos_informados").update({ status: "descartado" }).eq("id", id));
      bump();
      toast("Fechamento informado descartado.");
    },

    // ---------- Academy ----------

    addTrilha(input: Pick<Trilha, "titulo" | "subtitulo">) {
      const hues = [226, 158, 268, 32, 196, 340];
      const t: Trilha = { ...input, id: uid("t"), criadoEm: new Date().toISOString(), capaHue: hues[trilhas.length % hues.length], aulas: [] };
      trilhas.push(t);
      gravar(() =>
        supabase.from("trilhas").insert({ id: t.id, imobiliaria_id: ctxDados.imobId, titulo: t.titulo, subtitulo: t.subtitulo, capa_hue: t.capaHue, criado_em: t.criadoEm }),
      );
      bump();
      toast("Trilha criada. Agora adicione as aulas.");
      return t;
    },

    updateTrilha(id: string, patch: Partial<Pick<Trilha, "titulo" | "subtitulo">>) {
      const t = trilhas.find((x) => x.id === id);
      if (!t) return;
      Object.assign(t, patch);
      gravar(() => supabase.from("trilhas").update({ titulo: t.titulo, subtitulo: t.subtitulo }).eq("id", id));
      bump();
      toast("Trilha atualizada.");
    },

    removeTrilha(id: string) {
      const i = trilhas.findIndex((x) => x.id === id);
      if (i < 0) return;
      trilhas.splice(i, 1);
      gravar(() => supabase.from("trilhas").delete().eq("id", id));
      bump();
      toast("Trilha excluída.");
    },

    /** Vídeo: só o link (YouTube/Vimeo). Documento: o arquivo vai para o armazenamento da imobiliária. */
    addAula(trilhaId: string, aula: Omit<Aula, "id">, arquivo?: File) {
      const t = trilhas.find((x) => x.id === trilhaId);
      if (!t) return;
      const a: Aula = { ...aula, id: uid("a") };
      const ordem = t.aulas.length;
      t.aulas.push(a);
      if (ehReal())
        enfileirar(async () => {
          let path: string | null = null;
          if (arquivo) {
            path = `${ctxDados.imobId}/${a.id}-${arquivo.name.normalize("NFD").replace(/[^\w.-]+/g, "_")}`;
            const up = await supabase.storage.from("academy").upload(path, arquivo, { contentType: arquivo.type || undefined });
            if (up.error) return falhou(up.error);
            a.arquivoPath = path;
          }
          const { error } = await supabase.from("aulas").insert({
            id: a.id,
            imobiliaria_id: ctxDados.imobId,
            trilha_id: trilhaId,
            titulo: a.titulo,
            tipo: a.tipo,
            formato: a.formato,
            arquivo_nome: a.arquivoNome,
            tamanho_bytes: a.tamanhoBytes,
            duracao_min: a.duracaoMin ?? null,
            video_url: a.videoUrl ?? null,
            arquivo_path: path,
            ordem,
          });
          if (error) falhou(error);
        });
      bump();
      toast("Aula adicionada à trilha.");
      return a;
    },

    removeAula(trilhaId: string, aulaId: string) {
      const t = trilhas.find((x) => x.id === trilhaId);
      if (!t) return;
      const a = t.aulas.find((x) => x.id === aulaId);
      t.aulas = t.aulas.filter((x) => x.id !== aulaId);
      gravar(
        () => supabase.from("aulas").delete().eq("id", aulaId),
        ...(a?.arquivoPath ? [() => supabase.storage.from("academy").remove([a.arquivoPath!])] : []),
      );
      bump();
      toast("Aula removida.");
    },

    toggleAula(userId: string, aulaId: string) {
      const feitas = progresso[userId] ?? [];
      const done = feitas.includes(aulaId);
      progresso[userId] = done ? feitas.filter((x) => x !== aulaId) : [...feitas, aulaId];
      gravar(() =>
        done
          ? supabase.from("progresso_aulas").delete().eq("usuario_id", userId).eq("aula_id", aulaId)
          : supabase.from("progresso_aulas").insert({ usuario_id: userId, aula_id: aulaId, imobiliaria_id: ctxDados.imobId }),
      );
      bump();
      if (!done) toast("Aula concluída.");
    },

    // ---------- Marketing ----------

    /** Logo da imobiliária (PNG). No login real, fica guardada no banco para toda a equipe baixar. */
    setLogo(logo: ArquivoMarca | null, arquivo?: File) {
      const antiga = marca.logo?.path;
      marca.logo = logo;
      if (ehReal())
        enfileirar(async () => {
          const imob = ctxDados.imobId;
          if (logo && arquivo) {
            const path = `${imob}/logo-${Date.now()}.png`;
            const up = await supabase.storage.from("marca").upload(path, arquivo, { contentType: "image/png" });
            if (up.error) return falhou(up.error);
            const { error } = await supabase.from("marca_logo").upsert({
              imobiliaria_id: imob,
              nome: logo.nome,
              arquivo_path: path,
              tamanho_bytes: logo.tamanhoBytes,
              largura: logo.largura,
              altura: logo.altura,
              transparente: logo.transparente,
              enviado_em: logo.enviadoEm,
            });
            if (error) return falhou(error);
            logo.path = path;
            logo.url = supabase.storage.from("marca").getPublicUrl(path).data.publicUrl;
            bump();
          } else if (!logo) {
            const { error } = await supabase.from("marca_logo").delete().eq("imobiliaria_id", imob);
            if (error) return falhou(error);
          }
          if (antiga) await supabase.storage.from("marca").remove([antiga]);
        });
      bump();
      toast(logo ? "Logo atualizada para toda a equipe." : "Logo removida.");
    },

    // ---------- Equipe ----------

    /** Retorna uma mensagem de erro, ou null se o convite foi enviado. */
    invite(email: string): string | null {
      const e = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return "Digite um e-mail válido.";
      if ([admin, ...corretores].some((u) => u.email.toLowerCase() === e && u.ativo !== false)) return "Este e-mail já faz parte da equipe.";
      if (convites.some((c) => c.email === e)) return "Já existe um convite pendente para este e-mail.";
      if (vagasLivres() <= 0) return "O limite do plano foi atingido.";
      convites.unshift({ id: uid("cv"), email: e, enviadoEm: new Date().toISOString() });
      bump();
      toast(`Convite enviado para ${e}.`);
      return null;
    },

    cancelInvite(id: string) {
      const i = convites.findIndex((c) => c.id === id);
      if (i < 0) return;
      convites.splice(i, 1);
      bump();
      toast("Convite cancelado. A vaga foi liberada.");
    },

    resendInvite(id: string) {
      const c = convites.find((x) => x.id === id);
      if (!c) return;
      c.enviadoEm = new Date().toISOString();
      bump();
      toast(`Convite reenviado para ${c.email}.`);
    },

    setCorretorAtivo(id: string, ativo: boolean) {
      const c = corretores.find((x) => x.id === id);
      if (!c) return;
      if (ativo && vagasLivres() <= 0) {
        toast("Não há vagas livres no plano.");
        return;
      }
      c.ativo = ativo;
      bump();
      toast(ativo ? `${c.nome} foi reativado.` : `Acesso de ${c.nome} desativado. A vaga foi liberada.`);
    },

    // ---------- Configurações ----------

    updateImobiliaria(patch: Partial<Pick<Imobiliaria, "nome" | "cnpj" | "email" | "telefone" | "cidade">>) {
      Object.assign(imobiliaria, patch);
      gravar(() =>
        supabase
          .from("imobiliarias")
          .update({ nome: imobiliaria.nome, cnpj: imobiliaria.cnpj || null, email: imobiliaria.email || null, telefone: imobiliaria.telefone || null, cidade: imobiliaria.cidade || null })
          .eq("id", imobiliaria.id),
      );
      bump();
      toast("Dados da imobiliária salvos.");
    },

    /** Primeiro acesso: o convidado completa o cadastro (CRECI, aniversário...) e vira corretor ativo. */
    aceitarConvite(conviteId: string, dados: Pick<Usuario, "nome" | "telefone" | "aniversario" | "creci" | "creciUF" | "estagiario">) {
      const i = convites.findIndex((c) => c.id === conviteId);
      if (i < 0) return null;
      const [cv] = convites.splice(i, 1);
      const u: Usuario = {
        ...dados,
        id: uid("c"),
        imobiliariaId: imobiliaria.id,
        email: cv.email,
        papel: "corretor",
        iniciais: dados.nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
        metaMensalVGV: 1_000_000,
        ativo: true,
      };
      corretores.push(u);
      bump();
      toast(`Bem-vindo(a), ${u.nome.split(" ")[0]}! Cadastro concluído.`);
      return u;
    },

    // ---------- Upgrade de plano (pagamento + liberação) ----------

    /** Cria (ou atualiza) o pedido de upgrade da imobiliária e devolve o id para ir ao pagamento. */
    criarPedidoUpgrade(plano: PlanoNome) {
      let p = pedidoAberto(imobiliaria.id);
      if (p && p.pagamento === "aguardando") {
        Object.assign(p, { planoNovo: plano, valorMensal: PLANOS[plano].preco });
        const id = p.id;
        gravar(() => supabase.from("pedidos_upgrade").update({ plano_novo: plano, valor_mensal: PLANOS[plano].preco }).eq("id", id));
      } else if (!p) {
        p = {
          id: uid("up"),
          imobiliariaId: imobiliaria.id,
          planoAtual: imobiliaria.plano,
          planoNovo: plano,
          valorMensal: PLANOS[plano].preco,
          criadoEm: new Date().toISOString(),
          pagamento: "aguardando",
          liberado: false,
          referencia: ehReal() ? `FK-${Date.now().toString(36).toUpperCase()}` : novaReferencia(),
        };
        pedidosUpgrade.unshift(p);
        const n = p;
        gravar(() =>
          supabase.from("pedidos_upgrade").insert({
            id: n.id,
            imobiliaria_id: n.imobiliariaId,
            plano_atual: n.planoAtual,
            plano_novo: n.planoNovo,
            valor_mensal: n.valorMensal,
            pagamento: "aguardando",
            liberado: false,
            referencia: n.referencia,
            criado_por: ctxDados.userId,
          }),
        );
      }
      bump();
      return p.id;
    },

    /** Frankkia: confirma à mão um pagamento recebido (PIX, transferência...) enquanto a Stripe não está ligada. */
    confirmarPagamentoManual(id: string) {
      const p = pedidoById(id);
      if (!p || p.liberado) return;
      p.pagamento = "confirmado";
      p.pagoEm = new Date().toISOString();
      gravar(() => supabase.from("pedidos_upgrade").update({ pagamento: "confirmado", pago_em: p.pagoEm }).eq("id", id));
      bump();
      toast("Pagamento marcado como confirmado. Agora é só liberar o plano.");
    },

    /** Resultado do pagamento (na versão real, vem do webhook da Stripe). */
    registrarPagamento(id: string, resultado: "confirmado" | "pendente" | "cancelado", metodo?: PedidoUpgrade["metodo"]) {
      const p = pedidoById(id);
      if (!p) return;
      p.pagamento = resultado;
      p.metodo = metodo ?? p.metodo;
      if (resultado === "confirmado") p.pagoEm = new Date().toISOString();
      bump();
    },

    /** A Frankkia libera o novo plano: as vagas extras ficam disponíveis na hora. */
    liberarUpgrade(id: string) {
      const p = pedidoById(id);
      if (!p || p.pagamento !== "confirmado") return;
      p.liberado = true;
      p.liberadoEm = new Date().toISOString();
      const c = clientes.find((x) => x.id === p.imobiliariaId);
      if (c) {
        c.plano = p.planoNovo;
        if (c.status === "teste" || c.status === "pagamento") c.status = "ativa";
      }
      gravar(() => supabase.rpc("liberar_upgrade", { p_pedido: id }));
      if (p.imobiliariaId === imobiliaria.id) {
        imobiliaria.plano = p.planoNovo;
        imobiliaria.limiteCorretores = PLANOS[p.planoNovo].limite;
      }
      bump();
      toast(`Plano ${p.planoNovo} liberado para ${c?.nome ?? "a imobiliária"}.`);
    },

    cancelarPedidoUpgrade(id: string) {
      const p = pedidoById(id);
      if (!p) return;
      p.pagamento = "cancelado";
      gravar(() => supabase.from("pedidos_upgrade").update({ pagamento: "cancelado" }).eq("id", id));
      bump();
      toast("Pedido de upgrade cancelado.");
    },

    updateUsuario(id: string, patch: Partial<Pick<Usuario, "nome" | "email" | "telefone" | "aniversario" | "creci" | "creciUF" | "estagiario">>) {
      const u = id === admin.id ? admin : corretores.find((x) => x.id === id);
      if (!u) return;
      const emailNovo = patch.email && patch.email.toLowerCase() !== u.email.toLowerCase() ? patch.email.trim().toLowerCase() : null;
      // No login real, o e-mail só muda depois da confirmação enviada para o endereço novo.
      Object.assign(u, ehReal() ? { ...patch, email: u.email } : patch);
      if (patch.nome) u.iniciais = patch.nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
      gravar(() =>
        supabase
          .from("perfis")
          .update({
            nome: u.nome,
            iniciais: u.iniciais,
            telefone: u.telefone ?? null,
            aniversario: u.aniversario ?? null,
            creci: u.creci ?? null,
            creci_uf: u.creciUF ?? null,
            estagiario: !!u.estagiario,
          })
          .eq("id", id),
      );
      if (ehReal() && emailNovo)
        supabase.auth.updateUser({ email: emailNovo }).then(({ error }) => {
          if (error) falhou(error);
          else toast(`Enviamos um link de confirmação para ${emailNovo}. O e-mail muda depois que você clicar nele.`);
        });
      bump();
      toast("Perfil atualizado.");
    },

    // ---------- Fotos de perfil ----------

    /** Troca (ou remove, com null) a foto de perfil de quem está usando o sistema. Devolve um aviso, se falhar. */
    async setFotoPerfil(userId: string, arquivo: File | null): Promise<string | null> {
      const u = userId === admin.id ? admin : (corretores.find((x) => x.id === userId) ?? null);
      const r = await trocarAvatar(arquivo, u, `${userId}`, async (url) => {
        const { error } = await supabase.from("perfis").update({ foto_url: url }).eq("id", userId);
        return error;
      });
      bump();
      return r;
    },

    /** Foto do corretor parceiro (externo). Só o administrador. */
    async setFotoParceiro(parceiroId: string, arquivo: File | null): Promise<string | null> {
      const p = parceiros.find((x) => x.id === parceiroId) ?? null;
      const r = await trocarAvatar(arquivo, p, `parceiros/${ctxDados.imobId}`, async (url) => {
        const { error } = await supabase.from("parceiros").update({ foto_url: url }).eq("id", parceiroId);
        return error;
      });
      bump();
      return r;
    },

    // ---------- Mapa ----------

    /** Guarda a posição do imóvel no mapa (depois de localizar o endereço ou arrastar o marcador). */
    setLocalImovel(imovelId: string, lat: number, lng: number) {
      const im = imoveis.find((x) => x.id === imovelId);
      if (!im) return;
      Object.assign(im, { lat, lng });
      gravar(() => supabase.from("imoveis").update({ lat, lng }).eq("id", imovelId));
      bump();
    },

    // ---------- Ajuda ----------

    addChamado(input: Pick<Chamado, "autorId" | "assunto" | "categoria" | "mensagem">) {
      const c: Chamado = { ...input, id: uid("ch"), imobiliariaId: imobiliaria.id, criadoEm: new Date().toISOString(), status: "aberto" };
      chamados.unshift(c);
      gravar(() =>
        supabase.from("chamados").insert({
          id: c.id,
          imobiliaria_id: c.imobiliariaId,
          autor_id: c.autorId,
          assunto: c.assunto,
          categoria: c.categoria,
          mensagem: c.mensagem,
          status: "aberto",
        }),
      );
      bump();
      toast("Chamado enviado para a equipe Frankkia.");
    },

    // ---------- Painel Frankkia ----------

    /** No login real, a imobiliária já foi criada no banco (criar_imobiliaria): aqui só entra na lista. */
    addCliente(input: Pick<Cliente, "nome" | "cidade" | "cnpj" | "plano" | "adminNome" | "adminEmail"> & { id?: string; testeDias?: number }) {
      const c: Cliente = {
        ...input,
        id: input.id ?? uid("cli"),
        status: "aguardando",
        clienteDesde: new Date().toISOString(),
        corretores: 0,
        uso: { negocios: 0, performance: 0, academy: 0, marketing: 0 },
      };
      clientes.push(c);
      bump();
      toast(ehReal() ? "Imobiliária criada. Envie o link de primeiro acesso ao administrador." : `Acesso de administrador enviado para ${input.adminEmail}.`);
      return c;
    },

    /** Frankkia: mais dias de teste grátis (a partir de hoje ou do fim atual, o que for depois). */
    estenderTeste(id: string, dias: number) {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      if (c.status === "aguardando") {
        // Ainda não começou: aumenta a duração que vale a partir do 1º acesso
        const total = (c.testeDias ?? 0) + dias;
        c.testeDias = total;
        gravar(() => supabase.from("imobiliarias").update({ teste_dias: total }).eq("id", id));
      } else {
        const base = Math.max(Date.now(), c.testeAte ? new Date(c.testeAte).getTime() : 0);
        const fim = new Date(base + dias * 864e5).toISOString();
        c.testeAte = fim;
        c.status = "teste";
        gravar(() => supabase.from("imobiliarias").update({ teste_ate: fim, status: "teste" }).eq("id", id));
      }
      bump();
      toast(`Teste grátis da ${c.nome} estendido em ${dias} dias.`);
    },

    setClientePlano(id: string, plano: PlanoNome) {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      c.plano = plano;
      gravar(() => supabase.from("imobiliarias").update({ plano, limite_corretores: PLANOS[plano].limite }).eq("id", id));
      // A Imobiliária Exemplo é a mesma da área logada: o novo limite vale lá também.
      if (id === imobiliaria.id) {
        imobiliaria.plano = plano;
        imobiliaria.limiteCorretores = PLANOS[plano].limite;
      }
      bump();
      toast(`${c.nome} agora está no plano ${plano}.`);
    },

    setClienteStatus(id: string, status: ClienteStatus) {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      c.status = status;
      if (status === "ativa") c.testeAte = undefined;
      gravar(() => supabase.from("imobiliarias").update(status === "ativa" ? { status, teste_ate: null } : { status }).eq("id", id));
      bump();
      toast(status === "suspensa" ? `Acesso de ${c.nome} suspenso.` : `${c.nome} reativada.`);
    },

    /** Frankkia: apaga a imobiliária e tudo dela (sem volta). Devolve o erro, ou null. */
    async excluirImobiliaria(id: string, confirmacao: string): Promise<string | null> {
      const c = clientes.find((x) => x.id === id);
      if (!c) return null;
      if (ehReal()) {
        const { error } = await supabase.rpc("excluir_imobiliaria", { p_imob: id, p_confirmacao: confirmacao });
        if (error) return /CONFIRMACAO_INVALIDA/.test(error.message) ? "O nome digitado não confere." : "Não foi possível excluir. Tente de novo.";
      }
      clientes.splice(clientes.indexOf(c), 1);
      for (let k = pedidosUpgrade.length - 1; k >= 0; k--) if (pedidosUpgrade[k].imobiliariaId === id) pedidosUpgrade.splice(k, 1);
      bump();
      toast(`${c.nome} foi excluída.`);
      return null;
    },

    resendAcesso(id: string) {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      if (!ehReal()) {
        toast(`Acesso reenviado para ${c.adminEmail}.`);
        return;
      }
      // Login real: copia o link de primeiro acesso do administrador (o envio por e-mail vem depois)
      supabase
        .from("convites")
        .select("token")
        .eq("imobiliaria_id", id)
        .eq("papel", "admin")
        .eq("status", "pendente")
        .order("enviado_em", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(async ({ data }) => {
          if (!data) return toast("O administrador já fez o primeiro acesso. Se esqueceu a senha, ele pode usar “Esqueceu a senha?” no login.");
          if (await enviarConvitePorEmail(data.token)) return toast(`Link de primeiro acesso reenviado para ${c.adminEmail}.`);
          const link = `${window.location.origin}/convite/${data.token}`;
          try {
            await navigator.clipboard.writeText(link);
            toast(`Link de primeiro acesso copiado. Envie para ${c.adminEmail}.`);
          } catch {
            toast(`Link de primeiro acesso: ${link}`);
          }
        });
    },

    updateChamado(id: string, patch: Partial<Pick<Chamado, "status" | "resposta">>) {
      const c = todosChamados().find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch);
      gravar(() =>
        supabase
          .from("chamados")
          .update({ status: c.status, resposta: c.resposta ?? null, ...(patch.resposta ? { respondido_em: new Date().toISOString() } : {}) })
          .eq("id", id),
      );
      bump();
      toast(patch.status === "resolvido" ? "Chamado respondido e resolvido." : "Chamado atualizado.");
    },

    setErroStatus(id: string, status: ErroSistema["status"]) {
      const e = errosSistema.find((x) => x.id === id);
      if (!e) return;
      e.status = status;
      gravar(() => supabase.from("erros_sistema").update({ status }).eq("id", id));
      bump();
      if (status === "corrigido") toast("Erro marcado como corrigido para todas as imobiliárias.");
    },

    // ---------- Interessados e demonstração (painel Frankkia) ----------

    setInteressado(id: string, patch: Partial<Pick<Interessado, "status" | "observacao">>, aviso?: string) {
      const i = interessados.find((x) => x.id === id);
      if (!i) return;
      Object.assign(i, patch);
      gravar(() =>
        supabase
          .from("interessados")
          .update({ status: i.status, observacao: i.observacao?.trim() || null, atualizado_em: new Date().toISOString() })
          .eq("id", id),
      );
      bump();
      if (aviso) toast(aviso);
    },

    /** Cria um link de demonstração com prazo (dias). Devolve o link para enviar ao interessado. */
    liberarDemo(nome: string, dias: number, interessadoId?: string) {
      const bytes = crypto.getRandomValues(new Uint8Array(18));
      const token = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
      const a: AcessoDemo = {
        id: uid("ad"),
        interessadoId,
        nome: nome.trim(),
        token,
        expiraEm: new Date(Date.now() + dias * 864e5).toISOString(),
        revogado: false,
        usos: 0,
        criadoEm: new Date().toISOString(),
      };
      acessosDemo.unshift(a);
      gravar(() =>
        supabase.from("acessos_demo").insert({
          id: a.id,
          interessado_id: interessadoId ?? null,
          nome: a.nome,
          token,
          expira_em: a.expiraEm,
          criado_por: ctxDados.userId || null,
        }),
      );
      const i = interessadoId ? interessados.find((x) => x.id === interessadoId) : undefined;
      if (i && (i.status === "novo" || i.status === "em_contato")) {
        i.status = "demo_liberada";
        gravar(() => supabase.from("interessados").update({ status: "demo_liberada", atualizado_em: new Date().toISOString() }).eq("id", i.id));
      }
      bump();
      toast(`Demonstração liberada por ${dias} dias.`);
      return linkDemo(token);
    },

    revogarDemo(id: string) {
      const a = acessosDemo.find((x) => x.id === id);
      if (!a) return;
      a.revogado = true;
      gravar(() => supabase.from("acessos_demo").update({ revogado: true }).eq("id", id));
      bump();
      toast("Link de demonstração desativado.");
    },

    /** Registra um erro real que aconteceu no navegador (agrupa mensagens repetidas). */
    captureErro(mensagem: string, path: string) {
      const local = nomeDaTela(path);
      if (ehReal()) supabase.rpc("registrar_erro", { p_mensagem: mensagem, p_local: local }).then(() => undefined);
      const now = new Date().toISOString();
      const e = errosSistema.find((x) => x.mensagem === mensagem && x.local === local);
      if (e) {
        e.ocorrencias += 1;
        e.ultimaVez = now;
        if (e.status === "corrigido") e.status = "novo";
      } else {
        errosSistema.unshift({ id: uid("er"), mensagem, local, ocorrencias: 1, imobiliarias: 1, primeiraVez: now, ultimaVez: now, status: "novo", origem: "capturado" });
      }
      bump();
    },
  };
}

type Store = ReturnType<typeof createActions> & { version: number; toasts: Toast[] };
const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const toast = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text }]);
    // Avisos ficam 5 segundos na tela (tempo de ler com calma)
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const actions = useMemo(() => createActions(bump, toast), [bump, toast]);

  // Dados recarregados do banco (ou de volta à demonstração): redesenha as telas.
  useEffect(() => aoMudar(bump), [bump]);
  useEffect(() => configurarGravacao({ aviso: toast, recarregar: () => window.dispatchEvent(new Event("frankkia:recarregar")) }), [toast]);

  // Captura erros reais do navegador e envia para "Erros do sistema" no painel Frankkia.
  useEffect(() => {
    const onError = (e: ErrorEvent) => actions.captureErro(e.message || "Erro desconhecido", window.location.pathname);
    const onRejection = (e: PromiseRejectionEvent) =>
      actions.captureErro(e.reason instanceof Error ? e.reason.message : String(e.reason), window.location.pathname);
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [actions]);

  return <StoreContext.Provider value={{ ...actions, version, toasts }}>{children}</StoreContext.Provider>;
}

/** Use em qualquer tela que mostre dados: ela se atualiza sozinha quando algo muda. */
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
