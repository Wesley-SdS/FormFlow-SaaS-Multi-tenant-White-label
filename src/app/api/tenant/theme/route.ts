import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { TenantRepository } from '@/infrastructure/db/tenant.repository';

const tenantRepo = new TenantRepository();

const themeSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  fontFamily: z.enum(['sans', 'serif', 'mono']).optional(),
  borderRadius: z.enum(['sm', 'md', 'lg']).optional(),
  logoUrl: z.string().url().nullable().optional(),
  faviconUrl: z.string().url().nullable().optional(),
});

/**
 * Resolve tenantId do cookie (signup/login) ou do header x-tenant-id.
 * Em produção com subdomínio, o middleware injeta x-tenant-id via response headers
 * (acessível em Server Components via headers()), mas Route Handlers usam o cookie.
 */
async function resolveTenantId(request: Request): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('formflow_tenant_id')?.value ?? request.headers.get('x-tenant-id');
}

export async function GET(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não identificado' }, { status: 401 });
  }

  const tenant = await tenantRepo.findById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    theme: {
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      fontFamily: tenant.fontFamily,
      borderRadius: tenant.borderRadius,
      logoUrl: tenant.logoUrl,
      faviconUrl: tenant.faviconUrl,
    },
  });
}

export async function PATCH(request: Request) {
  const tenantId = await resolveTenantId(request);
  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não identificado' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = themeSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json({ error: 'Validação falhou', fields }, { status: 422 });
  }

  const tenant = await tenantRepo.findById(tenantId);
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 });
  }

  const updated = await tenantRepo.updateTheme(tenantId, {
    primaryColor: parsed.data.primaryColor,
    secondaryColor: parsed.data.secondaryColor,
    fontFamily: parsed.data.fontFamily,
    borderRadius: parsed.data.borderRadius,
    logoUrl: parsed.data.logoUrl,
    faviconUrl: parsed.data.faviconUrl,
  });

  return NextResponse.json({
    theme: {
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
      fontFamily: updated.fontFamily,
      borderRadius: updated.borderRadius,
      logoUrl: updated.logoUrl,
      faviconUrl: updated.faviconUrl,
    },
  });
}
