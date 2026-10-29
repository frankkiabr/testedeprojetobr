-- Quem cadastrou o lead: o sino só avisa de leads que chegaram por outra pessoa (portal ou cadastrados pelo
-- administrador para o corretor), nunca do lead que o próprio usuário acabou de cadastrar.
alter table public.leads add column if not exists criado_por uuid default auth.uid();

-- Leads antigos: quem cadastrou foi o próprio corretor (os do portal ficam sem autor)
update public.leads set criado_por = corretor_id where criado_por is null and origem <> 'Portal';
