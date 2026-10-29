import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { criador, site } from "@/content";
import { EASE_OUT_EXPO } from "@/lib/scroll";
import { Logo } from "@/components/ui";

/**
 * TERMOS DE USO E POLÍTICA DE PRIVACIDADE.
 * Textos-base escritos para a Frankkia (plataforma + portal). Antes de divulgar em larga escala,
 * vale a revisão de um advogado e completar os dados da empresa (razão social, CNPJ e endereço).
 */
const ATUALIZACAO = "29 de outubro de 2026";

type Secao = { titulo: string; texto: ReactNode };

function PaginaLegal({ titulo, intro, secoes, outra }: { titulo: string; intro: ReactNode; secoes: Secao[]; outra: { to: string; rotulo: string } }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-line">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 sm:px-8">
          <Link to="/">
            <Logo className="text-2xl" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> Voltar ao site
          </Link>
        </div>
      </header>
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
        className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8"
      >
        <p className="type-eyebrow text-accent">Documento legal</p>
        <h1 className="type-title mt-3">{titulo}</h1>
        <p className="mt-3 text-sm text-muted">Última atualização: {ATUALIZACAO}</p>
        <div className="mt-8 leading-relaxed text-muted">{intro}</div>

        <ol className="mt-10 space-y-9">
          {secoes.map((s, i) => (
            <li key={s.titulo}>
              <h2 className="font-display text-lg font-semibold text-ink">
                {i + 1}. {s.titulo}
              </h2>
              <div className="mt-2 space-y-3 leading-relaxed text-muted [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-1.5">
                {s.texto}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-canvas p-6 text-sm">
          <p className="text-muted">
            Dúvidas? Escreva para{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-accent">
              {site.email}
            </a>
          </p>
          <Link to={outra.to} className="font-semibold text-accent">
            {outra.rotulo} →
          </Link>
        </div>
      </motion.main>
    </div>
  );
}

const email = (
  <a href={`mailto:${site.email}`} className="font-semibold text-accent">
    {site.email}
  </a>
);

export function Termos() {
  return (
    <PaginaLegal
      titulo="Termos de Uso"
      outra={{ to: "/privacidade", rotulo: "Política de Privacidade" }}
      intro={
        <p>
          Estes Termos regulam o uso da <strong className="text-ink">Frankkia</strong>: a plataforma de gestão para imobiliárias e corretores (área
          logada) e o portal público de imóveis (páginas de anúncios, corretores e imobiliárias). Ao criar uma conta, aceitar um convite ou usar o
          portal, você concorda com estes Termos e com a nossa Política de Privacidade.
        </p>
      }
      secoes={[
        {
          titulo: "Quem pode usar",
          texto: (
            <ul>
              <li>A plataforma é destinada a imobiliárias, corretores de imóveis e estagiários vinculados a uma imobiliária.</li>
              <li>
                Corretores precisam informar um registro válido no CRECI. No plano Solo, o titular da conta é o próprio corretor e o CRECI é
                obrigatório.
              </li>
              <li>O portal de imóveis pode ser acessado por qualquer pessoa, sem cadastro.</li>
            </ul>
          ),
        },
        {
          titulo: "Contas, convites e responsabilidades",
          texto: (
            <ul>
              <li>Cada pessoa tem acesso próprio, com e-mail e senha pessoais e intransferíveis. Guarde sua senha em segurança.</li>
              <li>
                O administrador da imobiliária convida a equipe, define quem continua com acesso e responde pelo uso da conta da imobiliária.
              </li>
              <li>
                Cada corretor vê apenas os próprios leads, captações, proprietários e negócios; o administrador vê todos os dados da imobiliária.
              </li>
              <li>Você é responsável pelas informações que cadastra e por ter autorização para tratá-las (por exemplo, dados de clientes e proprietários).</li>
            </ul>
          ),
        },
        {
          titulo: "Planos, teste grátis e pagamento",
          texto: (
            <ul>
              <li>Os planos, preços e limites (vagas de corretores e anúncios no portal) são os informados no site no momento da contratação.</li>
              <li>
                Quem cria a conta pelo site tem <strong>7 dias de teste grátis</strong>, sem cartão (contas criadas pela equipe Frankkia podem ter
                outro prazo, informado no convite). Ao fim do teste, nada é cobrado automaticamente: o acesso aos dados fica suspenso até a
                contratação de um plano, e os dados continuam guardados.
              </li>
              <li>
                A assinatura pode ser <strong>mensal</strong> ou <strong>anual</strong> (12 meses pelo preço de 10, cobrados de uma vez). Ela{" "}
                <strong>renova automaticamente</strong> ao fim de cada período, no mesmo cartão, até ser cancelada.
              </li>
              <li>
                Pagamentos são processados pela Stripe. A Frankkia não recebe nem guarda os dados completos do seu cartão.
              </li>
              <li>
                Você pode cancelar a qualquer momento pela própria plataforma (Configurações → Plano) ou pelo e-mail {email}. O cancelamento interrompe as próximas renovações e o acesso continua até
                o fim do período já pago.
              </li>
              <li>O plano Solo atende um único corretor. Para formar equipe, a conta passa a um plano de equipe com a Frankkia.</li>
            </ul>
          ),
        },
        {
          titulo: "Direito de arrependimento e reembolso",
          texto: (
            <ul>
              <li>
                Você pode desistir da contratação em até <strong>7 dias</strong> a partir do primeiro pagamento, com <strong>reembolso integral</strong>,
                pelo e-mail {email}. O valor é devolvido no mesmo cartão usado no pagamento.
              </li>
              <li>
                Depois desse prazo, o cancelamento vale para as próximas renovações: não há reembolso proporcional do período em andamento (mensal
                ou anual), e o acesso continua até o fim do período já pago.
              </li>
            </ul>
          ),
        },
        {
          titulo: "Anúncios no portal",
          texto: (
            <ul>
              <li>
                Quem publica um anúncio declara que tem <strong>autorização do proprietário</strong> para anunciar o imóvel e que as informações
                (preço, endereço, fotos, medidas e características) são verdadeiras e atualizadas.
              </li>
              <li>
                Os anúncios mostram o nome e o CRECI do corretor responsável e, quando informado, o CRECI da imobiliária (CRECI-J), como exige a
                regulamentação profissional.
              </li>
              <li>
                É proibido publicar conteúdo falso, enganoso, ofensivo, discriminatório, que viole direitos de terceiros (inclusive direitos
                autorais de fotos) ou que não se refira a um imóvel real disponível.
              </li>
              <li>Imóveis vendidos ou alugados saem do portal automaticamente. A Frankkia pode retirar anúncios que descumpram estes Termos.</li>
              <li>
                A Frankkia apenas hospeda os anúncios: a negociação acontece diretamente entre o interessado e o corretor ou a imobiliária, que
                respondem pelo atendimento e pela intermediação.
              </li>
            </ul>
          ),
        },
        {
          titulo: "Contato pelo portal",
          texto: (
            <p>
              Ao preencher o formulário de um anúncio ou chamar no WhatsApp, o visitante entra em contato diretamente com o corretor responsável
              pelo imóvel, que passa a ser responsável pelo atendimento e pelos dados recebidos. Veja os detalhes na Política de Privacidade.
            </p>
          ),
        },
        {
          titulo: "Uso adequado",
          texto: (
            <ul>
              <li>Não é permitido tentar acessar dados de outras imobiliárias ou corretores, burlar limites do plano ou as regras de segurança.</li>
              <li>Não é permitido copiar o portal em massa (robôs), revender o acesso ou usar a plataforma para envio de spam.</li>
              <li>O descumprimento pode levar à suspensão ou ao encerramento da conta.</li>
            </ul>
          ),
        },
        {
          titulo: "Propriedade intelectual",
          texto: (
            <p>
              A marca, o software, o layout e os conteúdos da Frankkia (incluindo os materiais da Academy) pertencem à Frankkia. Os dados e as
              fotos cadastrados por você continuam sendo seus; você nos autoriza a armazená-los e exibi-los apenas para prestar o serviço (por
              exemplo, mostrar o anúncio no portal).
            </p>
          ),
        },
        {
          titulo: "Disponibilidade e limitação de responsabilidade",
          texto: (
            <ul>
              <li>
                Trabalhamos para manter a plataforma estável e segura, mas podem ocorrer interrupções para manutenção ou por falhas de serviços de
                terceiros.
              </li>
              <li>
                A Frankkia não se responsabiliza pelas negociações imobiliárias, pelos valores anunciados ou pelas informações cadastradas pelos
                usuários.
              </li>
              <li>Os cálculos da plataforma (VGV, comissões, metas, estudo de mercado) são ferramentas de apoio e não substituem a análise profissional.</li>
            </ul>
          ),
        },
        {
          titulo: "Encerramento",
          texto: (
            <p>
              Você pode encerrar o uso a qualquer momento. Encerrada a conta, os dados são mantidos pelo prazo necessário para cumprir obrigações
              legais e depois excluídos, conforme a Política de Privacidade.
            </p>
          ),
        },
        {
          titulo: "Alterações e lei aplicável",
          texto: (
            <p>
              Estes Termos podem ser atualizados; mudanças relevantes serão avisadas na plataforma. Aplicam-se as leis brasileiras, incluindo o
              Código de Defesa do Consumidor e o Decreto nº 7.962/2013 (comércio eletrônico) quando cabíveis. A Frankkia é mantida por{" "}
              {criador.nome}. Fale com a gente pelo e-mail {email}.
            </p>
          ),
        },
      ]}
    />
  );
}

export function Privacidade() {
  return (
    <PaginaLegal
      titulo="Política de Privacidade"
      outra={{ to: "/termos", rotulo: "Termos de Uso" }}
      intro={
        <p>
          Esta Política explica quais dados pessoais a <strong className="text-ink">Frankkia</strong> trata, para quê, com quem compartilha e como
          você exerce seus direitos, de acordo com a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).
        </p>
      }
      secoes={[
        {
          titulo: "Quem é responsável pelos dados",
          texto: (
            <ul>
              <li>
                <strong>Dados da sua conta</strong> (nome, e-mail, telefone, CRECI, foto) e dos pedidos de apresentação feitos no site: a Frankkia é
                a controladora.
              </li>
              <li>
                <strong>Dados que a imobiliária cadastra</strong> na plataforma (leads, clientes, proprietários, negócios): a imobiliária (ou o
                corretor Solo) é a controladora, e a Frankkia é a operadora. Como operadora, a Frankkia trata esses dados apenas para prestar o
                serviço e segundo as instruções da imobiliária, não os usa para outros fins, avisa a imobiliária se houver um incidente de segurança
                que os envolva e, quando a conta é encerrada, exclui os dados ou entrega uma cópia a pedido da imobiliária. A Frankkia{" "}
                <strong>nunca vende</strong> esses dados, não os usa para publicidade e não os usa para treinar inteligência artificial.
              </li>
              <li>
                <strong>Contatos recebidos pelo portal</strong>: vão para o corretor responsável pelo anúncio, que passa a ser o controlador desses
                dados.
              </li>
            </ul>
          ),
        },
        {
          titulo: "Quais dados tratamos",
          texto: (
            <ul>
              <li>Cadastro: nome, e-mail, WhatsApp, data de nascimento, CRECI, foto de perfil e redes sociais (se você informar).</li>
              <li>Uso da plataforma: registros de acesso e das ações feitas (por segurança e para mostrar o histórico).</li>
              <li>Dados de negócio cadastrados pela imobiliária: leads, proprietários, imóveis, endereços, fotos e negociações.</li>
              <li>Visitantes do portal: nome, WhatsApp, e-mail (opcional) e mensagem enviados pelo formulário de contato.</li>
              <li>Pagamento: plano contratado e situação do pagamento. Os dados do cartão ficam com a Stripe, não com a Frankkia.</li>
            </ul>
          ),
        },
        {
          titulo: "Para que usamos",
          texto: (
            <ul>
              <li>Prestar o serviço contratado: login, gestão de leads e captações, agenda, relatórios, ranking e portal (execução de contrato).</li>
              <li>Publicar anúncios com o nome, a foto e o CRECI do corretor, como exige a regulamentação da profissão.</li>
              <li>Encaminhar ao corretor os contatos feitos pelos interessados em um imóvel (a pedido do próprio visitante).</li>
              <li>Cobrar o plano, emitir comunicações sobre a conta e cumprir obrigações legais.</li>
              <li>Manter a segurança, evitar fraudes e abusos (legítimo interesse).</li>
            </ul>
          ),
        },
        {
          titulo: "Com quem compartilhamos",
          texto: (
            <>
              <p>Não vendemos dados pessoais. Usamos fornecedores que nos ajudam a prestar o serviço:</p>
              <ul>
                <li>Supabase: banco de dados, login e arquivos (servidores em São Paulo).</li>
                <li>Cloudflare: armazenamento e entrega das fotos dos anúncios.</li>
                <li>Stripe: processamento dos pagamentos.</li>
                <li>Resend: envio de e-mails (convites e avisos).</li>
                <li>OpenStreetMap e Google Maps: exibição de mapas e busca de endereço. ViaCEP: busca do endereço pelo CEP.</li>
                <li>Google Agenda: só para quem escolher conectar a própria conta (veja a seção "Google Agenda").</li>
                <li>WhatsApp: quando você toca em um botão de WhatsApp, a conversa acontece no aplicativo, sob a política da Meta.</li>
              </ul>
              <p>
                Alguns desses fornecedores (Cloudflare, Stripe, Resend e Google) processam ou guardam dados em servidores fora do Brasil. Nesses
                casos, a transferência internacional acontece para prestar o serviço que você contratou e com as garantias contratuais de proteção de
                dados oferecidas por eles, conforme o art. 33 da LGPD.
              </p>
              <p>Também podemos compartilhar dados quando a lei ou uma autoridade competente exigir.</p>
            </>
          ),
        },
        {
          titulo: "Google Agenda",
          texto: (
            <>
              <p>
                A conexão com o Google Agenda é opcional e feita por cada pessoa, na própria Agenda da Frankkia, pela tela oficial de login do Google.
                Ao conectar, você autoriza a Frankkia a:
              </p>
              <ul>
                <li>
                  ler o <strong>endereço de e-mail</strong> da sua conta Google, para mostrar qual conta está conectada;
                </li>
                <li>
                  <strong>criar, alterar e excluir eventos</strong> no seu Google Agenda principal, apenas para copiar para lá os compromissos que você
                  cria, altera ou exclui na Frankkia (título, data, horário, local e observações);
                </li>
                <li>
                  <strong>consultar apenas esses mesmos eventos</strong>, um por um, para trazer de volta à Frankkia o que você mudar neles pelo
                  Google (título, horário, local ou exclusão).
                </li>
              </ul>
              <p>
                A Frankkia não lê nem altera os outros eventos da sua agenda, não usa esses dados para publicidade, não os vende e não os compartilha com
                outras pessoas (nem com a sua imobiliária). Guardamos apenas o e-mail da conta e a autorização de acesso, criptografada (AES-256) no servidor e
                nunca exibida no aplicativo.
              </p>
              <p>
                Você pode desconectar a qualquer momento em Agenda → Google Agenda → Desconectar (a autorização é revogada na hora) ou em
                myaccount.google.com/permissions. Ao desconectar, apagamos a autorização guardada; os eventos já criados continuam na sua agenda.
              </p>
              <p>
                O uso e a transferência, para qualquer outro aplicativo, de informações recebidas das APIs do Google pela Frankkia seguirão a{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-accent"
                >
                  Política de Dados do Usuário dos Serviços de API do Google
                </a>
                , incluindo os requisitos de Uso Limitado.
              </p>
            </>
          ),
        },
        {
          titulo: "O que fica público",
          texto: (
            <p>
              Ao publicar um anúncio no portal, ficam públicos: as fotos e os dados do imóvel (inclusive o endereço completo e o preço), o nome, a
              foto, o CRECI, o WhatsApp e as redes sociais informadas do corretor, e o nome e a logo da imobiliária. Dados de clientes, proprietários,
              comissões e negociações nunca aparecem no portal.
            </p>
          ),
        },
        {
          titulo: "Por quanto tempo guardamos",
          texto: (
            <ul>
              <li>Dados da conta e da imobiliária: enquanto a conta estiver ativa ou em teste.</li>
              <li>
                Depois do encerramento (ou do fim de um teste grátis não contratado): até <strong>90 dias</strong>, para permitir a reativação ou a
                entrega de uma cópia; depois disso, os dados são excluídos ou anonimizados.
              </li>
              <li>Registros de pagamento e de faturamento: pelo prazo exigido pela legislação fiscal (em geral, 5 anos).</li>
              <li>Pedidos de apresentação feitos no site: até 12 meses após o último contato.</li>
              <li>Anúncios retirados do portal deixam de ser exibidos na hora.</li>
            </ul>
          ),
        },
        {
          titulo: "Cookies e armazenamento no navegador",
          texto: (
            <p>
              Usamos apenas o armazenamento necessário para manter você conectado e lembrar preferências (como "lembrar de mim"). Não usamos cookies
              de publicidade nem vendemos informações de navegação.
            </p>
          ),
        },
        {
          titulo: "Segurança",
          texto: (
            <>
              <ul>
                <li>
                  <strong>Criptografia:</strong> os dados trafegam por conexão segura (HTTPS, TLS 1.2 ou superior) e ficam guardados com
                  criptografia em disco (AES-256), inclusive as cópias de segurança. As autorizações de acesso a serviços externos (como o
                  Google Agenda) recebem uma camada própria de criptografia (AES-256), com chave guardada separada do banco de dados.
                </li>
                <li>
                  <strong>Senhas:</strong> são guardadas de forma irreversível (hash); nem a equipe Frankkia consegue lê-las.
                </li>
                <li>
                  <strong>Regras de acesso no próprio banco:</strong> cada corretor só vê os próprios dados, a comissão só é vista pelo próprio corretor e
                  pelo administrador, e a equipe Frankkia vê apenas dados de conta e volumes de uso das imobiliárias.
                </li>
                <li>
                  <strong>Integrações:</strong> os avisos de pagamento da Stripe têm a assinatura conferida antes de serem aceitos, e a conexão com o Google
                  usa um código de verificação de uso único contra fraudes.
                </li>
              </ul>
              <p>
                Se acontecer um incidente de segurança que possa trazer risco ou dano relevante, avisamos a Autoridade Nacional de Proteção de Dados
                (ANPD) e as pessoas afetadas em até <strong>3 dias úteis</strong>, como determina a ANPD, e também a imobiliária responsável quando
                envolver dados cadastrados por ela.
              </p>
            </>
          ),
        },
        {
          titulo: "Seus direitos",
          texto: (
            <>
              <p>Pela LGPD, você pode pedir a qualquer momento:</p>
              <ul>
                <li>confirmação de que tratamos seus dados e acesso a eles;</li>
                <li>correção de dados incompletos ou desatualizados;</li>
                <li>anonimização, bloqueio ou exclusão de dados desnecessários;</li>
                <li>portabilidade, informação sobre compartilhamentos e revogação do consentimento, quando for o caso.</li>
              </ul>
              <p>
                Muitos dados podem ser corrigidos por você mesmo em Configurações. Para os demais pedidos, escreva para {email}: respondemos em até{" "}
                <strong>15 dias</strong>. Se o pedido for
                sobre dados cadastrados por uma imobiliária (por exemplo, um contato feito pelo portal), nós o encaminhamos a ela. Você também pode
                procurar a Autoridade Nacional de Proteção de Dados (ANPD).
              </p>
            </>
          ),
        },
        {
          titulo: "Crianças e adolescentes",
          texto: <p>A Frankkia não é destinada a menores de 18 anos e não coleta intencionalmente dados deles.</p>,
        },
        {
          titulo: "Contato e alterações",
          texto: (
            <p>
              O encarregado pelo tratamento de dados pessoais é {criador.nome}, pelo e-mail {email}. Esta Política pode ser atualizada; a data no
              topo da página indica a versão em vigor.
            </p>
          ),
        },
      ]}
    />
  );
}
