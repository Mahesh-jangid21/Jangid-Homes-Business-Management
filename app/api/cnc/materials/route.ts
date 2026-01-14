import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Material } from '@/lib/models/cnc-shop'
import { materialSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '0') // 0 = no limit
        const type = searchParams.get('type') || ''
        const lowStock = searchParams.get('lowStock') === 'true'

        // Build query filter
        const filter: Record<string, unknown> = {}

        if (type && type !== 'all') {
            filter.type = type
        }

        if (lowStock) {
            // Find materials where currentStock <= lowStockAlert
            filter.$expr = { $lte: ['$currentStock', '$lowStockAlert'] }
        }

        // If no pagination requested, return all (backward compatible)
        if (limit === 0) {
            const materials = await Material.find(filter).sort({ createdAt: -1 })
            return NextResponse.json(materials)
        }

        // Paginated query
        const skip = (page - 1) * limit
        const [materials, total] = await Promise.all([
            Material.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Material.countDocuments(filter)
        ])

        return NextResponse.json({
            data: materials,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching materials:', error)
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = materialSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            )
        }

        const material = await Material.create(validation.data)
        return NextResponse.json(material, { status: 201 })
    } catch (error) {
        console.error('Error creating material:', error)
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
    }
}

