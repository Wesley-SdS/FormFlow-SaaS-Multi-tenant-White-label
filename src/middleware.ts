import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/tenant-resolver';

/**
 * Next.js 15: middleware.ts (em Next.js 16 renomear para proxy.ts e exportar função "proxy").
 * Resolve tenant pelo hostname e injeta x-tenant-id e x-tenant-slug nos headers.
 * Em Edge só usa Redis; em dev com localhost use DEV_TENANT_ID e DEV_TENANT_SLUG no .env.
 */
export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';
  const tenant = await resolveTenant(hostname);

  if (!tenant) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|404).*)'],
};
