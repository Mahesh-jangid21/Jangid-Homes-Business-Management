import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Order, Material } from '@/lib/models/cnc-shop'
import { orderSchema } from '@/lib/validations'

// Generate unique order number server-side
async function generateOrderNumber(): Promise<string> {
    const date = new Date()
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`

    // Find the highest order number with this prefix
    const lastOrder = await Order.findOne(
        { orderNumber: { $regex: `^${prefix}` } },
        { orderNumber: 1 },
        { sort: { orderNumber: -1 } }
    )

    let count = 1
    if (lastOrder && lastOrder.orderNumber) {
        // Extract the number part after the dash and increment
        const parts = lastOrder.orderNumber.split('-')
        if (parts.length === 2) {
            const lastNum = parseInt(parts[1], 10)
            if (!isNaN(lastNum)) {
                count = lastNum + 1
            }
        }
    }

    return `${prefix}-${String(count).padStart(3, "0")}`
}

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

        const orderData = { ...validation.data };
        if (!orderData.deliveryDate) delete orderData.deliveryDate;

        // Generate unique order number server-side (ignore client-provided one)
        orderData.orderNumber = await generateOrderNumber()

        const order = await Order.create(orderData)

        // Deduct materials from inventory
        if (orderData.materials && Array.isArray(orderData.materials)) {
            for (const mat of orderData.materials) {
                if (mat.materialId && mat.quantity) {
                    await Material.findByIdAndUpdate(mat.materialId, {
                        $inc: { currentStock: -mat.quantity }
                    })
                }
            }
        }

        return NextResponse.json(order, { status: 201 })
    } catch (error: any) {
        console.error('Error creating order:', error)
        return NextResponse.json({
            error: 'Failed to create order',
            message: error.message,
            code: error.code || undefined
        }, { status: 500 })
    }
}

