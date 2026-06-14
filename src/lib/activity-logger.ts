import { db } from '@/lib/db';
import { activityLogs } from '@/lib/db/schema';
import type { NextRequest } from 'next/server';

type ActivityAction = 'login' | 'logout' | 'create' | 'update' | 'delete' | 'search' | 'export' | 'view';
type EntityType = 'shipment' | 'user' | 'report' | 'auth' | 'system' | 'airplane';

interface LogActivityParams {
  userId: string;
  userName: string;
  userRole: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
  request?: NextRequest;
}

export async function logActivity({
  userId,
  userName,
  userRole,
  action,
  entityType,
  entityId,
  details,
  request,
}: LogActivityParams) {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') ||
                      request?.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request?.headers.get('user-agent') || 'unknown';

    await db.insert(activityLogs).values({
      userId,
      userName,
      userRole,
      action,
      entityType,
      entityId,
      details: details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}
