import { createFileRoute } from '@tanstack/react-router';
import { identityQuery, privateHead } from '@/lib/platform';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SignOutButton } from '@/components/frankkia/private-access';
export const Route = createFileRoute('/_authenticated/sem-acesso')({ head: () => privateHead('Acesso não autorizado', 'Seu acesso precisa de um vínculo ativo com uma imobiliária.'), loader: ({ context }) => context.queryClient.ensureQueryData(identityQuery), component: NoAccess });
function NoAccess() { const { data } = useSuspenseQuery(identityQuery); return <section className="legal-page"><div className="container"><div className="eyebrow">Área privada</div><h1>Acesso não autorizado</h1><p>{data.email}</p><p>Você não possui acesso a esta imobiliária. Para continuar, solicite um convite ao administrador da sua imobiliária ou à Frankkia.</p><div className="mt-8"><SignOutButton/></div></div></section>; }