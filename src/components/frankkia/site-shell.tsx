import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Wordmark } from './dashboard';
import { navigation } from '@/lib/frankkia-data';
export function DemoButton({ inverse = false, children = 'Agendar demonstração' }: { inverse?: boolean; children?: React.ReactNode }) { return <Button variant={inverse?'inverse':'frankkia'} asChild><a href="/#demonstracao">{children}<ArrowUpRight/></a></Button>; }
export function Header() {
 const [open,setOpen] = useState(false);
 const [active,setActive] = useState('');
 const pathname = useLocation({ select: location => location.pathname });
 const menuRef = useRef<HTMLButtonElement>(null);
 useEffect(()=>{
  const close=(e:KeyboardEvent)=>{if(e.key==='Escape' && open){setOpen(false);menuRef.current?.focus({preventScroll:true});}};
  const resize=()=>{if(window.innerWidth>950)setOpen(false);};
  window.addEventListener('keydown',close);
  window.addEventListener('resize',resize);
  return()=>{window.removeEventListener('keydown',close);window.removeEventListener('resize',resize);};
 },[open]);
 useEffect(()=>{
  if(pathname!=='/'){setActive('');return;}
  const sections=Array.from(document.querySelectorAll<HTMLElement>('main section[id]'));
  const update=()=>{
   const threshold=(document.querySelector('.site-header')?.getBoundingClientRect().height ?? 90)+60;
   const current=sections.filter(section=>section.getBoundingClientRect().top<=threshold).at(-1);
   setActive(current?.id ?? '');
  };
  let frame: number | undefined;
  const schedule=()=>{
   if(frame!==undefined)return;
   frame=window.requestAnimationFrame(()=>{frame=undefined;update();});
  };
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('hashchange',update);
  update();
  return()=>{
   if(frame!==undefined)window.cancelAnimationFrame(frame);
   window.removeEventListener('scroll',schedule);
   window.removeEventListener('resize',schedule);
   window.removeEventListener('hashchange',update);
  };
 },[pathname]);
 return <header className="site-header"><div className="container header-inner"><Link to="/" aria-label="Frankkia, início"><Wordmark/></Link><nav className="header-nav" aria-label="Navegação principal">{navigation.map(item=><a key={item.id} href={`/#${item.id}`} aria-current={active===item.id?'location':undefined}>{item.label}</a>)}</nav><div className="header-actions"><Link to="/login" aria-current={pathname==='/login'?'page':undefined}>Entrar</Link><DemoButton/><Button ref={menuRef} variant="quiet" size="icon" className="menu-button" aria-label={open?'Fechar menu':'Abrir menu'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</Button></div></div><nav hidden={!open} inert={!open} aria-hidden={!open} className="container mobile-nav" id="mobile-navigation" aria-label="Navegação móvel">{navigation.map(item=><a key={item.id} href={`/#${item.id}`} aria-current={active===item.id?'location':undefined} onClick={()=>{setOpen(false);menuRef.current?.focus({preventScroll:true});}}>{item.label}</a>)}<Link to="/login" aria-current={pathname==='/login'?'page':undefined} onClick={()=>setOpen(false)}>Entrar</Link><a href="/#demonstracao" onClick={()=>{setOpen(false);menuRef.current?.focus({preventScroll:true});}}>Agendar demonstração ↗</a></nav></header>;
}
export function Footer() { return <footer className="site-footer"><div className="container"><div className="footer-main"><div className="footer-brand"><Link to="/" aria-label="Frankkia, início"><Wordmark/></Link><p>Seu universo imobiliário,<br/>em um só lugar.</p></div><div className="footer-column"><p className="footer-title">Explore a Frankkia</p><a href="/#plataforma">Plataforma</a><a href="/#como-funciona">Como funciona</a><a href="/#sobre">Sobre a Frankkia</a></div><div className="footer-column"><p className="footer-title">Soluções</p><a href="/#performance">Frankkia Performance</a><a href="/#academy">Frankkia Academy</a><a href="/#solucoes">Ferramentas comerciais</a></div><div className="footer-column"><p className="footer-title">Vamos conversar</p><a href="/#planos">Planos</a><a href="/#demonstracao">Agendar demonstração</a><a href="/#demonstracao">Contato</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Frankkia. Todos os direitos reservados.</span><div className="footer-legal"><Link to="/privacidade">Política de Privacidade</Link><Link to="/termos">Termos de Uso</Link></div><span>Um novo universo de possibilidades.</span></div></div></footer>; }
export function Eyebrow({ children }: { children: React.ReactNode }) { return <div className="eyebrow"><span className="eyebrow-dot"/>{children}</div>; }
