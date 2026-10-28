/** Fase C do estudo: lembretes e comentários (com compromisso na Agenda), histórico de preço e ajuste por características. */
import { useEffect, useState } from "react";
import { Bell, CalendarClock, History, Loader2, MessageSquare, SlidersHorizontal, Trash2 } from "lucide-react";
import { useStore } from "@/data/store";
import { adicionarNota, excluirNota, historicoPreco, listarNotas, type Avaliacao, type Nota } from "@/data/avaliacoes";
import { ajusteCaracteristicas, variaveis } from "@/lib/estudo-calculo";
import { brl } from "@/lib/format";
import { mensagemErro } from "@/integrations/frankkia/client";
import { LineArea } from "../../charts";
import { Card, CardHeader } from "../../kit";
import { btn, DateInput, Field, inputCls, TimeInput } from "../../forms";
import { useScope } from "../../session";
import { Chave } from "./partes";

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Lembretes e comentários: o lembrete com data vira um compromisso na Agenda (e no Google Agenda, se conectado). */
export function Lembretes({ a, real }: { a: Avaliacao; real: boolean }) {
  const { toast, addCompromisso } = useStore();
  const { user } = useScope();
  const [notas, setNotas] = useState<Nota[] | null>(null);
  const [aberto, setAberto] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [texto, setTexto] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("09:00");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarNotas(real, a.id)
      .then(setNotas)
      .catch((e) => {
        setNotas([]);
        toast(mensagemErro(e));
      });
  }, [real, a.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async () => {
    setSalvando(true);
    try {
      let lembreteEm: string | undefined;
      let compromissoId: string | undefined;
      if (data) {
        const inicio = new Date(`${data}T${hora || "09:00"}:00`);
        lembreteEm = inicio.toISOString();
        const c = addCompromisso({
          donoId: user.id,
          titulo: `Estudo: ${a.titulo}`.slice(0, 160),
          tipo: "outro",
          inicio: inicio.toISOString(),
          fim: new Date(inicio.getTime() + 30 * 60_000).toISOString(),
          observacoes: texto.trim(),
        });
        compromissoId = c.id;
      }
      const n = await adicionarNota(real, a.id, user.id, texto.trim(), lembreteEm, compromissoId);
      setNotas((l) => [n, ...(l ?? [])]);
      setTexto("");
      setData("");
      setAberto(false);
      toast(lembreteEm ? "Lembrete criado e colocado na sua Agenda." : "Comentário salvo.");
    } catch (e) {
      toast(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  };

  const lista = notas ?? [];
  const visiveis = verTodos ? lista : lista.slice(0, 3);
  return (
    <Card className="h-full">
      <CardHeader title="Lembretes e comentários" subtitle="Registre cada ação ligada a este imóvel. Com data, o lembrete vai para a sua Agenda." />
      <div className="space-y-3 px-6 pb-6 pt-3">
        {aberto ? (
          <div className="space-y-3 rounded-2xl border border-line p-4">
            <Field label="O que aconteceu ou o que fazer">
              <textarea className={`${inputCls} h-20 resize-y py-2.5`} maxLength={1000} value={texto} onChange={(e) => setTexto(e.target.value)} autoFocus />
            </Field>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <Field label="Lembrar em (opcional)">
                <DateInput value={data} onChange={setData} />
              </Field>
              <Field label="Hora">
                <TimeInput value={hora} onChange={setHora} />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <button className={btn.outline} onClick={() => setAberto(false)}>
                Cancelar
              </button>
              <button className={btn.accent} disabled={!texto.trim() || salvando} onClick={salvar}>
                {salvando ? "Salvando..." : data ? "Criar lembrete" : "Salvar comentário"}
              </button>
            </div>
          </div>
        ) : (
          <button className={`${btn.accent} w-full`} onClick={() => setAberto(true)}>
            <Bell className="size-4" /> Adicionar lembrete ou comentário
          </button>
        )}
        {notas === null ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </p>
        ) : lista.length === 0 ? (
          <p className="text-sm text-muted">Nenhum lembrete ou comentário ainda.</p>
        ) : (
          <ul className="space-y-2">
            {visiveis.map((n) => (
              <li key={n.id} className="flex gap-3 rounded-2xl bg-canvas p-3 text-sm">
                {n.lembreteEm ? <CalendarClock className="mt-0.5 size-4 shrink-0 text-accent" /> : <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted" />}
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap">{n.texto}</p>
                  <p className="mt-1 text-xs text-muted">
                    {n.lembreteEm ? `Lembrete: ${quando(n.lembreteEm)} · ` : ""}registrado em {quando(n.criadoEm)}
                  </p>
                </div>
                <button
                  className="shrink-0 self-start rounded-lg p-1 text-subtle hover:text-rose-600"
                  title="Excluir"
                  onClick={async () => {
                    try {
                      await excluirNota(real, a.id, n.id);
                      setNotas((l) => (l ?? []).filter((x) => x.id !== n.id));
                    } catch (e) {
                      toast(mensagemErro(e));
                    }
                  }}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {lista.length > 3 && (
          <button className={`${btn.outline} w-full`} onClick={() => setVerTodos((v) => !v)}>
            <History className="size-4" /> {verTodos ? "Mostrar menos" : `Ver histórico (${lista.length})`}
          </button>
        )}
      </div>
    </Card>
  );
}

/** Histórico do valor pedido pelo cliente: muda sozinho quando o "valor já anunciado" é editado. */
export function HistoricoPreco({ a, real, valorMercado }: { a: Avaliacao; real: boolean; valorMercado?: number }) {
  const [pontos, setPontos] = useState<{ data: string; valor: number }[] | null>(null);
  useEffect(() => {
    historicoPreco(real, a)
      .then(setPontos)
      .catch(() => setPontos([]));
  }, [real, a.id, a.valorAnunciado]); // eslint-disable-line react-hooks/exhaustive-deps
  const loc = a.finalidade === "locacao";
  const fmt = (n: number) => (loc ? `${brl(n)}/mês` : brl(n));
  return (
    <Card className="h-full">
      <CardHeader title="Histórico de preço" subtitle="Valor pedido pelo cliente ao longo do tempo." />
      <div className="px-6 pb-6 pt-3">
        {pontos === null ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" /> Carregando...
          </p>
        ) : pontos.length === 0 ? (
          <p className="rounded-2xl bg-canvas p-4 text-sm text-muted">
            Informe o valor que o cliente quer pedir em "Imóvel avaliado → Editar". Cada mudança fica registrada aqui, para mostrar a evolução na
            conversa com o proprietário.
          </p>
        ) : (
          <>
            <LineArea data={pontos.map((p) => ({ label: new Date(p.data).toLocaleDateString("pt-BR"), value: p.valor }))} format={fmt} height={180} />
            <p className="mt-3 text-sm text-muted">
              Valor atual pedido: <span className="font-semibold text-ink">{fmt(pontos[pontos.length - 1].valor)}</span>
              {valorMercado ? (
                <>
                  {" "}
                  · {pontos[pontos.length - 1].valor >= valorMercado ? "acima" : "abaixo"} do valor de mercado em{" "}
                  {Math.abs(Math.round((pontos[pontos.length - 1].valor / valorMercado - 1) * 100))}%
                </>
              ) : null}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

/** Ajuste por características: o que entrou no cálculo e o interruptor para considerar ou não. */
export function AjusteCaracteristicas({ a, onUsar }: { a: Avaliacao; onUsar: (v: boolean) => void }) {
  const lista = variaveis(a);
  const total = ajusteCaracteristicas(a);
  return (
    <div className="flex flex-wrap items-start gap-4 border-b border-line px-6 py-4 print:hidden">
      <SlidersHorizontal className="mt-0.5 size-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold">
          Ajuste por características: {a.usarVariaveis ? `${total > 0 ? "+" : ""}${total}%` : "desligado"}
        </p>
        <p className="mt-0.5 text-muted">
          {lista.length
            ? lista.map((v) => `${v.rotulo} (${v.pct > 0 ? "+" : ""}${v.pct}%)`).join(" · ")
            : "Preencha conservação, ano, portaria, infraestrutura, orientação solar e mobília em \"Imóvel avaliado → Editar\" para ajustar o valor."}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted">
        Considerar <Chave ligado={a.usarVariaveis} onChange={onUsar} />
      </div>
    </div>
  );
}
