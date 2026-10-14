import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { identityQuery, privateHead } from '@/lib/platform';
import { SignOutButton } from '@/components/frankkia/private-access';
import { Button } from '@/components/ui/button';
import { platformOrganization } from '@/lib/platform-organization.functions';

export const Route = createFileRoute('/_authenticated/organizacao/$organizationId')({
 head: () => privateHead('Imobiliária atual', 'Organização e permissões do seu acesso Frankkia.'),
 loader: async ({ context, params }) => { await context.queryClient.ensureQueryData(identityQuery); const result = await platformOrganization({ data: { organizationId: params.organizationId } }); if (!result) throw redirect({ to: '/sem-acesso', replace: true }); return result; },
 component: Organization,
});
function Organization() {
 const organization = Route.useLoaderData(); const { data } = useSuspenseQuery(identityQuery);
 const roles = data.organizations.find(org => org.id === organization.id)?.roles ?? [];
 return <section className="legal-page"><div className="container"><div className="eyebrow">Imobiliária atual</div><h1 className="break-words">{organization.name}</h1><p>{data.name || data.email}</p><p>{roles.map(role => role === 'admin' ? 'Administrador da imobiliária' : 'Corretor').join(' · ') || 'Superadministrador Frankkia'}</p><div className="mt-8 flex flex-wrap gap-4">{(data.organizations.length > 1 || data.superadmin) && <Button variant="outline" asChild><Link to="/plataforma">Trocar imobiliária</Link></Button>}<SignOutButton/></div></div></section>;
}