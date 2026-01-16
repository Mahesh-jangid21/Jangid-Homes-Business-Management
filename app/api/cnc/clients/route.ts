import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { CNCClient } from '@/lib/models/cnc-shop'
import { cncClientSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '0') // 0 = no limit
        const search = searchParams.get('search') || ''
        const type = searchParams.get('type') || ''

        // Build query filter
        const filter: Record<string, unknown> = {}

        if (type && type !== 'all') {
            filter.type = type
        }

        if (search) {
            // Search by name or mobile (case-insensitive)
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } }
            ]
        }

        // If no pagination requested, return all (backward compatible)
        if (limit === 0) {
            const clients = await CNCClient.find(filter).sort({ createdAt: -1 })
            return NextResponse.json(clients)
        }

        // Paginated query
        const skip = (page - 1) * limit
        const [clients, total] = await Promise.all([
            CNCClient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            CNCClient.countDocuments(filter)
        ])

        return NextResponse.json({
            data: clients,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = cncClientSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            )
        }

        const client = await CNCClient.create(validation.data)
        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
}

