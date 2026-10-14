import { queryOptions } from '@tanstack/react-query';
import { platformIdentity } from './platform.functions';

export interface OrganizationAccess { id: string; name: string; roles: string[] }
export interface PlatformIdentity { id: string; email: string; name: string; superadmin: boolean; organizations: OrganizationAccess[] }
export const identityQuery = queryOptions({ queryKey: ['platform', 'identity'], queryFn: () => platformIdentity(), staleTime: 0 });
export function privateHead(title: string, description: string) {
 return { meta: [{ title: `${title} | Frankkia` }, { name: 'description', content: description }, { property: 'og:title', content: `${title} | Frankkia` }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' }, { name: 'robots', content: 'noindex,nofollow' }] };
}