/** Imóveis vendidos na região (como no BrokerApp): vendas da imobiliária + vendas cadastradas, para usar como amostra. */
import { useEffect, useState } from "react";
import { BedDouble, CalendarDays, Car, Check, Home, Loader2, MapPin, Plus, Ruler, Search, Trash2 } from "lucide-react";
import { imobiliaria } from "@/data/demo";
import { ehSolo } from "@/data/platform";
import { useStore } from "@/data/store";
import {
  cadastrarVendaExterna,
  excluirVendaExterna,
  categoriaImovel,
  listarVendidos,
  TIPOS_ESTUDO,
  type Avaliacao,
  type FiltroVendidos,
  type NovaAmostra,
  type Vendido,
} from "@/data/avaliacoes";
import { brl } from "@/lib/format";
import { mensagemErro } from "@/integrations/frankkia/client";
import { Card, CardHeader } from "../../kit";
import { btn, DateInput, Field, inputCls, Modal, SelectField } from "../../forms";
import { useScope } from "../../session";
import { num } from "./partes";

const PERIODOS = [
  { value: "", label: "Todo o período" },
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
  { value: "24", label: "Últimos 2 anos" },
];
const TIPOS = TIPOS_ESTUDO.map((t) => ({ value: categoriaImovel(t.valor), label: t.rotulo }));

const tempo = (dias?: number) =>
  dias === undefined ? null : dias <= 45 ? `${dias} dias` : dias < 365 ? `${Math.round(dias / 30)} meses` : `${(dias / 365).toFixed(1).replace(".", ",")} anos`;

