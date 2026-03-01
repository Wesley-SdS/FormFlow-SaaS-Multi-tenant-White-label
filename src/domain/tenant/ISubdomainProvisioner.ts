/**
 * Abstração do provisionador de subdomínio (ex: Vercel API).
 * Encapsulado para testabilidade — mock em testes unitários.
 */

export interface ISubdomainProvisioner {
  provision(slug: string): Promise<void>;
}
