import { captura, criador, features, pricing, publicos, site } from "@/content";
import { Logo } from "./ui";

/**
 * Conteúdo das páginas públicas entregue pronto pelo servidor, antes de o app abrir no navegador.
 * Serve ao Google (busca e verificação do app), à prévia de links e a quem está com a internet lenta:
 * só aparece se o site demorar mais de 1,5 s para abrir (classe conteudo-servidor em index.css).
 */
export function ConteudoServidor({ caminho }: { caminho: string }) {
  const pagina =
    caminho === "/sobre" ? (
      <Sobre />
    ) : caminho.startsWith("/conheca-a-frankkia") ? (
      <Captura />
    ) : caminho === "/para-imobiliarias" ? (
      <Publico p={publicos.imobiliarias} />
    ) : caminho === "/para-corretores" ? (
      <Publico p={publicos.corretores} />
    ) : caminho === "/simulador-de-financiamento" ? (
      <Texto titulo="Simulador de financiamento imobiliário" texto="Calcule a parcela do financiamento nos sistemas SAC e Price, a renda necessária e os custos de ITBI e cartório. Grátis e sem cadastro." />
    ) : caminho === "/calculadora-de-comissao" ? (
      <Texto titulo="Calculadora de comissão de corretor" texto="Calcule a comissão de uma venda de imóvel, a divisão em parceria e o repasse à imobiliária. Grátis e sem cadastro." />
    ) : caminho === "/exclusao-de-dados" ? (
      <Texto titulo="Exclusão e pedidos sobre dados pessoais" texto={`Peça a exclusão da sua conta, uma cópia dos seus dados ou a correção de informações, pela LGPD. Respondemos em até 15 dias. Contato: ${site.email}.`} />
    ) : caminho === "/" ? (
      <Inicio />
    ) : null;
  return (
    <div className="conteudo-servidor min-h-screen bg-bg text-ink">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
        <a href="/">
          <Logo className="text-[1.75rem]" />
        </a>
        {pagina && <main className="mt-10 space-y-6 text-muted">{pagina}</main>}
        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href="/#planos">Planos</a>
          <a href="/cadastro">Teste grátis</a>
          <a href="/imoveis">Imóveis</a>
          <a href="/para-imobiliarias">Para imobiliárias</a>
          <a href="/para-corretores">Para corretores</a>
          <a href="/simulador-de-financiamento">Simulador de financiamento</a>
          <a href="/calculadora-de-comissao">Calculadora de comissão</a>
          <a href="/sobre">Sobre</a>
          <a href="/termos">Termos de Uso</a>
          <a href="/privacidade">Política de Privacidade</a>
          <a href="/login">Entrar</a>
        </nav>
      </div>
    </div>
  );
}

function Inicio() {
  return (
    <>
      <h1 className="type-title text-ink">{site.slogan}</h1>
      <p>{site.description}</p>
      <h2 className="font-display text-lg font-semibold text-ink">{features.title}</h2>
      <ul className="list-disc space-y-1 pl-5">
        {features.items.map((f) => (
          <li key={f.key}>
            <strong className="text-ink">{f.title}:</strong> {f.text}
          </li>
        ))}
      </ul>
      <h2 className="font-display text-lg font-semibold text-ink">{pricing.title}</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          {pricing.solo.name}: R$ {pricing.solo.price}/mês ({pricing.solo.seats})
        </li>
        {pricing.plans.map((p) => (
          <li key={p.name}>
            {p.name}: R$ {p.price}/mês ({p.seats})
          </li>
        ))}
      </ul>
    </>
  );
}

function Sobre() {
  return (
    <>
      <h1 className="type-title text-ink">Sobre a Frankkia</h1>
      <p>{site.description}</p>
      <h2 className="font-display text-lg font-semibold text-ink">Quem criou</h2>
      {criador.bio.map((b) => (
        <p key={b.slice(0, 24)}>{b}</p>
      ))}
    </>
  );
}

function Texto({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <h1 className="type-title text-ink">{titulo}</h1>
      <p>{texto}</p>
    </>
  );
}

function Publico({ p }: { p: (typeof publicos)["imobiliarias"] }) {
  return (
    <>
      <h1 className="type-title text-ink">{p.title}</h1>
      <p>{p.text}</p>
      <ul className="list-disc space-y-1 pl-5">
        {p.recursos.map((r) => (
          <li key={r.t}>
            <strong className="text-ink">{r.t}:</strong> {r.d}
          </li>
        ))}
      </ul>
    </>
  );
}

function Captura() {
  return (
    <>
      <h1 className="type-title text-ink">{captura.title}</h1>
      <p>{captura.text}</p>
    </>
  );
}
