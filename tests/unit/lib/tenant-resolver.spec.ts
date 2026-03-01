import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('resolveTenant', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    delete process.env.NEXT_RUNTIME;
  });

  it('retorna tenant de dev quando hostname é localhost e DEV_TENANT_ID/SLUG estão definidos', async () => {
    process.env.DEV_TENANT_ID = 'tenant-uuid-1';
    process.env.DEV_TENANT_SLUG = 'tenant-a';
    const { resolveTenant } = await import('@/lib/tenant-resolver');
    const result = await resolveTenant('localhost:3000');
    expect(result).toEqual({ id: 'tenant-uuid-1', slug: 'tenant-a' });
  });

  it('retorna null quando hostname é localhost mas DEV_TENANT_ID não está definido (Edge)', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    delete process.env.DEV_TENANT_ID;
    delete process.env.DEV_TENANT_SLUG;
    const { resolveTenant } = await import('@/lib/tenant-resolver');
    const result = await resolveTenant('localhost:3000');
    expect(result).toBeNull();
  });
});
