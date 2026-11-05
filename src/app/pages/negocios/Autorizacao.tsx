import { useEffect, useState } from "react";
import { AlertTriangle, FileText, Printer } from "lucide-react";
import { imobiliaria } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { captacaoTitulo, enderecoCompleto, imovelById, pessoa, proprietarioById, userById } from "@/data/queries";
import type { Captacao, DadosContrato } from "@/data/types";
import { brl } from "@/lib/format";
import { rotuloTipo } from "@/lib/imovel";
import { Segmented } from "../../kit";
import { btn, Field, formatPhone, inputCls, Modal } from "../../forms";
import { progressoContrato } from "./DadosContrato";

const ESTADO_CIVIL: Record<string, string> = {
  solteiro: "solteiro(a)",
  casado: "casado(a)",
  uniao_estavel: "em união estável",
  divorciado: "divorciado(a)",
  separado: "separado(a)",
  viuvo: "viúvo(a)",
};
const REGIME: Record<string, string> = {
  comunhao_parcial: "comunhão parcial de bens",
  comunhao_universal: "comunhão universal de bens",
  separacao_total: "separação total de bens",
  participacao_final: "participação final nos aquestos",
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const linha = "_______________________________";
const dataBr = (iso?: string) => (iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR") : "");

/** Qualificação do proprietário para o contrato (o que faltar vira linha em branco para completar à mão). */
function qualificacao(nome: string, d: DadosContrato) {
  const v = (x?: string) => (x && x.trim() ? esc(x.trim()) : linha);
  if (d.pessoa === "juridica")
    return `<b>${v(d.razaoSocial || nome)}</b>, pessoa jurídica inscrita no CNPJ sob o nº ${v(d.cnpj)}, com sede em ${v(d.endereco)}, neste ato representada por ${v(d.representanteNome)}, CPF nº ${v(d.representanteCpf)}`;
  const casado = d.estadoCivil === "casado" || d.estadoCivil === "uniao_estavel";
  return (
    `<b>${esc(nome)}</b>, ${v(d.nacionalidade)}, ${d.estadoCivil ? ESTADO_CIVIL[d.estadoCivil] : linha}` +
    (casado ? `${d.regimeBens ? ` sob o regime de ${REGIME[d.regimeBens]}` : ""}` : "") +
    `, ${v(d.profissao)}, portador(a) do RG nº ${v(d.rg)}${d.rgOrgao ? ` ${esc(d.rgOrgao)}` : ""}, inscrito(a) no CPF sob o nº ${v(d.cpf)}` +
    `${d.nascimento ? `, nascido(a) em ${dataBr(d.nascimento)}` : ""}, residente e domiciliado(a) em ${v(d.endereco)}` +
    (casado ? `, e seu cônjuge <b>${v(d.conjugeNome)}</b>, RG nº ${v(d.conjugeRg)}, CPF nº ${v(d.conjugeCpf)}` : "")
  );
}

/**
 * AUTORIZAÇÃO DE VENDA/LOCAÇÃO (intermediação imobiliária) preenchida com os dados do imóvel, do proprietário e do corretor.
 * Abre uma página pronta para imprimir ou salvar em PDF. É um modelo de referência: o texto deve ser revisado por advogado.
 */
export function AutorizacaoModal({ captacao, open, onClose }: { captacao: Captacao; open: boolean; onClose: () => void }) {
  const [exclusiva, setExclusiva] = useState<"sim" | "nao">("sim");
  const [prazo, setPrazo] = useState("90");
  const [comissao, setComissao] = useState("");
  useEffect(() => {
    if (!open) return;
    setExclusiva("sim");
    setPrazo("90");
    setComissao(captacao.comissaoPct ? String(captacao.comissaoPct).replace(".", ",") : captacao.finalidade === "venda" ? "6" : "100");
  }, [open, captacao.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const prop = proprietarioById(captacao.proprietarioId);
  const im = imovelById(captacao.imovelId);
  const corretor = userById(captacao.corretorId) ?? pessoa(captacao.corretorId);
  const dados = prop?.contrato ?? {};
  const { feitos, total } = progressoContrato(dados);
  const venda = captacao.finalidade === "venda";
  const pct = Number(comissao.replace(",", ".")) || 0;
  const dias = Math.max(1, Math.min(365, Number(prazo) || 90));

  const gerar = () => {
    if (!prop || !im) return;
    const solo = ehSolo(imobiliaria.plano);
    const crecis = [
      corretor && "creci" in corretor && corretor.creci ? `CRECI ${esc(corretor.creci)}${corretor.creciUF ? `-${esc(corretor.creciUF)}` : ""}` : `CRECI ${linha}`,
    ];
    const intermediario = solo
      ? `<b>${esc(corretor?.nome ?? "")}</b>, corretor(a) de imóveis, ${crecis[0]}`
      : `<b>${esc(imobiliaria.nome)}</b>${imobiliaria.cnpj ? `, CNPJ nº ${esc(imobiliaria.cnpj)}` : ""}${imobiliaria.creciJ ? `, CRECI-J ${esc(imobiliaria.creciJ)}` : ""}, por seu(sua) corretor(a) <b>${esc(corretor?.nome ?? "")}</b>, ${crecis[0]}`;
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    const cidade = imobiliaria.cidade.split(",")[0]?.trim() || im.endereco.cidade;
    const valorTxt = venda ? `${brl(captacao.valor)} (valor pedido para venda)` : `${brl(captacao.valor)} mensais (aluguel pedido)`;
    const base = venda ? "do valor da venda efetivamente realizada" : "do primeiro aluguel (ou conforme combinado)";
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Autorização de ${venda ? "venda" : "locação"} · ${esc(captacaoTitulo(captacao))}</title>
<style>
  @page { size: A4; margin: 22mm 20mm; }
  body { font-family: Georgia, "Times New Roman", serif; color: #111; font-size: 12.5pt; line-height: 1.6; margin: 0; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 15pt; text-align: center; letter-spacing: .04em; margin: 0 0 4px; }
  .sub { text-align: center; color: #555; font-size: 10.5pt; margin-bottom: 28px; }
  p { text-align: justify; margin: 0 0 12px; }
  .ass { display: flex; gap: 40px; margin-top: 56px; }
  .ass div { flex: 1; text-align: center; border-top: 1px solid #111; padding-top: 6px; font-size: 10.5pt; }
  .nota { margin-top: 40px; font-family: Arial, sans-serif; font-size: 8.5pt; color: #888; text-align: center; }
  .barra { font-family: Arial, sans-serif; background: #0f1a33; color: #fff; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
  .barra button { background: #2f5bea; color: #fff; border: 0; border-radius: 999px; padding: 8px 18px; font-weight: 600; cursor: pointer; }
  @media print { .barra { display: none; } .wrap { padding: 0; } }
</style></head><body>
<div class="barra"><span>Confira o texto e complete o que estiver em branco antes de imprimir.</span><button onclick="window.print()">Imprimir / salvar PDF</button></div>
<div class="wrap">
<h1>AUTORIZAÇÃO DE ${venda ? "VENDA" : "LOCAÇÃO"}${exclusiva === "sim" ? " COM EXCLUSIVIDADE" : ""}</h1>
<div class="sub">Contrato de intermediação imobiliária · Cód. do imóvel ${esc(captacao.codigo ?? "")}${prop.codigo ? ` · Cód. do cliente ${esc(prop.codigo)}` : ""}</div>
<p>Pelo presente instrumento, ${qualificacao(prop.nome, dados)}, doravante denominado(a) <b>PROPRIETÁRIO(A)</b>, autoriza ${intermediario}, doravante denominado(a) <b>INTERMEDIÁRIO(A)</b>, a promover a ${venda ? "venda" : "locação"} do imóvel abaixo descrito.</p>
<p><b>1. Do imóvel.</b> ${esc(rotuloTipo(im.categoria))}${captacao.unidade ? `, ${esc(captacao.unidade)}` : ""}${im.nome ? `, ${esc(im.nome)}` : ""}, situado em ${esc(enderecoCompleto(im.endereco))}${im.cep ? `, CEP ${esc(im.cep.replace(/(\d{5})(\d{3})/, "$1-$2"))}` : ""}, com área de ${captacao.areaM2} m², matrícula nº ${linha} do ${linha} Cartório de Registro de Imóveis.</p>
<p><b>2. Do valor.</b> O imóvel é oferecido por ${valorTxt}, podendo o(a) PROPRIETÁRIO(A) aceitar outras propostas, que lhe serão apresentadas por escrito.</p>
<p><b>3. Do prazo${exclusiva === "sim" ? " e da exclusividade" : ""}.</b> Esta autorização vale por ${dias} ${dias === 1 ? "dia" : "dias"} a contar da assinatura${exclusiva === "sim" ? ", período em que o(a) INTERMEDIÁRIO(A) terá exclusividade na intermediação. Se o negócio for fechado nesse prazo diretamente pelo(a) PROPRIETÁRIO(A) ou por terceiros, a remuneração continua devida" : ", sem exclusividade"}.</p>
<p><b>4. Da remuneração.</b> Concluído o negócio, o(a) PROPRIETÁRIO(A) pagará ao(à) INTERMEDIÁRIO(A) a comissão de ${pct ? `${String(pct).replace(".", ",")}%` : linha} ${base}, também devida se o negócio for fechado depois do prazo com cliente apresentado pelo(a) INTERMEDIÁRIO(A) durante a vigência desta autorização.</p>
<p><b>5. Da divulgação.</b> O(A) PROPRIETÁRIO(A) autoriza a divulgação do imóvel, com fotos, valor e endereço, em portais, redes sociais, site e materiais do(a) INTERMEDIÁRIO(A), e a colocação de placa, e declara ser legítimo(a) proprietário(a) do imóvel, livre de impedimentos que inviabilizem o negócio, comprometendo-se a apresentar os documentos necessários.</p>
<p><b>6. Do foro.</b> Fica eleito o foro da comarca de ${esc(im.endereco.cidade)}/${esc(im.endereco.uf)} para dirimir eventuais dúvidas.</p>
<p style="margin-top:28px">${esc(cidade)}, ${hoje}.</p>
<div class="ass"><div>PROPRIETÁRIO(A)<br>${esc(dados.pessoa === "juridica" ? dados.razaoSocial || prop.nome : prop.nome)}</div><div>INTERMEDIÁRIO(A)<br>${esc(corretor?.nome ?? "")}</div></div>
${dados.estadoCivil === "casado" || dados.estadoCivil === "uniao_estavel" ? `<div class="ass"><div>CÔNJUGE<br>${esc(dados.conjugeNome ?? "")}</div><div style="border:0"></div></div>` : ""}
<div class="ass"><div>TESTEMUNHA 1<br>Nome e CPF</div><div>TESTEMUNHA 2<br>Nome e CPF</div></div>
<div class="nota">Documento gerado pela Frankkia com os dados cadastrados. Modelo de referência: revise o texto com seu advogado antes de usar.</div>
</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      banner
      title={`Autorização de ${venda ? "venda" : "locação"}`}
      subtitle="Preenchida com os dados do imóvel e do proprietário."
      footer={
        <>
          <button onClick={onClose} className={btn.outline}>
            Cancelar
          </button>
          <button onClick={gerar} disabled={!prop || !im || !pct} className={btn.primary}>
            <Printer className="size-4" /> Gerar documento
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3 rounded-2xl bg-canvas p-4 text-sm">
          <FileText className="size-5 shrink-0 text-accent" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{captacaoTitulo(captacao)}</p>
            <p className="text-xs text-muted">
              Proprietário: {prop?.nome} {prop?.whatsapp ? `· ${formatPhone(prop.whatsapp)}` : ""}
            </p>
          </div>
        </div>
        {feitos < total && (
          <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
            Faltam {total - feitos} dados do proprietário (CPF, RG, estado civil...). Eles saem como linha em branco para completar à mão. Para
            preencher, abra o proprietário em Negócios → Proprietários → Dados para contrato.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-semibold">Com exclusividade?</span>
          <Segmented
            id="exclusiva"
            size="sm"
            value={exclusiva}
            onChange={setExclusiva}
            options={[
              { value: "sim", label: "Com exclusividade" },
              { value: "nao", label: "Sem exclusividade" },
            ]}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prazo (dias)">
            <input className={inputCls} inputMode="numeric" value={prazo} onChange={(e) => setPrazo(e.target.value.replace(/\D/g, "").slice(0, 3))} />
          </Field>
          <Field label="Comissão (%)" hint={venda ? "Sobre o valor da venda." : "Sobre o 1º aluguel."}>
            <input className={inputCls} inputMode="decimal" value={comissao} onChange={(e) => setComissao(e.target.value.replace(/[^\d,]/g, "").slice(0, 5))} />
          </Field>
        </div>
        <p className="text-xs text-subtle">O documento abre numa nova aba, pronto para imprimir ou salvar em PDF. É um modelo de referência: revise com seu advogado.</p>
      </div>
    </Modal>
  );
}
