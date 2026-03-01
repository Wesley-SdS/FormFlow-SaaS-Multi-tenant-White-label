import type { IUserRepository, UserRecord } from '@/domain/user/IUserRepository';
import { prisma } from './prisma.client';

export class UserRepository implements IUserRepository {
  async createOrGetByEmail(email: string): Promise<UserRecord> {
    const user = await prisma.user.upsert({
      where: { email: email.trim().toLowerCase() },
      create: { email: email.trim().toLowerCase() },
      update: {},
    });
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
