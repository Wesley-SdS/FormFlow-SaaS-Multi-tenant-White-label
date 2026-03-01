import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createProvisionTenantUseCase, userRepo } from '@/application/tenant/use-case-factory';
import { SlugInvalidError, SlugAlreadyExistsError } from '@/domain/shared/DomainError';

const signupSchema = z.object({
  name: z.string().min(1, 'Nome da empresa é obrigatório').max(200),
  slug: z
    .string()
    .min(2, 'Slug deve ter no mínimo 2 caracteres')
    .max(63)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/,
      'Slug: apenas letras minúsculas, números e hífens'
    ),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export type SignupBody = z.infer<typeof signupSchema>;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido', fields: [] }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return NextResponse.json({ error: 'Validação falhou', fields }, { status: 422 });
  }

  const { name, slug, email } = parsed.data;

  const user = await userRepo.createOrGetByEmail(email);
  const useCase = createProvisionTenantUseCase();
  const result = await useCase.execute({
    name: name.trim(),
    slug: slug.trim().toLowerCase(),
    userId: user.id,
  });

  if (result.isFailure) {
    if (result.error instanceof SlugInvalidError) {
      return NextResponse.json(
        { error: result.error.message, fields: [{ field: 'slug', message: result.error.message }] },
        { status: 422 }
      );
    }
    if (result.error instanceof SlugAlreadyExistsError) {
      return NextResponse.json(
        { error: result.error.message, fields: [{ field: 'slug', message: result.error.message }] },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: (result as { error: Error }).error.message },
      { status: 500 }
    );
  }

  const tenant = result.value;

  const response = NextResponse.json(
    {
      tenantId: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      message: 'Tenant criado. Acesse seu subdomínio para continuar o onboarding.',
    },
    { status: 201 }
  );

  // Cookie de sessão temporária para o onboarding no mesmo host (ex.: localhost).
  // Em produção o middleware resolve pelo subdomínio; aqui garante tenant correto no wizard.
  response.cookies.set('formflow_tenant_id', tenant.id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  });

  return response;
}
