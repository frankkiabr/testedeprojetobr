import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import type { PlatformIdentity } from './platform';

const identitySchema = z.object({ id: z.string().uuid(), email: z.string(), name: z.string().nullable(), superadmin: z.boolean(), organizations: z.array(z.object({ id: z.string().uuid(), name: z.string(), roles: z.array(z.enum(['admin','broker'])).nullable() })) });
export const platformIdentity = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }): Promise<PlatformIdentity> => {
 const { data, error } = await context.supabase.rpc('platform_identity');
 if (error) throw new Error('Não foi possível consultar seu acesso. Tente novamente.');
 const result = identitySchema.parse(data);
 return { ...result, name: result.name ?? '', organizations: result.organizations.map(org => ({ ...org, roles: org.roles ?? [] })) };
});
export const createOrganization = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ name: z.string().trim().min(2).max(160), plan: z.enum(['team15','team30','team60','team100']) })).handler(async ({ data, context }) => {
 const { data: id, error } = await context.supabase.rpc('create_organization', { org_name: data.name, catalog_plan: data.plan });
 if (error) throw new Error('Não foi possível criar a imobiliária. Verifique suas permissões e o plano.');
 return { id };
});
export const acceptInvitation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) })).handler(async ({ data, context }) => {
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data.token));
 const hashedToken = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
 const { data: organizationId, error } = await context.supabase.rpc('accept_invitation', { hashed_token: hashedToken });
 if (error) throw new Error('Convite inválido, expirado, já utilizado ou destinado a outro e-mail.');
 return { organizationId };
});
export const revokeInvitation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid() })).handler(async ({ data, context }) => {
 const { error } = await context.supabase.rpc('revoke_invitation', { invitation_id: data.id });
 if (error) throw new Error('Não foi possível revogar o convite.');
 return { revoked: true };
});
export const updateMembership = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), status: z.enum(['active','inactive']), roles: z.array(z.enum(['admin','broker'])).min(1) })).handler(async ({ data, context }) => {
 const { error } = await context.supabase.rpc('manage_membership', { member_id: data.id, desired_status: data.status, desired_roles: data.roles });
 if (error) throw new Error('Alteração não permitida. Verifique permissões, capacidade e administradores ativos.');
 return { updated: true };
});
// No sender is configured: no reservation, provisioning or fake delivery occurs.
export const sendInvitation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ organizationId: z.string().uuid(), email: z.email(), roles: z.array(z.enum(['admin','broker'])).min(1) })).handler(async ({ data, context }) => {
 const { data: allowed, error } = await context.supabase.rpc('org_admin', { org: data.organizationId });
 const { data: central } = await context.supabase.rpc('is_superadmin');
 if (error || (!allowed && !central)) throw new Error('Acesso não autorizado.');
 return { sent: false as const, reason: 'sender_not_configured' as const, message: 'O envio de convites depende da configuração do domínio remetente da Frankkia.' };
});