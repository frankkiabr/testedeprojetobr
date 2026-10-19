/**
 * ARMAZENAMENTO INTERATIVO DA DEMONSTRAÇÃO.
 * Cadastros e alterações ficam na memória do navegador (somem ao recarregar a página).
 * Na próxima fase, cada ação aqui vira uma gravação no banco do Lovable Cloud.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  admin,
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
import { clientes, errosSistema, nomeDaTela, novaReferencia, pedidoAberto, pedidoById, pedidosUpgrade, PLANOS, todosChamados } from "./platform";
import type {
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
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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
      bump();
      toast("Lead cadastrado.");
      return lead;
    },

    updateLead(id: string, patch: Partial<Lead>) {
      const l = leads.find((x) => x.id === id);
      if (!l) return;
      Object.assign(l, patch);
      // A data de visita do lead e o compromisso de visita na agenda andam juntos.
      if ("visitaEm" in patch) {
        const i = compromissos.findIndex((c) => c.leadId === id && c.tipo === "visita");
        if (!patch.visitaEm) {
          if (i >= 0) compromissos.splice(i, 1);
        } else {
          const ini = new Date(patch.visitaEm);
          const fim = new Date(ini.getTime() + 60 * 60_000).toISOString();
          if (i >= 0) Object.assign(compromissos[i], { inicio: ini.toISOString(), fim });
          else compromissos.push({ id: uid("ag"), donoId: l.corretorId, titulo: `Visita com ${l.nome}`, tipo: "visita", inicio: ini.toISOString(), fim, leadId: l.id, local: "A combinar" });
        }
      }
      bump();
    },

    // ---------- Agenda ----------

    addCompromisso(input: Omit<Compromisso, "id">) {
      const c: Compromisso = { ...input, id: uid("ag") };
      compromissos.push(c);
      sincronizarVisita(c);
      bump();
      toast("Compromisso criado.");
      return c;
    },

    updateCompromisso(id: string, patch: Partial<Omit<Compromisso, "id">>, aviso = "Compromisso atualizado.") {
      const c = compromissos.find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch);
      sincronizarVisita(c);
      bump();
      if (aviso) toast(aviso);
    },

    removeCompromisso(id: string) {
      const i = compromissos.findIndex((x) => x.id === id);
      if (i < 0) return;
      const [c] = compromissos.splice(i, 1);
      if (c.tipo === "visita" && c.leadId) {
        const l = leads.find((x) => x.id === c.leadId);
        if (l) l.visitaEm = undefined;
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
      bump();
    },

    addProprietario(input: Omit<Proprietario, "id">) {
      const p: Proprietario = { ...input, id: uid("p") };
      proprietarios.unshift(p);
      bump();
      toast("Proprietário cadastrado.");
      return p;
    },

    /** Imóvel = lugar físico (edifício, casa, galpão...). */
    addImovel(input: Pick<Imovel, "categoria" | "nome" | "endereco">) {
      const im: Imovel = { ...input, id: uid("im"), criadoEm: new Date().toISOString() };
      imoveis.unshift(im);
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
      bump();
      toast("Captação cadastrada.");
      return c;
    },

    toggleCaptacao(id: string, step: number) {
      const c = captacoes.find((x) => x.id === id);
      if (!c) return;
      c.checklistCaptacao = c.checklistCaptacao.map((v, k) => (k === step ? !v : v));
      bump();
    },

    toggleMarketing(id: string, step: number, value?: boolean) {
      const c = captacoes.find((x) => x.id === id);
      if (!c) return;
      c.checklistMarketing = c.checklistMarketing.map((v, k) => (k === step ? (value ?? !v) : v));
      bump();
    },

    /** Só o administrador registra vendas e locações. */
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
      bump();
      toast(input.tipo === "venda" ? "Venda registrada. VGV e VGC atualizados." : "Locação registrada. Volume de locação e VGC atualizados.");
      return t;
    },

    addParceiro(input: Omit<Parceiro, "id">) {
      const p: Parceiro = { ...input, id: uid("pa") };
      parceiros.push(p);
      bump();
      toast("Parceiro cadastrado.");
      return p;
    },

    /** O corretor informa o fechamento; o administrador confere e registra. */
    informarFechamento(input: Pick<FechamentoInformado, "corretorId" | "captacaoId" | "tipo" | "valor" | "data" | "observacao">) {
      fechamentos.unshift({ ...input, id: uid("fi"), criadoEm: new Date().toISOString(), status: "pendente" });
      bump();
      const c = captacaoById(input.captacaoId);
      toast(`Fechamento de ${c ? captacaoTitulo(c) : "captação"} enviado ao administrador.`);
    },

    descartarFechamento(id: string) {
      const f = fechamentos.find((x) => x.id === id);
      if (!f) return;
      f.status = "descartado";
      bump();
      toast("Fechamento informado descartado.");
    },

    // ---------- Academy ----------

    addTrilha(input: Pick<Trilha, "titulo" | "subtitulo">) {
      const hues = [226, 158, 268, 32, 196, 340];
      const t: Trilha = { ...input, id: uid("t"), criadoEm: new Date().toISOString(), capaHue: hues[trilhas.length % hues.length], aulas: [] };
      trilhas.push(t);
      bump();
      toast("Trilha criada. Agora adicione as aulas.");
      return t;
    },

    updateTrilha(id: string, patch: Partial<Pick<Trilha, "titulo" | "subtitulo">>) {
      const t = trilhas.find((x) => x.id === id);
      if (!t) return;
      Object.assign(t, patch);
      bump();
      toast("Trilha atualizada.");
    },

    removeTrilha(id: string) {
      const i = trilhas.findIndex((x) => x.id === id);
      if (i < 0) return;
      trilhas.splice(i, 1);
      bump();
      toast("Trilha excluída.");
    },

    addAula(trilhaId: string, aula: Omit<Aula, "id">) {
      const t = trilhas.find((x) => x.id === trilhaId);
      if (!t) return;
      const a: Aula = { ...aula, id: uid("a") };
      t.aulas.push(a);
      bump();
      toast("Aula adicionada à trilha.");
      return a;
    },

    removeAula(trilhaId: string, aulaId: string) {
      const t = trilhas.find((x) => x.id === trilhaId);
      if (!t) return;
      t.aulas = t.aulas.filter((a) => a.id !== aulaId);
      bump();
      toast("Aula removida.");
    },

    toggleAula(userId: string, aulaId: string) {
      const feitas = progresso[userId] ?? [];
      const done = feitas.includes(aulaId);
      progresso[userId] = done ? feitas.filter((x) => x !== aulaId) : [...feitas, aulaId];
      bump();
      if (!done) toast("Aula concluída.");
    },

    // ---------- Marketing ----------

    setLogo(logo: ArquivoMarca | null) {
      marca.logo = logo;
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
          referencia: novaReferencia(),
        };
        pedidosUpgrade.unshift(p);
      }
      bump();
      return p.id;
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
      if (c) c.plano = p.planoNovo;
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
      bump();
      toast("Pedido de upgrade cancelado.");
    },

    updateUsuario(id: string, patch: Partial<Pick<Usuario, "nome" | "email" | "telefone" | "aniversario" | "creci" | "creciUF" | "estagiario">>) {
      const u = id === admin.id ? admin : corretores.find((x) => x.id === id);
      if (!u) return;
      Object.assign(u, patch);
      if (patch.nome) u.iniciais = patch.nome.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
      bump();
      toast("Perfil atualizado.");
    },

    // ---------- Ajuda ----------

    addChamado(input: Pick<Chamado, "autorId" | "assunto" | "categoria" | "mensagem">) {
      chamados.unshift({ ...input, id: uid("ch"), imobiliariaId: imobiliaria.id, criadoEm: new Date().toISOString(), status: "aberto" });
      bump();
      toast("Chamado enviado para a equipe Frankkia.");
    },

    // ---------- Painel Frankkia ----------

    addCliente(input: Pick<Cliente, "nome" | "cidade" | "cnpj" | "plano" | "adminNome" | "adminEmail">) {
      const c: Cliente = {
        ...input,
        id: uid("cli"),
        status: "aguardando",
        clienteDesde: new Date().toISOString(),
        corretores: 0,
        uso: { negocios: 0, performance: 0, academy: 0, marketing: 0 },
      };
      clientes.push(c);
      bump();
      toast(`Acesso de administrador enviado para ${input.adminEmail}.`);
      return c;
    },

    setClientePlano(id: string, plano: PlanoNome) {
      const c = clientes.find((x) => x.id === id);
      if (!c) return;
      c.plano = plano;
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
      bump();
      toast(status === "suspensa" ? `Acesso de ${c.nome} suspenso.` : `${c.nome} reativada.`);
    },

    resendAcesso(id: string) {
      const c = clientes.find((x) => x.id === id);
      if (c) toast(`Acesso reenviado para ${c.adminEmail}.`);
    },

    updateChamado(id: string, patch: Partial<Pick<Chamado, "status" | "resposta">>) {
      const c = todosChamados().find((x) => x.id === id);
      if (!c) return;
      Object.assign(c, patch);
      bump();
      toast(patch.status === "resolvido" ? "Chamado respondido e resolvido." : "Chamado atualizado.");
    },

    setErroStatus(id: string, status: ErroSistema["status"]) {
      const e = errosSistema.find((x) => x.id === id);
      if (!e) return;
      e.status = status;
      bump();
      if (status === "corrigido") toast("Erro marcado como corrigido para todas as imobiliárias.");
    },

    /** Registra um erro real que aconteceu no navegador (agrupa mensagens repetidas). */
    captureErro(mensagem: string, path: string) {
      const local = nomeDaTela(path);
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
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const actions = useMemo(() => createActions(bump, toast), [bump, toast]);

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
