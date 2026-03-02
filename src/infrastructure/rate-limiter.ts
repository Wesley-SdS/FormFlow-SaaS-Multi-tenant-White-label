import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { rateLimitRedis?: Redis };

function getRedisClient(): Redis {
  if (!globalForRedis.rateLimitRedis) {
    globalForRedis.rateLimitRedis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
    });
  }
  return globalForRedis.rateLimitRedis;
}

/**
 * Sliding window rate limiter usando Redis INCR + EXPIRE.
 * Retorna { allowed: true } ou { allowed: false, retryAfter: seconds }.
 */
export async function checkRateLimit(params: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    const redis = getRedisClient();
    const current = await redis.incr(params.key);

    if (current === 1) {
      await redis.expire(params.key, params.windowSeconds);
    }

    if (current > params.limit) {
      const ttl = await redis.ttl(params.key);
      return { allowed: false, retryAfter: ttl > 0 ? ttl : params.windowSeconds };
    }

    return { allowed: true };
  } catch (err) {
    // Se Redis não estiver disponível, permite a requisição (fail-open)
    console.warn('[RateLimiter] Redis indisponível, permitindo requisição:', err);
    return { allowed: true };
  }
}

/**
 * Hash de IP para não armazenar PII.
 * Usa SHA-256 truncado para 16 chars.
 */
export async function hashIp(ip: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(ip).digest('hex').slice(0, 16);
}
