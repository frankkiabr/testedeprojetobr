import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Eyebrow } from '@/components/frankkia/site-shell';
import { Button } from '@/components/ui/button';
import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useFrankkiaSession } from '@/components/frankkia/auth-session';
import { privateHead } from '@/lib/platform';
export const Route = createFileRoute('/login')({ head:()=>privateHead('Entrar','Acesso seguro por e-mail e senha à plataforma Frankkia.'),component:Login });
function Login(){
 const navigate=useNavigate(); const {user,loading}=useFrankkiaSession();
 const [busy,setBusy]=useState(false); const [error,setError]=useState('');
 useEffect(()=>{if(user && !loading)void navigate({to:'/plataforma',replace:true});},[user,loading,navigate]);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');const fields=new FormData(event.currentTarget);const {error:failure}=await supabase.auth.signInWithPassword({email:String(fields.get('email')).trim(),password:String(fields.get('password'))});if(failure){setError('Não foi possível entrar. Verifique seu e-mail e senha ou recupere o acesso.');setBusy(false);return;}await navigate({to:'/plataforma',replace:true});}
 return <div className="login-page"><div className="login-panel"><Eyebrow>Seu universo começa aqui</Eyebrow><h1>Bem-vindo à Frankkia.</h1><p>Entre com seu e-mail profissional e senha.</p><form className="login-form" onSubmit={submit}><label className="form-field">E-mail profissional<input name="email" type="email" required autoComplete="username" placeholder="voce@imobiliaria.com.br"/></label><label className="form-field">Senha<input name="password" type="password" required autoComplete="current-password" placeholder="Sua senha"/></label>{error&&<p role="alert" className="text-sm text-foreground">{error}</p>}<Button variant="frankkia" type="submit" disabled={busy||loading}>{busy?'Entrando…':'Entrar'}<ArrowRight/></Button><Link to="/recuperar-senha" className="text-link">Esqueci minha senha</Link><p className="form-disclaimer">O acesso é disponibilizado por convite da sua imobiliária ou da Frankkia.</p><Link to="/" className="text-link"><ArrowLeft/>Voltar para o site</Link></form></div></div>;
}
