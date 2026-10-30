import { dataHora } from "@/lib/format";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Check,
  Copy,
  ExternalLink,
  FileSignature,
  Globe,
  ImageOff,
  Link2,
  Loader2,
  PenLine,
  Presentation,
  Printer,
  Radar,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { admin as adminDemo, corretores, imobiliaria } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { captacoesOf, imovelById, proprietarioById, userById } from "@/data/queries";
import { useStore } from "@/data/store";
import {
  adicionarAmostra,
  atualizarAmostra,
  atualizarAvaliacao,
  duplicarAvaliacao,
  excluirAvaliacao,
  lerAnuncio,
  removerAmostra,
  resultado,
  TIPOS_ESTUDO,
  type Amostra,
  type Avaliacao,
  type NovaAmostra,
} from "@/data/avaliacoes";
import { buscarTodos, type CartaoAnuncio } from "@/portal/api";
import { mensagemErro } from "@/integrations/frankkia/client";
import { brl } from "@/lib/format";
import { Badge, Card, CardHeader, stagger } from "../../kit";
import { BotaoSalvar, btn, Field, formatPhone, inputCls, mascaraMoeda, Modal, moeda, SelectField } from "../../forms";
import { useScope } from "../../session";
import {
  CamposEndereco,
  CamposImovel,
  Chave,
  num,
  OP_CONSERVACAO,
  OP_INFRA,
  OP_MOBILIA,
  OP_ORIENTACAO,
  OP_PORTARIA,
  rotuloDe,
  txt,
  useEstudos,
  type FormEndereco,
  type FormImovel,
} from "./partes";
import { Compartilhar, guardarCaptacaoDoEstudo } from "./apresentacao";
import { VendidosRegiao } from "./vendidos";
import { AjusteCaracteristicas, HistoricoPreco, Lembretes } from "./acompanhamento";

