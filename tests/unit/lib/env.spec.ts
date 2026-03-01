import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('env validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('deve lançar erro descritivo quando DATABASE_URL está ausente', async () => {
    delete process.env.DATABASE_URL;
    const { getEnv } = await import('@/lib/env');
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it('deve lançar erro quando DATABASE_URL não é URL válida', async () => {
    process.env.DATABASE_URL = 'not-a-url';
    const { getEnv } = await import('@/lib/env');
    expect(() => getEnv()).toThrow();
  });

  it('deve retornar env quando DATABASE_URL é válida', async () => {
    process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db';
    const { getEnv } = await import('@/lib/env');
    const env = getEnv();
    expect(env.DATABASE_URL).toBe('postgresql://u:p@localhost:5432/db');
    expect(env.NODE_ENV).toBeDefined();
  });
});
