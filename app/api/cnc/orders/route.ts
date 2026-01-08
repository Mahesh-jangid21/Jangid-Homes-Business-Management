import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Order, Material } from '@/lib/models/cnc-shop'
import { orderSchema } from '@/lib/validations'

export async function GET() {
    try {
        await dbConnect()
        const orders = await Order.find({}).sort({ date: -1 })
        return NextResponse.json(orders)
    } catch (error) {
        console.error('Error fetching orders:', error)
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = orderSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error.errors },
                { status: 400 }
            )
        }

        const order = await Order.create(validation.data)

        // Deduct materials from inventory
        if (validation.data.materials && Array.isArray(validation.data.materials)) {
            for (const mat of validation.data.materials) {
                if (mat.materialId && mat.quantity) {
                    await Material.findByIdAndUpdate(mat.materialId, {
                        $inc: { currentStock: -mat.quantity }
                    })
                }
            }
        }

        return NextResponse.json(order, { status: 201 })
    } catch (error) {
        console.error('Error creating order:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

