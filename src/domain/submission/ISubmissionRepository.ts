import type { Submission } from './Submission.entity';

export interface CreateSubmissionDTO {
  id: string;
  tenantId: string;
  formId: string;
  formVersionId: string;
  data: Record<string, unknown>;
  ipHash?: string;
  userAgent?: string;
}

export interface ListSubmissionsOptions {
  tenantId: string;
  formId: string;
  cursor?: string;
  limit?: number;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ListSubmissionsResult {
  submissions: Submission[];
  nextCursor: string | null;
  total: number;
}

export interface SubmissionStats {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface ISubmissionRepository {
  create(dto: CreateSubmissionDTO): Promise<Submission>;
  findById(id: string, tenantId: string): Promise<Submission | null>;
  list(options: ListSubmissionsOptions): Promise<ListSubmissionsResult>;
  countByTenantThisMonth(tenantId: string): Promise<number>;
  getStats(tenantId: string): Promise<SubmissionStats>;
  getDailyCountsLast30Days(tenantId: string): Promise<DailyCount[]>;
  getMostActiveForms(
    tenantId: string,
    limit?: number
  ): Promise<{ formId: string; formTitle: string; count: number }[]>;
  listAllForExport(tenantId: string, formId: string): Promise<Submission[]>;
}
