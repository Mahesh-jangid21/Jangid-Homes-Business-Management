import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Wastage, Material } from '@/lib/models/cnc-shop'

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
        const wastage = await Wastage.create(body)

        // Deduct from material stock
        if (body.materialId && body.quantity) {
            await Material.findByIdAndUpdate(body.materialId, {
                $inc: { currentStock: -body.quantity }
            })
        }

        return NextResponse.json(wastage, { status: 201 })
    } catch (error) {
        console.error('Error creating wastage:', error)
        return NextResponse.json({ error: 'Failed to create wastage' }, { status: 500 })
    }
}
