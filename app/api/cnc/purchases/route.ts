import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Purchase, Material } from '@/lib/models/cnc-shop'

export async function GET() {
    try {
        await dbConnect()
        const purchases = await Purchase.find({}).sort({ date: -1 })
        return NextResponse.json(purchases)
    } catch (error) {
        console.error('Error fetching purchases:', error)
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()
        const purchase = await Purchase.create(body)

        // Update material stock
        if (body.materialId && body.quantity) {
            await Material.findByIdAndUpdate(body.materialId, {
                $inc: { currentStock: body.quantity }
            })
        }

        return NextResponse.json(purchase, { status: 201 })
    } catch (error) {
        console.error('Error creating purchase:', error)
        return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }
}
