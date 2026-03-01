/**
 * Abstração para criação/consulta de usuários (signup).
 * Implementação em infrastructure/db/user.repository.ts
 */

export interface UserRecord {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRepository {
  createOrGetByEmail(email: string): Promise<UserRecord>;
}
