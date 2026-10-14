import { createFileRoute, redirect } from '@tanstack/react-router';
import { privateHead } from '@/lib/platform';
export const Route = createFileRoute('/auth')({ head: () => privateHead('Acesso', 'Acesso seguro à plataforma Frankkia.'), beforeLoad: () => { throw redirect({ to: '/login', replace: true }); } });