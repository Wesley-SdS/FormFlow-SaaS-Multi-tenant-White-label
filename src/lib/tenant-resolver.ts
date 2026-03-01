export type ResolvedTenant = {
  id: string;
  slug: string;
};

const TENANT_CACHE_TTL_SECONDS = 300; // 5 min

const isEdge = typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge';

/**
 * Resolve tenant por hostname (subdomínio ou custom domain).
 * No Edge (middleware): apenas dev tenant em localhost (Redis/Prisma não disponíveis no Edge).
 * Em Node: Redis + fallback no banco; em dev com localhost usa DEV_TENANT_ID/DEV_TENANT_SLUG.
 */
export async function resolveTenant(hostname: string): Promise<ResolvedTenant | null> {
  if (hostname.includes('localhost') && process.env.DEV_TENANT_ID && process.env.DEV_TENANT_SLUG) {
    return {
      id: process.env.DEV_TENANT_ID,
      slug: process.env.DEV_TENANT_SLUG,
    };
  }

  if (isEdge) return null;

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    const cached = await getTenantFromRedis(redisUrl, hostname);
    if (cached) return cached;
  }

  const tenant = await getTenantFromDb(hostname);
  if (tenant && redisUrl) {
    await setTenantInRedis(redisUrl, hostname, tenant, TENANT_CACHE_TTL_SECONDS);
  }
  return tenant;
}

async function getTenantFromRedis(
  redisUrl: string,
  hostname: string
): Promise<ResolvedTenant | null> {
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(redisUrl);
    const key = `tenant:hostname:${hostname}`;
    const data = await redis.get(key);
    redis.quit();
    if (!data) return null;
    return JSON.parse(data) as ResolvedTenant;
  } catch {
    return null;
  }
}

async function setTenantInRedis(
  redisUrl: string,
  hostname: string,
  tenant: ResolvedTenant,
  ttl: number
): Promise<void> {
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(redisUrl);
    const key = `tenant:hostname:${hostname}`;
    await redis.setex(key, ttl, JSON.stringify(tenant));
    redis.quit();
  } catch {
    // ignore cache write errors
  }
}

async function getTenantFromDb(hostname: string): Promise<ResolvedTenant | null> {
  try {
    const { prisma } = await import('@/infrastructure/db/prisma.client');
    const slug = extractSlugFromHostname(hostname);
    if (!slug) return null;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    return tenant;
  } catch {
    return null;
  }
}

function extractSlugFromHostname(hostname: string): string | null {
  const baseHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : 'localhost';
  if (hostname === baseHost) return null;
  if (hostname.endsWith(`.${baseHost}`)) {
    return hostname.replace(`.${baseHost}`, '').toLowerCase();
  }
  return hostname.split('.')[0]?.toLowerCase() ?? null;
}

/**
 * Invalida cache Redis do tenant pelo slug (ex.: após atualizar tema ou domínio).
 * Chamado por UpdateThemeUseCase e quando tenant atualiza custom domain.
 */
export async function invalidateTenantCacheBySlug(slug: string): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;

  const baseHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : 'formflow.app';
  const hostname = `${slug}.${baseHost}`;
  const key = `tenant:hostname:${hostname}`;

  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(redisUrl);
    await redis.del(key);
    redis.quit();
  } catch {
    // ignore cache invalidation errors
  }
}
