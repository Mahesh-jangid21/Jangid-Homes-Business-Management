import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Order, Material, CNCClient } from '@/lib/models/cnc-shop'
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

export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '0') // 0 means no limit (backward compatible)
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const month = searchParams.get('month')
        const year = searchParams.get('year')

        // Build query filter
        const filter: Record<string, unknown> = {}

        if (status && status !== 'all') {
            filter.status = status
        }

        if (search) {
            // Search by order number (case-insensitive partial match)
            filter.orderNumber = { $regex: search, $options: 'i' }
        }

        // Filter by month/year if provided
        if (month && year) {
            const monthNum = parseInt(month)
            const yearNum = parseInt(year)
            // Start of month (first day, 00:00:00)
            const startDate = new Date(yearNum, monthNum - 1, 1)
            // End of month (last day, 23:59:59)
            const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999)
            filter.date = {
                $gte: startDate.toISOString(),
                $lte: endDate.toISOString()
            }
        }

        // If no pagination requested, return all (backward compatible)
        if (limit === 0) {
            const orders = await Order.find(filter).sort({ date: -1 })
            return NextResponse.json(orders)
        }

        // Paginated query
        const skip = (page - 1) * limit
        const [orders, total] = await Promise.all([
            Order.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
            Order.countDocuments(filter)
        ])

        return NextResponse.json({
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
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

        // Fetch client data and create snapshot
        const client = await CNCClient.findById(orderData.clientId)
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 400 })
        }
        orderData.clientSnapshot = {
            name: client.name,
            mobile: client.mobile,
            type: client.type || 'Individual',
            address: client.address || ''
        }

        // Fetch material data and create snapshots for each material
        if (orderData.materials && Array.isArray(orderData.materials)) {
            for (const mat of orderData.materials) {
                if (mat.materialId) {
                    const material = await Material.findById(mat.materialId)
                    if (material) {
                        mat.materialSnapshot = {
                            type: material.type,
                            size: material.size,
                            thickness: material.thickness
                        }
                    }
                }
            }
        }

        // Server-side validation: ensure balance is correctly calculated
        const totalValue = orderData.totalValue || 0
        const advanceReceived = orderData.advanceReceived || 0

        // Validate: advance shouldn't exceed total
        if (advanceReceived > totalValue) {
            return NextResponse.json({ error: 'Advance cannot exceed total value' }, { status: 400 })
        }

        // Recalculate balance server-side for integrity
        orderData.balanceAmount = Math.max(0, totalValue - advanceReceived)

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
    } catch (error: unknown) {
        console.error('Error creating order:', error)
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }
}

