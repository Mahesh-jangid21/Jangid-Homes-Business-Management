import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/db/mongodb'
import { AuditLog } from '@/lib/models/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    // Strict access control: ONLY admin can view audit logs
    if (!session || userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin privileges required to view audit logs.' },
        { status: 403 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '20', 10)))
    const moduleFilter = searchParams.get('module') || ''
    const searchQuery = (searchParams.get('search') || '').trim()

    // Build optimized query filter
    const query: any = {}
    if (moduleFilter && moduleFilter !== 'all') {
      query.module = moduleFilter
    }
    if (searchQuery) {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      query.$or = [
        { description: regex },
        { userName: regex },
        { action: regex },
      ]
    }

    const skip = (page - 1) * limit

    // Run count & lean fetch in parallel for lowest latency & memory usage
    const [totalCount, rawLogs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('_id action module description userName userEmail userRole metadata createdAt')
        .lean(),
    ])

    const totalPages = Math.ceil(totalCount / limit) || 1

    const response = NextResponse.json(
      {
        logs: rawLogs,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
      { status: 200 }
    )

    // Security & bandwidth headers
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    return response
  } catch (error: any) {
    console.error('Audit logs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
