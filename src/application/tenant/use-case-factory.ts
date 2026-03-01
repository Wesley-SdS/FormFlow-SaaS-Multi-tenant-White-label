import { ProvisionTenantUseCase } from './ProvisionTenantUseCase';
import { UpdateThemeUseCase } from './UpdateThemeUseCase';
import { TenantRepository } from '@/infrastructure/db/tenant.repository';
import { MemberRepository } from '@/infrastructure/db/member.repository';
import { UserRepository } from '@/infrastructure/db/user.repository';
import { VercelProvisioner } from '@/infrastructure/vercel/vercel.provisioner';
import { TrialBillingService } from '@/infrastructure/billing/trial-billing.service';
import { invalidateTenantCacheBySlug } from '@/lib/tenant-resolver';

const tenantRepo = new TenantRepository();
const memberRepo = new MemberRepository();
const userRepo = new UserRepository();
const provisioner = new VercelProvisioner();
const billing = new TrialBillingService();

export function createProvisionTenantUseCase(): ProvisionTenantUseCase {
  return new ProvisionTenantUseCase(tenantRepo, memberRepo, provisioner, billing);
}

export function createUpdateThemeUseCase(): UpdateThemeUseCase {
  return new UpdateThemeUseCase(tenantRepo, invalidateTenantCacheBySlug);
}

export { userRepo };
