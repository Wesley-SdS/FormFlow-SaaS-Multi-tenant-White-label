import { cookies } from 'next/headers';

/**
 * Resolve tenantId do cookie httpOnly (definido no login) ou do header x-tenant-id.
 * API Route Handlers usam o cookie; Server Components podem usar ambos.
 */
export async function resolveTenantId(request?: Request): Promise<string | null> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('formflow_tenant_id')?.value ?? null;
  if (fromCookie) return fromCookie;

  if (request) {
    return request.headers.get('x-tenant-id');
  }

  return null;
}
