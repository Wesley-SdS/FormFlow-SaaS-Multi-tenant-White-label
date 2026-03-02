import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client';
import { withTenantContext } from './withTenantContext';
import { Submission } from '@/domain/submission/Submission.entity';
import type {
  ISubmissionRepository,
  CreateSubmissionDTO,
  ListSubmissionsOptions,
  ListSubmissionsResult,
  SubmissionStats,
  DailyCount,
} from '@/domain/submission/ISubmissionRepository';

function mapToSubmission(row: {
  id: string;
  tenantId: string;
  formId: string;
  formVersionId: string;
  data: unknown;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: Date;
}): Submission {
  return Submission.reconstitute({
    id: row.id,
    tenantId: row.tenantId,
    formId: row.formId,
    formVersionId: row.formVersionId,
    data: (row.data as Record<string, unknown>) ?? {},
    ipHash: row.ipHash,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  });
}

export class SubmissionRepository implements ISubmissionRepository {
  async create(dto: CreateSubmissionDTO): Promise<Submission> {
    const row = await withTenantContext(dto.tenantId, (tx) =>
      tx.submission.create({
        data: {
          id: dto.id,
          tenantId: dto.tenantId,
          formId: dto.formId,
          formVersionId: dto.formVersionId,
          data: dto.data as unknown as Prisma.InputJsonValue,
          ipHash: dto.ipHash ?? null,
          userAgent: dto.userAgent ?? null,
        },
      })
    );
    return mapToSubmission(row);
  }

  async findById(id: string, tenantId: string): Promise<Submission | null> {
    const row = await withTenantContext(tenantId, (tx) =>
      tx.submission.findUnique({ where: { id } })
    );
    return row ? mapToSubmission(row) : null;
  }

  async list(options: ListSubmissionsOptions): Promise<ListSubmissionsResult> {
    const limit = options.limit ?? 25;

    const where: Prisma.SubmissionWhereInput = {
      tenantId: options.tenantId,
      formId: options.formId,
      ...(options.dateFrom || options.dateTo
        ? {
            createdAt: {
              ...(options.dateFrom && { gte: options.dateFrom }),
              ...(options.dateTo && { lte: options.dateTo }),
            },
          }
        : {}),
    };

    const [total, rows] = await withTenantContext(options.tenantId, async (tx) => {
      const countResult = await tx.submission.count({ where });
      const submissionsResult = await tx.submission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
        ...(options.cursor && { cursor: { id: options.cursor }, skip: 1 }),
      });
      return [countResult, submissionsResult] as const;
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null;

    return {
      submissions: items.map(mapToSubmission),
      nextCursor,
      total,
    };
  }

  async countByTenantThisMonth(tenantId: string): Promise<number> {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    return withTenantContext(tenantId, (tx) =>
      tx.submission.count({
        where: { tenantId, createdAt: { gte: start } },
      })
    );
  }

  async getStats(tenantId: string): Promise<SubmissionStats> {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, thisWeek, thisMonth, total] = await withTenantContext(tenantId, async (tx) => {
      const [t, w, m, tot] = await Promise.all([
        tx.submission.count({ where: { tenantId, createdAt: { gte: todayStart } } }),
        tx.submission.count({ where: { tenantId, createdAt: { gte: weekStart } } }),
        tx.submission.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
        tx.submission.count({ where: { tenantId } }),
      ]);
      return [t, w, m, tot] as const;
    });

    return { today, thisWeek, thisMonth, total };
  }

  async getDailyCountsLast30Days(tenantId: string): Promise<DailyCount[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Raw query para agrupamento por dia — mais eficiente que multiple queries
    const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
        COUNT(*)::bigint AS count
      FROM submissions
      WHERE tenant_id = ${tenantId}::uuid
        AND created_at >= ${thirtyDaysAgo}
      GROUP BY date
      ORDER BY date ASC
    `;

    return rows.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  async getMostActiveForms(
    tenantId: string,
    limit = 5
  ): Promise<{ formId: string; formTitle: string; count: number }[]> {
    const rows = await prisma.$queryRaw<{ form_id: string; form_title: string; count: bigint }[]>`
      SELECT
        s.form_id,
        f.title AS form_title,
        COUNT(*)::bigint AS count
      FROM submissions s
      JOIN forms f ON f.id = s.form_id
      WHERE s.tenant_id = ${tenantId}::uuid
      GROUP BY s.form_id, f.title
      ORDER BY count DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => ({
      formId: r.form_id,
      formTitle: r.form_title,
      count: Number(r.count),
    }));
  }

  async listAllForExport(tenantId: string, formId: string): Promise<Submission[]> {
    const rows = await withTenantContext(tenantId, (tx) =>
      tx.submission.findMany({
        where: { tenantId, formId },
        orderBy: { createdAt: 'desc' },
      })
    );
    return rows.map(mapToSubmission);
  }
}
