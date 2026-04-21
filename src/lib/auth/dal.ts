import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { getSessionUser } from './session';

export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const token = jar.get('terminal_session')?.value;
  if (!token) return null;
  return getSessionUser(token);
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user || !user.isActive) throw new Error('Unauthorized');
  return user;
}

export async function requireRole(minRole: 'admin' | 'operator' | 'viewer') {
  const user = await requireAuth();
  const rank = { admin: 3, operator: 2, viewer: 1 } as const;
  if (rank[user.role] < rank[minRole]) throw new Error('Forbidden');
  return user;
}
