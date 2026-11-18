import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/db/mongodb'
import { AuditLog, type AuditModule } from '@/lib/models/audit-log'

export interface LogParams {
  action: string
  module: AuditModule
  description: string
  metadata?: Record<string, any>
  session?: any
}

/**
 * Sanitizes metadata to keep document size and Vercel payload small.
 * Only retains scalar primitives or short summaries.
 */
function sanitizeMetadata(meta: Record<string, any>): Record<string, any> {
  const clean: Record<string, any> = {}
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue
    if (typeof v === 'string') {
      clean[k] = v.slice(0, 120)
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      clean[k] = v
    } else if (Array.isArray(v)) {
      clean[k] = `${v.length} items`
    } else if (typeof v === 'object') {
      clean[k] = '[Details]'
    }
  }
  return clean
}

/**
 * Records an activity log entry without disrupting or slowing down user flow.
 */
export async function logActivity(params: LogParams): Promise<void> {
  try {
    await dbConnect()
    let session = params.session
    if (!session) {
      session = await getServerSession(authOptions).catch(() => null)
    }

    const userName = session?.user?.name || 'System / Anonymous'
    const userEmail = session?.user?.email || ''
    const userRole = (session?.user as any)?.role || 'unknown'
    const userId = (session?.user as any)?.id || null

    await AuditLog.create({
      action: params.action,
      module: params.module,
      description: params.description.slice(0, 500),
      userName,
      userEmail,
      userRole,
      userId,
      metadata: params.metadata ? sanitizeMetadata(params.metadata) : undefined,
    })
  } catch (error) {
    // Non-blocking: audit logs must never throw to user
    console.error('AuditLog Error:', error)
  }
}