export function VendidosRegiao({ a, real, onAdicionar }: { a: Avaliacao; real: boolean; onAdicionar: (d: NovaAmostra) => Promise<boolean> }) {
  const { toast } = useStore();
  const loc = a.finalidade === "locacao";
  const [f, setF] = useState<FiltroVendidos>({ finalidade: a.finalidade, cidade: a.cidade ?? "", bairro: "", categoria: categoriaImovel(a.categoria), meses: undefined });
  const [lista, setLista] = useState<Vendido[] | null>(null);
  const [adicionados, setAdicionados] = useState<Set<string>>(new Set());
  const [cadastrar, setCadastrar] = useState(false);

  const buscar = (filtro = f) => {
    setLista(null);
    listarVendidos(real, filtro)
      .then(setLista)
      .catch((e) => {
        setLista([]);
        toast(mensagemErro(e));
      });
  };
  useEffect(() => buscar(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card>
      <CardHeader
        title={loc ? "Imóveis alugados na região" : "Imóveis vendidos na região"}
        subtitle={`${ehSolo(imobiliaria.plano) ? "Seus negócios fechados e as vendas que você cadastrou" : `Negócios fechados pela ${imobiliaria.nome} e vendas cadastradas pela equipe`}. Usar imóveis já ${loc ? "alugados" : "vendidos"} deixa o estudo mais perto do valor real.`}
        action={
          <button className={btn.outline} onClick={() => setCadastrar(true)}>
            <Plus className="size-4" /> Cadastrar imóvel {loc ? "alugado" : "vendido"}
          </button>
        }
      />
      <div className="grid gap-3 border-b border-line px-6 pb-5 pt-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
        <Field label="Cidade">
          <input className={inputCls} value={f.cidade ?? ""} onChange={(e) => setF({ ...f, cidade: e.target.value })} />
        </Field>
        <Field label="Bairro">
          <input className={inputCls} value={f.bairro ?? ""} placeholder="Todos os bairros" onChange={(e) => setF({ ...f, bairro: e.target.value })} />
        </Field>
        <Field label={loc ? "Data da locação" : "Data da venda"}>
          <SelectField value={String(f.meses ?? "")} onChange={(v) => setF({ ...f, meses: v ? Number(v) : undefined })} options={PERIODOS} />
        </Field>
        <Field label="Tipo">
          <SelectField value={f.categoria ?? ""} onChange={(v) => setF({ ...f, categoria: v })} options={[{ value: "", label: "Todos os tipos" }, ...TIPOS.filter((t, i, l) => l.findIndex((x) => x.value === t.value) === i)]} />
        </Field>
        <button className={`${btn.accent} h-11`} onClick={() => buscar()}>
          <Search className="size-4" /> Buscar
        </button>
      </div>

      {lista === null ? (
        <p className="flex items-center gap-2 px-6 py-8 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" /> Buscando...
        </p>
      ) : lista.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-muted">
          Nenhum imóvel {loc ? "alugado" : "vendido"} com esses filtros. Amplie a busca ou cadastre um imóvel {loc ? "alugado" : "vendido"} que você conhece.
        </p>
      ) : (
        <ul className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
          {lista.map((v) => {
            const feito = adicionados.has(v.id);
            return (
              <li key={v.id} className="flex flex-col overflow-hidden rounded-3xl border border-line">
                <div className="relative">
                  {v.foto ? (
                    <img src={v.foto} alt="" className="aspect-[16/10] w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="grid aspect-[16/10] place-items-center bg-canvas text-subtle">
                      <Home className="size-8" />
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-xl bg-ink px-3 py-1.5 text-xs font-semibold text-bg">
                    {loc ? "ALUGADO" : "VENDIDO"}
                    {tempo(v.dias) ? ` em ${tempo(v.dias)}` : ""}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <button
                    className={`${feito ? `${btn.outline} text-verified` : btn.accent} w-full`}
                    disabled={feito}
                    onClick={async () => {
                      const ok = await onAdicionar({
                        origem: "vendido",
                        titulo: `${v.categoria} ${loc ? "alugado" : "vendido"}`,
                        endereco: v.logradouro,
                        bairro: v.bairro,
                        valor: v.valorVenda,
                        areaM2: v.area,
                        quartos: v.quartos,
                        vagas: v.vagas,
                        fotoUrl: v.foto,
                      });
                      if (ok) setAdicionados((s) => new Set(s).add(v.id));
                    }}
                  >
                    {feito ? (
                      <>
                        <Check className="size-4" /> Adicionado
                      </>
                    ) : (
                      "Adicionar ao estudo"
                    )}
                  </button>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    <div>
                      <dt className="text-xs text-muted">{loc ? "Alugado por" : "Vendido por"}</dt>
                      <dd className="font-semibold">{v.corretor && v.corretor !== v.imobiliaria ? `${v.corretor} · ${v.imobiliaria}` : v.imobiliaria}</dd>
                    </div>
                    <div className="flex items-start gap-1.5 text-muted">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-rose-500" />
                      <span>
                        <span className="font-medium text-ink">{v.bairro}</span>
                        {v.logradouro ? <span className="block">{v.logradouro}</span> : null}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-muted">
                      {v.quartos ? (
                        <span className="inline-flex items-center gap-1">
                          <BedDouble className="size-4" /> {v.quartos}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-4" /> {v.area} m²
                      </span>
                      {v.vagas ? (
                        <span className="inline-flex items-center gap-1">
                          <Car className="size-4" /> {v.vagas}
                        </span>
                      ) : null}
                    </div>
                    {v.valorAnunciado ? (
                      <p className="text-xs text-muted">
                        Valor anunciado: {brl(v.valorAnunciado)}
                        {loc ? "/mês" : ""}
                      </p>
                    ) : null}
                    <p>
                      {loc ? "Alugado por: " : "Vendido por: "}
                      <span className="font-display text-lg font-semibold">
                        {brl(v.valorVenda)}
                        {loc ? "/mês" : ""}
                      </span>
                      <span className="ml-1 text-xs text-muted">({brl(v.valorVenda / v.area)}/m²)</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <CalendarDays className="size-3.5 text-rose-500" /> {loc ? "Data da locação" : "Data da venda"}:{" "}
                      {new Date(`${v.dataVenda}T12:00:00`).toLocaleDateString("pt-BR")}
                    </p>
                    {v.origem === "cadastrada" && (
                      <button
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-rose-600"
                        onClick={async () => {
                          if (!window.confirm("Excluir esta venda cadastrada?")) return;
                          try {
                            await excluirVendaExterna(real, v.id);
                            setLista((l) => (l ?? []).filter((x) => x.id !== v.id));
                            toast("Venda cadastrada excluída.");
                          } catch (e) {
                            toast(/APENAS_ADMIN/.test(String((e as Error).message)) ? "Só quem cadastrou (ou o administrador) pode excluir." : mensagemErro(e));
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" /> Excluir (cadastrada à mão)
                      </button>
                    )}
                  </dl>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <CadastrarVendido
        open={cadastrar}
        a={a}
        real={real}
        onClose={() => setCadastrar(false)}
        onCadastrado={() => {
          setCadastrar(false);
          buscar();
        }}
      />
    </Card>
  );
}

function CadastrarVendido({ open, a, real, onClose, onCadastrado }: { open: boolean; a: Avaliacao; real: boolean; onClose: () => void; onCadastrado: () => void }) {
  const { toast } = useStore();
  const { user } = useScope();
  const loc = a.finalidade === "locacao";
  const vazio = () => ({
    categoria: categoriaImovel(a.categoria),
    logradouro: "",
    bairro: a.bairro ?? "",
    cidade: a.cidade ?? "",
    uf: a.uf ?? "",
    area: "",
    quartos: "",
    vagas: "",
    anunciado: "",
    venda: "",
    data: new Date().toISOString().slice(0, 10),
    dias: "",
  });
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (open) setF(vazio());
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const campo = (k: keyof ReturnType<typeof vazio>, extra?: object) => ({
    className: inputCls,
    value: f[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value }),
    ...extra,
  });
  const ok = f.bairro.trim().length >= 2 && f.cidade.trim().length >= 2 && !!num(f.area) && !!num(f.venda) && !!f.data;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Cadastrar imóvel ${loc ? "alugado" : "vendido"}`}
      subtitle="Uma venda que você conhece e que não passou pela Frankkia. Fica disponível para toda a equipe, sem nome de cliente."
      footer={
        <>
          <button className={btn.outline} onClick={onClose}>
            Cancelar
          </button>
          <button
            className={btn.primary}
            disabled={!ok || salvando}
            onClick={async () => {
              setSalvando(true);
              try {
                await cadastrarVendaExterna(real, imobiliaria.id, user.id, {
                  finalidade: a.finalidade,
                  categoria: f.categoria,
                  logradouro: f.logradouro.trim() || undefined,
                  bairro: f.bairro.trim(),
                  cidade: f.cidade.trim(),
                  uf: f.uf.trim().toUpperCase() || undefined,
                  area: num(f.area)!,
                  quartos: num(f.quartos),
                  vagas: num(f.vagas),
                  valorAnunciado: num(f.anunciado),
                  valorVenda: num(f.venda)!,
                  dataVenda: f.data,
                  dias: num(f.dias),
                });
                toast(`Imóvel ${loc ? "alugado" : "vendido"} cadastrado.`);
                onCadastrado();
              } catch (e) {
                toast(mensagemErro(e));
              } finally {
                setSalvando(false);
              }
            }}
          >
            Cadastrar
          </button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <SelectField value={f.categoria} onChange={(v) => setF({ ...f, categoria: v })} options={TIPOS.filter((t, i, l) => l.findIndex((x) => x.value === t.value) === i)} />
        </Field>
        <Field label="Rua (sem número)">
          <input {...campo("logradouro")} />
        </Field>
        <Field label="Bairro">
          <input {...campo("bairro")} />
        </Field>
        <div className="grid grid-cols-[1fr_5rem] gap-3">
          <Field label="Cidade">
            <input {...campo("cidade")} />
          </Field>
          <Field label="UF">
            <input {...campo("uf", { maxLength: 2 })} />
          </Field>
        </div>
        <Field label="Área (m²)">
          <input {...campo("area", { inputMode: "decimal" })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dormitórios">
            <input {...campo("quartos", { inputMode: "numeric" })} />
          </Field>
          <Field label="Vagas">
            <input {...campo("vagas", { inputMode: "numeric" })} />
          </Field>
        </div>
        <Field label="Valor anunciado (opcional)">
          <input {...campo("anunciado", { inputMode: "decimal" })} />
        </Field>
        <Field label={loc ? "Aluguel fechado (R$/mês)" : "Valor da venda (R$)"}>
          <input {...campo("venda", { inputMode: "decimal" })} />
        </Field>
        <Field label={loc ? "Data da locação" : "Data da venda"}>
          <DateInput value={f.data} onChange={(v) => setF({ ...f, data: v })} />
        </Field>
        <Field label={loc ? "Dias para alugar (opcional)" : "Dias para vender (opcional)"}>
          <input {...campo("dias", { inputMode: "numeric" })} />
        </Field>
      </div>
    </Modal>
  );
}
