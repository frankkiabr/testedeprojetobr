import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';

export const platformOrganization = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ organizationId: z.string().uuid() })).handler(async ({ data, context }) => {
 const { data: organization, error } = await context.supabase.from('organizations').select('id,name,status').eq('id',data.organizationId).eq('status','active').maybeSingle();
 if (error) throw new Error('Não foi possível consultar a imobiliária.');
 return organization;
});