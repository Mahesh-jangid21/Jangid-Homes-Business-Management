import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Order, Material } from '@/lib/models/cnc-shop'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const order = await Order.findById(id)
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        return NextResponse.json(order)
    } catch (error) {
        console.error('Error fetching order:', error)
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const body = await request.json()

        // Get current order to check values
        const existingOrder = await Order.findById(id)
        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Server-side calculation: if payments are being updated, recalculate balance
        if (body.payments !== undefined || body.advanceReceived !== undefined) {
            const totalValue = body.totalValue ?? existingOrder.totalValue ?? 0
            const advanceReceived = body.advanceReceived ?? existingOrder.advanceReceived ?? 0

            // Recalculate balance on server to ensure integrity
            body.balanceAmount = Math.max(0, totalValue - advanceReceived)
        }

        // Validate: payment shouldn't exceed total value
        if (body.advanceReceived !== undefined && body.advanceReceived > (existingOrder.totalValue || 0)) {
            return NextResponse.json({ error: 'Payment cannot exceed total value' }, { status: 400 })
        }

        const order = await Order.findByIdAndUpdate(id, body, { new: true })
        return NextResponse.json(order)
    } catch (error) {
        console.error('Error updating order:', error)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params

        // Get order first to restore materials
        const order = await Order.findById(id)
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Restore materials to inventory before deleting
        if (order.materials && Array.isArray(order.materials)) {
            for (const mat of order.materials) {
                if (mat.materialId && mat.quantity) {
                    await Material.findByIdAndUpdate(mat.materialId, {
                        $inc: { currentStock: mat.quantity } // Add back to stock
                    })
                }
            }
        }

        // Now delete the order
        await Order.findByIdAndDelete(id)

        return NextResponse.json({ message: 'Order deleted successfully, materials restored to stock' })
    } catch (error) {
        console.error('Error deleting order:', error)
        return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 })
    }
}

