import { createFileRoute } from '@tanstack/react-router';
import { useScrollMotion } from '@/components/frankkia/use-scroll-motion';
import { Hero, Ecosystem, Performance, Academy, Tools, HowItWorks, Benefits, Pricing, Contact, FAQ } from '@/components/frankkia/home-sections';
export const Route = createFileRoute('/')({
 head: () => ({ meta: [
  { title: 'Frankkia | Seu universo imobiliário, em um só lugar' },
  { name: 'description', content: 'Conheça a Frankkia: um ecossistema de gestão, performance, capacitação e ferramentas comerciais para imobiliárias e corretores.' },
  { property: 'og:title', content: 'Frankkia | Seu universo imobiliário, em um só lugar' },
  { property: 'og:description', content: 'Gestão, performance, capacitação e ferramentas comerciais conectadas em uma única plataforma para imobiliárias e corretores.' },
  { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
 ] }),
 component: Index,
});
function Index() { const motionRef = useScrollMotion(); return <div ref={motionRef}><Hero/><Ecosystem/><Performance/><Academy/><Tools/><HowItWorks/><Benefits/><Pricing/><Contact/><FAQ/></div>; }
