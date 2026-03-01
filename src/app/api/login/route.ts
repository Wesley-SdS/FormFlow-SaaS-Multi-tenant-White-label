import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/infrastructure/db/prisma.client';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

/**
 * POST /api/login — autenticação básica (Sprint 2 stub).
 * Sprint 5: integrar Supabase Auth + JWT com tenant_id e role.
 * Por agora: valida que o usuário existe e retorna o subdomínio para redirect.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json({ error: 'Dados inválidos', fields }, { status: 422 });
  }

  const { email } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true,
      email: true,
      tenantMembers: {
        select: {
          role: true,
          tenant: {
            select: { id: true, slug: true, onboardingDoneAt: true },
          },
        },
        take: 1,
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos' }, { status: 401 });
  }

  const membership = user.tenantMembers[0];
  if (!membership) {
    return NextResponse.json({ error: 'Usuário não vinculado a nenhum tenant' }, { status: 401 });
  }

  const tenant = membership.tenant;
  const isOnboardingDone = tenant.onboardingDoneAt != null;
  const redirectTo = isOnboardingDone ? '/dashboard' : '/onboarding';

  const res = NextResponse.json({
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    redirectTo,
  });

  // Persiste o tenant ID em cookie httpOnly para que Route Handlers de API
  // (theme, onboarding) consigam identificar o tenant sem depender do header
  // x-tenant-id (que só é acessível em Server Components via headers()).
  res.cookies.set('formflow_tenant_id', tenant.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });

  return res;
}
