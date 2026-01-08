import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Wastage, Material } from '@/lib/models/cnc-shop'
import { wastageSchema, formatValidationErrors } from '@/lib/validations'

export async function GET() {
    try {
        await dbConnect()
        const wastages = await Wastage.find({}).sort({ date: -1 })
        return NextResponse.json(wastages)
    } catch (error) {
        console.error('Error fetching wastages:', error)
        return NextResponse.json({ error: 'Failed to fetch wastages' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = wastageSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const wastage = await Wastage.create(validation.data)

        // Deduct from material stock
        if (validation.data.materialId && validation.data.quantity) {
            await Material.findByIdAndUpdate(validation.data.materialId, {
                $inc: { currentStock: -validation.data.quantity }
            })
        }

        return NextResponse.json(wastage, { status: 201 })
    } catch (error) {
        console.error('Error creating wastage:', error)
        return NextResponse.json({ error: 'Failed to create wastage' }, { status: 500 })
    }
}
