/**
 * Guard de permissões por role (Sprint 1 stub).
 * Sprint 5+: requirePermission(role, action, resource), matriz Owner/Admin/Editor/Viewer.
 */

export type Role = 'owner' | 'admin' | 'editor' | 'viewer';
export type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'export';
export type Resource = 'form' | 'submission' | 'member' | 'billing' | 'theme' | 'apikey';

export function requirePermission(_role: Role, _action: Action, _resource: Resource): void {
  // Sprint 5: implementar matriz e lançar ForbiddenError quando não permitido
}