const AJUSTES = [0, 2, 5, 8, 10, 12, 15, 18, 20, 25, 30];
const ERROS_LINK: Record<string, string> = {
  PORTAL_NAO_SUPORTADO: "Cole um link do VivaReal, do Zap Imóveis ou da OLX.",
  LINK_INVALIDO: "Esse link não parece válido. Copie o endereço completo do anúncio.",
  NAO_LIDO: "Não conseguimos ler esse anúncio. Preencha os dados à mão.",
};
const semAcento = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** ESTUDO DE MERCADO (/app/mercado/estudos/:id): acompanhamento, imóvel avaliado, valores encontrados e amostras. */
export default function Estudo() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { real, lista, atualizar } = useEstudos();
  const { toast } = useStore();
  const { isAdmin, user } = useScope();
  const a = lista?.find((x) => x.id === id);

  const [editar, setEditar] = useState(false);
  const [opcoes, setOpcoes] = useState(false);
  const [trocarCorretor, setTrocarCorretor] = useState(false);
  const [amostra, setAmostra] = useState<{ modo: "escolher" | "portal" | "radar" | "manual"; editando?: Amostra } | null>(null);
  const [compartilhar, setCompartilhar] = useState(false);

  if (lista === null)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Carregando estudo...
      </p>
    );
  if (!a)
    return (
      <div className="space-y-3">
        <p className="text-muted">Estudo não encontrado.</p>
        <Link to="/app/mercado" className="text-sm font-semibold text-accent">
          Voltar aos estudos
        </Link>
      </div>
    );

  const salvar = async (patch: Partial<Avaliacao>, aviso?: string) => {
    try {
      await atualizarAvaliacao(real, a, patch);
      atualizar();
      if (aviso) toast(aviso);
      return true;
    } catch (e) {
      toast(mensagemErro(e));
      return false;
    }
  };

  const r = resultado(a);
  const proprietario = a.proprietarioId ? proprietarioById(a.proprietarioId) : undefined;
  const corretor = userById(a.corretorId);
  const tipo = TIPOS_ESTUDO.find((t) => t.valor === a.categoria)?.rotulo.split(" /")[0] ?? a.categoria;
  const fmtValor = (n: number) => (a.finalidade === "locacao" ? `${brl(n)}/mês` : brl(n));
  const fmtM2 = (n: number) => `${brl(n)}/m²`;

  return (
    <div className="space-y-6">
      <Link to="/app/mercado" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink print:hidden">
        <ArrowLeft className="size-4" /> Estudos de mercado
      </Link>

      {/* Cabeçalho */}
      <motion.div {...stagger(0)}>
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <input
            className={`${inputCls} min-w-[16rem] flex-1 font-semibold`}
            defaultValue={a.titulo}
            onBlur={(e) => e.target.value.trim().length >= 2 && e.target.value.trim() !== a.titulo && salvar({ titulo: e.target.value.trim() }, "Título salvo.")}
          />
          <button className={`${btn.accent} print:hidden`} onClick={() => setCompartilhar(true)}>
            <Presentation className="size-4" /> Apresentação
          </button>
          <div className="relative print:hidden">
            <button className={btn.outline} onClick={() => setOpcoes((v) => !v)}>
              <Settings2 className="size-4" /> Opções
            </button>
            {opcoes && (
              <div className="absolute right-0 z-20 mt-2 w-60 rounded-2xl border border-line bg-bg p-2 shadow-float" onMouseLeave={() => setOpcoes(false)}>
                <p className="px-3 pb-1 pt-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-subtle">O que você deseja?</p>
                <MenuItem
                  icone={Printer}
                  onClick={() => {
                    setOpcoes(false);
                    setTimeout(() => window.print(), 50);
                  }}
                >
                  Imprimir
                </MenuItem>
                <MenuItem
                  icone={Copy}
                  onClick={async () => {
                    setOpcoes(false);
                    try {
                      const c = await duplicarAvaliacao(real, imobiliaria.id, user.id, a);
                      toast("Estudo duplicado.");
                      navigate(`/app/mercado/estudos/${c.id}`);
                    } catch (e) {
                      toast(mensagemErro(e));
                    }
                  }}
                >
                  Duplicar
                </MenuItem>
                {isAdmin && (
                  <MenuItem
                    icone={Users}
                    onClick={() => {
                      setOpcoes(false);
                      setTrocarCorretor(true);
                    }}
                  >
                    Alterar corretor(a) do estudo
                  </MenuItem>
                )}
                <MenuItem
                  icone={Trash2}
                  perigo
                  onClick={async () => {
                    setOpcoes(false);
                    if (!window.confirm("Excluir este estudo e todas as amostras?")) return;
                    try {
                      await excluirAvaliacao(real, a.id);
                      toast("Estudo excluído.");
                      navigate("/app/mercado");
                    } catch (e) {
                      toast(mensagemErro(e));
                    }
                  }}
                >
                  Excluir
                </MenuItem>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        {/* Acompanhamento */}
        <motion.div {...stagger(1)}>
          <Card className="h-full">
            <CardHeader title="Acompanhe o resultado do seu estudo" />
            <ul className="divide-y divide-line px-6 pb-3">
              <li className="flex items-center justify-between py-3 text-sm">
                <span className="font-medium">Estudo criado em</span>
                <span className="text-muted">{dataHora(a.criadoEm)}</span>
              </li>
              {(
                [
                  ["apresentado", "Já apresentou este estudo?"],
                  ["exclusividade", "Assinou a exclusividade?"],
                  ["vendido", a.finalidade === "locacao" ? "Alugado?" : "Vendido?"],
                  ["expirado", "Expirado (venceu o prazo ou desistiu)?"],
                  ["linkLiberado", "Liberar link da apresentação"],
                ] as const
              ).map(([k, rotulo]) => (
                <li key={k} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="font-medium">{rotulo}</span>
                  <Chave ligado={a[k]} onChange={(v) => salvar({ [k]: v })} />
                </li>
              ))}
            </ul>
            {a.exclusividade && (
              <div className="mx-6 mb-5 rounded-2xl bg-verified-soft p-4 text-sm text-verified print:hidden">
                <p className="flex items-start gap-2 font-semibold">
                  <FileSignature className="mt-0.5 size-4 shrink-0" /> Exclusividade assinada!
                </p>
                <p className="mt-1 text-verified/80">Cadastre a captação com os dados deste estudo e já comece a anunciar.</p>
                <button
                  className={`${btn.accent} mt-3`}
                  onClick={() => {
                    guardarCaptacaoDoEstudo(a, r?.mercado);
                    navigate("/app/negocios/captacoes?novo=1");
                  }}
                >
                  <Building2 className="size-4" /> Criar captação com estes dados
                </button>
              </div>
            )}
            <p className="px-6 pb-5 text-xs text-muted">Responsável: {corretor?.nome ?? "—"}</p>
          </Card>
        </motion.div>

        {/* Imóvel avaliado */}
        <motion.div {...stagger(2)}>
          <Card className="h-full">
            <CardHeader
              title="Imóvel avaliado"
              subtitle={`${tipo} · ${a.finalidade === "locacao" ? "Locação" : "Venda"}`}
              action={
                <button className={`${btn.outline} print:hidden`} onClick={() => setEditar(true)}>
                  <PenLine className="size-4" /> Editar
                </button>
              }
            />
            <div className="grid gap-x-6 gap-y-3 px-6 pb-6 pt-2 text-sm sm:grid-cols-2">
              <Info rotulo="Endereço" valor={[a.logradouro, a.numero, a.complemento].filter(Boolean).join(", ") || "—"} />
              <Info rotulo="Bairro e cidade" valor={[a.bairro, a.cidade && `${a.cidade}${a.uf ? `/${a.uf}` : ""}`].filter(Boolean).join(" · ") || "—"} />
              <Info rotulo="Áreas" valor={[`${a.areaM2} m² privativos`, a.areaTerreno && `${a.areaTerreno} m² de terreno`].filter(Boolean).join(" · ")} />
              <Info
                rotulo="Cômodos"
                valor={[a.quartos && `${a.quartos} dorm.`, a.suites && `${a.suites} suítes`, a.banheiros && `${a.banheiros} banh.`, a.vagas && `${a.vagas} vagas`].filter(Boolean).join(" · ") || "—"}
              />
              <Info
                rotulo="Características"
                valor={
                  [
                    a.anoConstrucao && `Construído em ${a.anoConstrucao}`,
                    a.emCondominio !== undefined && (a.emCondominio ? "Em condomínio" : "Fora de condomínio"),
                    a.infraestrutura && `Infra: ${rotuloDe(OP_INFRA, a.infraestrutura)}`,
                    a.portaria && `Portaria: ${rotuloDe(OP_PORTARIA, a.portaria)}`,
                    rotuloDe(OP_ORIENTACAO, a.orientacaoSolar),
                    rotuloDe(OP_CONSERVACAO, a.conservacao),
                    rotuloDe(OP_MOBILIA, a.mobilia),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Info
                rotulo="Proprietário"
                valor={proprietario ? `${proprietario.nome}${proprietario.whatsapp ? ` · ${formatPhone(proprietario.whatsapp)}` : ""}` : "—"}
              />
              {a.valorAnunciado ? (
                <Info
                  rotulo="Valor pedido pelo cliente"
                  valor={
                    fmtValor(a.valorAnunciado) +
                    (r ? ` (${a.valorAnunciado >= r.mercado ? "+" : ""}${Math.round((a.valorAnunciado / r.mercado - 1) * 100)}% do valor de mercado)` : "")
                  }
                />
              ) : null}
              {a.observacoes && <Info rotulo="O que você identificou" valor={a.observacoes} largo />}
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 print:hidden">
        <motion.div {...stagger(2)}>
          <Lembretes a={a} real={real} />
        </motion.div>
        <motion.div {...stagger(3)}>
          <HistoricoPreco a={a} real={real} valorMercado={r?.mercado} />
        </motion.div>
      </div>

      {/* Valores encontrados */}
      <motion.div {...stagger(3)}>
        <Card className="overflow-hidden">
          <div className="bg-ink px-6 py-4 text-bg">
            <p className="font-display text-lg font-semibold">Valores encontrados</p>
            <p className="text-sm text-bg/70">
              {r
                ? r.qtd === 1
                  ? `Preço do m² da amostra: ${fmtM2(r.m2Medio)} × ${a.areaM2} m²`
                  : `Preço médio do m² das ${r.qtd} amostras: ${fmtM2(r.m2Medio)} (de ${fmtM2(r.m2Min)} a ${fmtM2(r.m2Max)}) × ${a.areaM2} m²`
                : "Adicione amostras para calcular os valores."}
            </p>
          </div>
          <AjusteCaracteristicas a={a} onUsar={(v) => salvar({ usarVariaveis: v })} />
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <Valor
              etiqueta="Improvável"
              tom="danger"
              explicacao={`Média do m² pesquisado × área privativa do imóvel avaliado${
                r?.pctVariaveis ? `, ajustada em ${r.pctVariaveis > 0 ? "+" : ""}${r.pctVariaveis}% pelas características` : ""
              }, decrescido de ${a.ajusteImprovavel}%.`}
              valor={r?.improvavel}
              m2={r ? r.improvavel / a.areaM2 : undefined}
              fmtValor={fmtValor}
              ajuste={a.ajusteImprovavel}
              mostrar={a.mostrarImprovavel}
              onAjuste={(v) => salvar({ ajusteImprovavel: v })}
              onMostrar={(v) => salvar({ mostrarImprovavel: v })}
            />
            <Valor
              etiqueta="Valor de mercado"
              tom="accent"
              explicacao={`Como chegamos a este valor: valor Improvável decrescido de ${a.ajusteMercado}%.`}
              valor={r?.mercado}
              m2={r ? r.mercado / a.areaM2 : undefined}
              fmtValor={fmtValor}
              ajuste={a.ajusteMercado}
              mostrar={a.mostrarMercado}
              onAjuste={(v) => salvar({ ajusteMercado: v })}
              onMostrar={(v) => salvar({ mostrarMercado: v })}
            />
            <Valor
              etiqueta={a.finalidade === "locacao" ? "Urgência na locação" : "Urgência na venda"}
              tom="verified"
              explicacao={`Como chegamos a este valor: valor Improvável decrescido de ${a.ajusteUrgencia}%.`}
              valor={r?.urgencia}
              m2={r ? r.urgencia / a.areaM2 : undefined}
              fmtValor={fmtValor}
              ajuste={a.ajusteUrgencia}
              mostrar={a.mostrarUrgencia}
              onAjuste={(v) => salvar({ ajusteUrgencia: v })}
              onMostrar={(v) => salvar({ mostrarUrgencia: v })}
            />
          </div>
        </Card>
      </motion.div>

      {/* Amostras */}
      <motion.div {...stagger(4)}>
        <Card className="overflow-hidden">
          <CardHeader title="Amostras selecionadas" subtitle="De 3 a 6 imóveis parecidos na mesma região deixam o estudo mais confiável." />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead>
                <tr className="border-y border-line text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-3 py-3 font-semibold">Amostra</th>
                  <th className="px-3 py-3 text-right font-semibold">Área</th>
                  <th className="px-3 py-3 text-center font-semibold">Dorm.</th>
                  <th className="px-3 py-3 text-center font-semibold">Suíte</th>
                  <th className="px-3 py-3 text-center font-semibold">Banh.</th>
                  <th className="px-3 py-3 text-center font-semibold">Vagas</th>
                  <th className="px-3 py-3 font-semibold">Portaria</th>
                  <th className="px-3 py-3 font-semibold">Infra</th>
                  <th className="px-3 py-3 text-center font-semibold">Ano</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor</th>
                  <th className="px-3 py-3 text-right font-semibold">Valor/m²</th>
                  <th className="px-4 py-3 text-right font-semibold print:hidden">Opções</th>
                </tr>
              </thead>
              <tbody>
                {a.amostras.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-8 text-center text-muted">
                      Nenhuma amostra cadastrada.
                    </td>
                  </tr>
                ) : (
                  a.amostras.map((s, i) => (
                    <tr key={s.id} className={`border-b border-line last:border-0 ${s.usar ? "" : "opacity-45"}`}>
                      <td className="px-4 py-3 text-muted"># {i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          {s.fotoUrl ? (
                            <img src={s.fotoUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
                          ) : (
                            <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-canvas text-subtle">
                              <ImageOff className="size-4" />
                            </span>
                          )}
                          <div className="min-w-0 max-w-[16rem]">
                            <p className="truncate font-medium">
                              {s.endereco || s.titulo || [s.quartos && `${s.quartos} dorm.`, s.portal && `anúncio no ${s.portal.replace(".com.br", "")}`].filter(Boolean).join(", ") || "Amostra"}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-muted">
                              {s.bairro}
                              {s.url && (
                                <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-accent hover:underline">
                                  <ExternalLink className="size-3" /> {s.portal ?? "anúncio"}
                                </a>
                              )}
                              {s.origem === "radar" && <Badge tone="accent">Radar</Badge>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{s.areaM2} m²</td>
                      <td className="px-3 py-3 text-center">{s.quartos ?? "—"}</td>
                      <td className="px-3 py-3 text-center">{s.suites ?? "—"}</td>
                      <td className="px-3 py-3 text-center">{s.banheiros ?? "—"}</td>
                      <td className="px-3 py-3 text-center">{s.vagas ?? "—"}</td>
                      <td className="px-3 py-3 text-muted">{rotuloDe(OP_PORTARIA, s.portaria) ?? "—"}</td>
                      <td className="px-3 py-3 text-muted">{rotuloDe(OP_INFRA, s.infraestrutura) ?? "—"}</td>
                      <td className="px-3 py-3 text-center text-muted">{s.anoConstrucao ?? "—"}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{fmtValor(s.valor)}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{fmtM2(s.valor / s.areaM2)}</td>
                      <td className="px-4 py-3 print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <label className="flex cursor-pointer items-center gap-1 text-xs text-muted" title="Usar no cálculo">
                            <input
                              type="checkbox"
                              className="size-3.5 accent-accent"
                              checked={s.usar}
                              onChange={async (e) => {
                                try {
                                  await atualizarAmostra(real, a, s, { usar: e.target.checked });
                                  atualizar();
                                } catch (err) {
                                  toast(mensagemErro(err));
                                }
                              }}
                            />
                            Usar
                          </label>
                          <button className="rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink" title="Editar" onClick={() => setAmostra({ modo: "manual", editando: s })}>
                            <PenLine className="size-4" />
                          </button>
                          <button
                            className="rounded-lg p-1.5 text-muted hover:bg-rose-50 hover:text-rose-600"
                            title="Remover"
                            onClick={async () => {
                              try {
                                await removerAmostra(real, a, s.id);
                                atualizar();
                              } catch (err) {
                                toast(mensagemErro(err));
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {r && (
                <tfoot>
                  <tr className="border-t border-line bg-canvas/60 text-xs font-semibold text-muted">
                    <td className="px-4 py-3" colSpan={2}>
                      Média das amostras usadas
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{Math.round(r.areaMedia)} m²</td>
                    <td colSpan={7} />
                    <td className="px-3 py-3 text-right tabular-nums">{fmtValor(r.valorMedio)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{fmtM2(r.m2Medio)}</td>
                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="p-6 print:hidden">
            <button className={`${btn.accent} h-12 w-full text-base`} onClick={() => setAmostra({ modo: "escolher" })}>
              <Sparkles className="size-4" /> Nova amostra
            </button>
          </div>
        </Card>
      </motion.div>

      <motion.div {...stagger(5)} className="print:hidden">
        <VendidosRegiao
          a={a}
          real={real}
          onAdicionar={async (d) => {
            try {
              await adicionarAmostra(real, a, d);
              atualizar();
              toast("Imóvel vendido adicionado ao estudo.");
              return true;
            } catch (e) {
              toast(mensagemErro(e));
              return false;
            }
          }}
        />
      </motion.div>

      <Compartilhar
        open={compartilhar}
        a={a}
        real={real}
        whatsappProprietario={proprietario?.whatsapp}
        nomeProprietario={proprietario?.nome}
        onClose={() => setCompartilhar(false)}
        onApresentado={() => !a.apresentado && salvar({ apresentado: true })}
        onLiberar={() => salvar({ linkLiberado: true }, "Link liberado.")}
      />

      <EditarImovel open={editar} a={a} onClose={() => setEditar(false)} onSalvar={(p) => salvar(p, "Dados do imóvel salvos.")} />

      {isAdmin && (
        <TrocarCorretor
          open={trocarCorretor}
          atual={a.corretorId}
          onClose={() => setTrocarCorretor(false)}
          onTrocar={(c) => salvar({ corretorId: c }, "Corretor do estudo alterado.").then(() => setTrocarCorretor(false))}
        />
      )}

      <AmostraModal
        estado={amostra}
        a={a}
        real={real}
        onFechar={() => setAmostra(null)}
        onEscolher={(modo) => setAmostra({ modo })}
        onSalvar={async (dados, editando) => {
          try {
            if (editando) await atualizarAmostra(real, a, editando, dados);
            else await adicionarAmostra(real, a, dados);
            atualizar();
            toast(editando ? "Amostra atualizada." : "Amostra adicionada ao estudo.");
            return true;
          } catch (e) {
            toast(mensagemErro(e));
            return false;
          }
        }}
      />
    </div>
  );
}

function MenuItem({ icone: Icone, perigo, onClick, children }: { icone: typeof Printer; perigo?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-canvas ${perigo ? "text-rose-600" : ""}`}>
      <Icone className="size-4" /> {children}
    </button>
  );
}

function Info({ rotulo, valor, largo }: { rotulo: string; valor: string; largo?: boolean }) {
  return (
    <div className={largo ? "sm:col-span-2" : ""}>
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="whitespace-pre-wrap font-medium">{valor}</p>
    </div>
  );
}

const TONS = {
  danger: { etiqueta: "bg-rose-100 text-rose-700", caixa: "bg-rose-600 text-white" },
  accent: { etiqueta: "bg-accent-soft text-accent", caixa: "bg-accent-soft text-accent" },
  verified: { etiqueta: "bg-verified-soft text-verified", caixa: "bg-verified text-white" },
};

/** Um dos três valores (Improvável, Valor de mercado, Urgência), com ajuste e "mostrar na apresentação". */
function Valor({
  etiqueta,
  tom,
  explicacao,
  valor,
  m2,
  fmtValor,
  ajuste,
  mostrar,
  onAjuste,
  onMostrar,
}: {
  etiqueta: string;
  tom: keyof typeof TONS;
  explicacao: string;
  valor?: number;
  m2?: number;
  fmtValor: (n: number) => string;
  ajuste: number;
  mostrar: boolean;
  onAjuste: (v: number) => void;
  onMostrar: (v: boolean) => void;
}) {
  const t = TONS[tom];
  return (
    <div className="flex flex-col">
      <span className={`w-fit rounded-full px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] ${t.etiqueta}`}>{etiqueta}</span>
      <p className="mt-3 text-sm text-muted">{explicacao}</p>
      <div className={`mt-4 flex w-fit items-baseline gap-3 rounded-2xl px-4 py-3 ${t.caixa}`}>
        <span className="font-display text-xl font-semibold">{valor ? fmtValor(valor) : "R$ 0"}</span>
        <span className="text-xs font-semibold opacity-80">{m2 ? `${brl(m2)}/m²` : "R$ 0/m²"}</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-6 border-t border-line pt-4 print:hidden">
        <Field label="Ajuste de preço" className="w-28">
          <SelectField value={String(ajuste)} onChange={(v) => onAjuste(Number(v))} options={AJUSTES.map((p) => ({ value: String(p), label: p ? `-${p}%` : "0%" }))} />
        </Field>
        <div>
          <p className="mb-1.5 text-sm text-muted">Mostrar na apresentação</p>
          <Chave ligado={mostrar} onChange={onMostrar} />
        </div>
      </div>
    </div>
  );
}

/** Editar os dados do imóvel avaliado (endereço e características). */
function EditarImovel({ open, a, onClose, onSalvar }: { open: boolean; a: Avaliacao; onClose: () => void; onSalvar: (p: Partial<Avaliacao>) => Promise<boolean> }) {
  const [f, setF] = useState<Partial<FormEndereco & FormImovel>>(a);
  const chave = useRef(0);
  useEffect(() => {
    if (open) {
      setF({ ...a });
      chave.current++;
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p: Partial<FormEndereco & FormImovel>) => setF((x) => ({ ...x, ...p }));
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Dados do imóvel avaliado"
      largo="extra"
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            Cancelar
          </button>
          <BotaoSalvar disabled={!f.areaM2 || !f.logradouro || !f.cidade} onSalvar={() => onSalvar(f)} depois={onClose}>
            Salvar
          </BotaoSalvar>
        </>
      }
    >
      <div key={chave.current} className="space-y-6">
        <CamposEndereco f={f} set={set} />
        <CamposImovel f={f} set={set} />
      </div>
    </Modal>
  );
}

function TrocarCorretor({ open, atual, onClose, onTrocar }: { open: boolean; atual: string; onClose: () => void; onTrocar: (id: string) => void }) {
  const [id, setId] = useState(atual);
  const pessoas = [adminDemo, ...corretores.filter((c) => c.ativo !== false)];
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Alterar corretor(a) do estudo"
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            Cancelar
          </button>
          <button className={btn.primary} disabled={id === atual} onClick={() => onTrocar(id)}>
            Alterar
          </button>
        </>
      }
    >
      <Field label="Novo responsável">
        <SelectField value={id} onChange={setId} options={pessoas.map((p) => ({ value: p.id, label: p.nome }))} />
      </Field>
    </Modal>
  );
}

// ---------- Nova amostra: portal, radar ou manual ----------

type Estado = { modo: "escolher" | "portal" | "radar" | "manual"; editando?: Amostra } | null;

function AmostraModal({
  estado,
  a,
  real,
  onFechar,
  onEscolher,
  onSalvar,
}: {
  estado: Estado;
  a: Avaliacao;
  real: boolean;
  onFechar: () => void;
  onEscolher: (m: "portal" | "radar" | "manual") => void;
  onSalvar: (d: NovaAmostra, editando?: Amostra) => Promise<boolean>;
}) {
  const titulo =
    estado?.editando ? "Editar amostra" : estado?.modo === "portal" ? "Amostra de um portal imobiliário" : estado?.modo === "radar" ? "Radar Frankkia" : estado?.modo === "manual" ? "Preencher manualmente" : "Nova amostra";
  return (
    <Modal open={!!estado} onClose={onFechar} title={titulo} subtitle={estado?.modo === "escolher" ? "De onde vem a amostra?" : undefined}>
      {estado?.modo === "escolher" && (
        <div className="grid gap-3">
          {(
            [
              ["portal", Globe, "De um portal imobiliário", "Cole o link do VivaReal, Zap ou OLX e os dados são preenchidos sozinhos."],
              ["radar", Radar, "Do radar Frankkia", `Imóveis parecidos anunciados no portal Frankkia e ${ehSolo(imobiliaria.plano) ? "as suas captações" : "captações da sua imobiliária"}.`],
              ["manual", PenLine, "Preencher manualmente", "Digite os dados de um imóvel que você conhece."],
            ] as const
          ).map(([m, Icone, t, d]) => (
            <button key={m} onClick={() => onEscolher(m)} className="flex items-start gap-4 rounded-2xl border border-line p-4 text-left transition hover:border-accent hover:bg-accent-soft/40">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
                <Icone className="size-5" />
              </span>
              <span>
                <span className="block font-semibold">{t}</span>
                <span className="block text-sm text-muted">{d}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {(estado?.modo === "portal" || estado?.modo === "manual") && (
        <FormAmostra key={estado.editando?.id ?? estado.modo} a={a} real={real} comLink={estado.modo === "portal"} editando={estado.editando} onSalvar={onSalvar} onFechar={onFechar} />
      )}
      {estado?.modo === "radar" && <RadarFrankkia a={a} onAdicionar={(d) => onSalvar(d)} />}
    </Modal>
  );
}

function FormAmostra({
  a,
  real,
  comLink,
  editando,
  onSalvar,
  onFechar,
}: {
  a: Avaliacao;
  real: boolean;
  comLink: boolean;
  editando?: Amostra;
  onSalvar: (d: NovaAmostra, editando?: Amostra) => Promise<boolean>;
  onFechar: () => void;
}) {
  const e = editando;
  const [f, setF] = useState({
    url: e?.url ?? "",
    portal: e?.portal ?? "",
    endereco: e?.endereco ?? e?.titulo ?? "",
    bairro: e?.bairro ?? "",
    valor: moeda(e?.valor),
    area: txt(e?.areaM2),
    quartos: txt(e?.quartos),
    suites: txt(e?.suites),
    banheiros: txt(e?.banheiros),
    vagas: txt(e?.vagas),
    portaria: e?.portaria ?? "",
    infraestrutura: e?.infraestrutura ?? "",
    ano: txt(e?.anoConstrucao),
    foto: e?.fotoUrl ?? "",
  });
  const [lendo, setLendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const ler = async () => {
    setLendo(true);
    setAviso(null);
    const r = await lerAnuncio(real, f.url.trim());
    setLendo(false);
    if (!r.anuncio) return setAviso(ERROS_LINK[r.erro ?? ""] ?? "Não foi possível ler o anúncio agora. Preencha os dados à mão.");
    const x = r.anuncio;
    setF((v) => ({
      ...v,
      url: x.url,
      portal: x.portal,
      endereco: x.titulo ?? v.endereco,
      bairro: x.bairro ?? v.bairro,
      valor: moeda(x.valor) || v.valor,
      area: txt(x.area) || v.area,
      quartos: txt(x.quartos) || v.quartos,
      banheiros: txt(x.banheiros) || v.banheiros,
      vagas: txt(x.vagas) || v.vagas,
      foto: x.foto ?? v.foto,
    }));
    if (!x.completo) setAviso("O portal não liberou a página inteira: preenchemos o que o próprio link informa. Confira e complete o resto (foto, suítes, banheiros...).");
    else if (x.finalidade && x.finalidade !== a.finalidade)
      setAviso(`Atenção: este anúncio é de ${x.finalidade === "venda" ? "venda" : "locação"} e o estudo é de ${a.finalidade === "venda" ? "venda" : "locação"}.`);
  };

  const campo = (k: keyof typeof f, extra?: { inputMode?: "decimal" | "numeric"; placeholder?: string }) => ({
    className: inputCls,
    value: f[k],
    onChange: (ev: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: k === "valor" ? mascaraMoeda(ev.target.value) : ev.target.value }),
    ...extra,
  });
  const ok = !!num(f.valor) && !!num(f.area);

  return (
    <div className="space-y-4">
      {comLink && (
        <Field label="Link do anúncio" hint="Cole o endereço do anúncio no VivaReal, Zap Imóveis ou OLX e clique em Preencher.">
          <div className="flex gap-2">
            <input
              className={inputCls}
              autoFocus
              placeholder="https://www.vivareal.com.br/imovel/..."
              value={f.url}
              onChange={(ev) => setF({ ...f, url: ev.target.value })}
              onKeyDown={(ev) => ev.key === "Enter" && f.url.trim() && ler()}
            />
            <button type="button" className={btn.primary} disabled={!f.url.trim() || lendo} onClick={ler}>
              {lendo ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />} Preencher
            </button>
          </div>
        </Field>
      )}
      {aviso && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{aviso}</p>}
      <div className="flex gap-4">
        {f.foto ? (
          <img src={f.foto} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid h-24 w-32 shrink-0 place-items-center rounded-xl bg-canvas text-subtle">
            <Building2 className="size-6" />
          </span>
        )}
        <div className="grid flex-1 gap-3">
          <Field label="Endereço ou descrição">
            <input {...campo("endereco", { placeholder: "Ex.: Rua das Flores, 120" })} />
          </Field>
          <Field label="Bairro">
            <input {...campo("bairro")} />
          </Field>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label={a.finalidade === "locacao" ? "Aluguel (R$/mês)" : "Valor (R$)"} className="col-span-2">
          <input {...campo("valor", { inputMode: "numeric", placeholder: "0,00" })} />
        </Field>
        <Field label="Área (m²)" className="col-span-2">
          <input {...campo("area", { inputMode: "decimal" })} />
        </Field>
        <Field label="Dormitórios">
          <input {...campo("quartos", { inputMode: "numeric" })} />
        </Field>
        <Field label="Suítes">
          <input {...campo("suites", { inputMode: "numeric" })} />
        </Field>
        <Field label="Banheiros">
          <input {...campo("banheiros", { inputMode: "numeric" })} />
        </Field>
        <Field label="Vagas">
          <input {...campo("vagas", { inputMode: "numeric" })} />
        </Field>
        <Field label="Portaria" className="col-span-2 sm:col-span-1">
          <SelectField value={f.portaria} onChange={(v) => setF({ ...f, portaria: v })} placeholder="—" options={OP_PORTARIA} />
        </Field>
        <Field label="Infraestrutura" className="col-span-2 sm:col-span-2">
          <SelectField value={f.infraestrutura} onChange={(v) => setF({ ...f, infraestrutura: v })} placeholder="—" options={OP_INFRA} />
        </Field>
        <Field label="Ano de construção">
          <input {...campo("ano", { inputMode: "numeric" })} />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <button className={btn.outline} onClick={onFechar}>
          Cancelar
        </button>
        <button
          className={btn.accent}
          disabled={!ok || salvando}
          onClick={async () => {
            setSalvando(true);
            const feito = await onSalvar(
              {
                origem: editando?.origem ?? (f.url ? "link" : "manual"),
                portal: f.portal || undefined,
                url: f.url || undefined,
                titulo: editando?.titulo,
                endereco: f.endereco.trim() || undefined,
                bairro: f.bairro.trim() || undefined,
                valor: num(f.valor)!,
                areaM2: num(f.area)!,
                quartos: num(f.quartos),
                suites: num(f.suites),
                banheiros: num(f.banheiros),
                vagas: num(f.vagas),
                portaria: (f.portaria || undefined) as Amostra["portaria"],
                infraestrutura: (f.infraestrutura || undefined) as Amostra["infraestrutura"],
                anoConstrucao: num(f.ano),
                fotoUrl: f.foto || undefined,
              },
              editando,
            );
            setSalvando(false);
            if (feito) onFechar();
          }}
        >
          <Check className="size-4" /> {editando ? "Salvar amostra" : "Adicionar amostra"}
        </button>
      </div>
    </div>
  );
}

/** Radar Frankkia: anúncios do portal (todas as imobiliárias) e captações da sua imobiliária parecidos com o imóvel avaliado. */
function RadarFrankkia({ a, onAdicionar }: { a: Avaliacao; onAdicionar: (d: NovaAmostra) => Promise<boolean> }) {
  const { scope } = useScope();
  const [portal, setPortal] = useState<CartaoAnuncio[] | null>(null);
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  useEffect(() => {
    buscarTodos()
      .then((l) => setPortal(l ?? []))
      .catch(() => setPortal([]));
  }, []);

  const cidade = semAcento(a.cidade);
  const bairro = semAcento(a.bairro);
  const parecido = (area: number) => area >= a.areaM2 * 0.6 && area <= a.areaM2 * 1.4;
  const jaNoEstudo = new Set(a.amostras.map((s) => s.url).filter(Boolean));

  const itens = useMemo(() => {
    const doPortal = (portal ?? [])
      .filter((p) => p.finalidade === a.finalidade && (!cidade || semAcento(p.cidade) === cidade) && parecido(p.area))
      .map((p) => ({
        chave: `p-${p.codigo}`,
        url: `${window.location.origin}/imovel/${p.slug}`,
        titulo: p.titulo,
        bairro: p.bairro,
        valor: p.valor,
        area: p.area,
        quartos: p.quartos ?? undefined,
        banheiros: p.banheiros ?? undefined,
        vagas: p.vagas ?? undefined,
        foto: p.capa ?? undefined,
        fonte: p.anunciante ?? "Portal Frankkia",
      }));
    const minhas = captacoesOf(scope)
      .filter((c) => c.status === "ativa" && c.finalidade === a.finalidade && c.id !== a.captacaoId && parecido(c.areaM2))
      .map((c) => ({ c, im: imovelById(c.imovelId) }))
      .filter(({ im }) => !cidade || semAcento(im?.endereco.cidade) === cidade)
      .map(({ c, im }) => ({
        chave: `c-${c.id}`,
        url: undefined as string | undefined,
        titulo: [im?.nome, c.unidade].filter(Boolean).join(" · ") || im?.endereco.logradouro || "Captação",
        bairro: im?.endereco.bairro ?? "",
        valor: c.valor,
        area: c.areaM2,
        quartos: undefined as number | undefined,
        banheiros: undefined as number | undefined,
        vagas: undefined as number | undefined,
        foto: undefined as string | undefined,
        fonte: ehSolo(imobiliaria.plano) ? "Sua captação" : "Captação da imobiliária",
      }));
    // Mesmo bairro primeiro; depois, a área mais parecida
    return [...doPortal.filter((x) => !minhas.some((m) => m.titulo === x.titulo)), ...minhas]
      .filter((x) => !x.url || !jaNoEstudo.has(x.url))
      .sort((x, y) => Number(semAcento(y.bairro) === bairro) - Number(semAcento(x.bairro) === bairro) || Math.abs(x.area - a.areaM2) - Math.abs(y.area - a.areaM2))
      .slice(0, 30);
  }, [portal, scope, a.finalidade, a.areaM2, a.captacaoId, cidade, bairro]); // eslint-disable-line react-hooks/exhaustive-deps

  if (portal === null)
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" /> Procurando imóveis parecidos...
      </p>
    );
  if (!itens.length)
    return (
      <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
        Nenhum imóvel parecido no radar{a.cidade ? ` em ${a.cidade}` : ""} ainda (mesma finalidade e área entre {Math.round(a.areaM2 * 0.6)} e {Math.round(a.areaM2 * 1.4)} m²).
        Use um link de portal ou preencha à mão.
      </p>
    );
  return (
    <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
      {itens.map((x) => (
        <li key={x.chave} className="flex items-center gap-3 rounded-2xl border border-line p-3">
          {x.foto ? (
            <img src={x.foto} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" loading="lazy" />
          ) : (
            <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-canvas text-subtle">
              <UserRound className="size-4" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{x.titulo}</p>
            <p className="text-xs text-muted">
              {[x.bairro, `${x.area} m²`, brl(x.valor), `${brl(x.valor / x.area)}/m²`].filter(Boolean).join(" · ")}
            </p>
            <p className="text-[0.6875rem] text-subtle">{x.fonte}</p>
          </div>
          <button
            className={adicionados.has(x.chave) ? `${btn.outline} text-verified` : btn.accent}
            disabled={adicionados.has(x.chave)}
            onClick={async () => {
              const ok = await onAdicionar({
                origem: "radar",
                portal: x.url ? "Portal Frankkia" : "Captação",
                url: x.url,
                titulo: x.titulo,
                endereco: x.titulo,
                bairro: x.bairro || undefined,
                valor: x.valor,
                areaM2: x.area,
                quartos: x.quartos,
                banheiros: x.banheiros,
                vagas: x.vagas,
                fotoUrl: x.foto,
              });
              if (ok) setAdicionados((s) => new Set(s).add(x.chave));
            }}
          >
            {adicionados.has(x.chave) ? (
              <>
                <Check className="size-4" /> Adicionado
              </>
            ) : (
              "Adicionar ao estudo"
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
