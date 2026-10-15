import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { identityQuery, privateHead } from '@/lib/platform';
import { Button } from '@/components/ui/button';
import { SignOutButton } from '@/components/frankkia/private-access';

export const Route = createFileRoute('/_authenticated/plataforma')({
 head: () => privateHead('Seu acesso', 'Sua identidade e imobiliárias na Frankkia.'),
 loader: async ({ context }) => { const identity = await context.queryClient.ensureQueryData(identityQuery); const first = identity.organizations[0]; if (identity.organizations.length === 1 && first) throw redirect({ to: '/organizacao/$organizationId', params: { organizationId: first.id }, replace: true }); if (!identity.organizations.length && !identity.superadmin) throw redirect({ to: '/sem-acesso', replace: true }); },
 component: Platform,
});
function Platform() {
 const { data } = useSuspenseQuery(identityQuery);
 return <section className="legal-page"><div className="container"><div className="eyebrow">Área privada</div><h1>{data.organizations.length ? 'Selecione sua imobiliária' : 'Acesso central Frankkia'}</h1><p>{data.name || data.email}</p>{data.superadmin && <p>Superadministrador Frankkia</p>}<div className="mt-8 grid gap-4">{data.organizations.map(org => <Button key={org.id} variant="outline" asChild className="h-auto min-h-12 whitespace-normal text-left"><Link to="/organizacao/$organizationId" params={{ organizationId: org.id }}>{org.name}</Link></Button>)}</div><div className="mt-8"><SignOutButton/></div></div></section>;
}