import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { resolveTenant } from '@/lib/tenant-resolver';

const PUBLIC_PATHS = ['/', '/signup', '/login', '/api/signup', '/api/login'];

/**
 * Next.js 15: middleware.ts (em Next.js 16 renomear para proxy.ts e exportar função "proxy").
 * Resolve tenant pelo hostname e injeta x-tenant-id e x-tenant-slug nos headers.
 * Rotas públicas (signup) não exigem tenant.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const hostname = request.headers.get('host') ?? '';
  const tenant = await resolveTenant(hostname);

  if (!tenant) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  /*
   * Next.js 15 (edge middleware): response.headers.set() funciona para Server Components
   * (via headers() API), mas NÃO é encaminhado para Route Handlers.
   * Route Handlers usam o cookie `formflow_tenant_id` como fallback (ver /api/tenant/theme).
   */
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenant.id);
  response.headers.set('x-tenant-slug', tenant.slug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|404).*)'],
};
