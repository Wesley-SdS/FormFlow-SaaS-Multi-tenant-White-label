import type { ISubdomainProvisioner } from '@/domain/tenant/ISubdomainProvisioner';

/**
 * Provisiona subdomínio {slug}.formflow.app via Vercel API.
 * Em dev sem VERCEL_TOKEN: no-op (não falha). Em produção exige token.
 */
export class VercelProvisioner implements ISubdomainProvisioner {
  private readonly baseHost: string;
  private readonly token: string | undefined;

  constructor() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    this.baseHost = appUrl ? new URL(appUrl).hostname : 'formflow.app';
    this.token = process.env.VERCEL_TOKEN;
  }

  async provision(slug: string): Promise<void> {
    if (!this.token) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('VERCEL_TOKEN is required in production to provision subdomains');
      }
      return;
    }

    const domain = `${slug}.${this.baseHost}`;
    const teamId = process.env.VERCEL_TEAM_ID;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (!projectId) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('VERCEL_PROJECT_ID is required to add domain alias');
      }
      return;
    }

    const url = teamId
      ? `https://api.vercel.com/v1/projects/${projectId}/domains?teamId=${teamId}`
      : `https://api.vercel.com/v1/projects/${projectId}/domains`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Vercel API failed: ${res.status} ${body}`);
    }
  }
}
