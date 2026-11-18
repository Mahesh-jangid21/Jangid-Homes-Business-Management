import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Purchase, Material } from '@/lib/models/cnc-shop'
import { purchaseSchema, formatValidationErrors } from '@/lib/validations'
import { logActivity } from '@/lib/audit-logger'

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

        // Validate input
        const validation = purchaseSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const purchase = await Purchase.create(validation.data)

        // Update material stock
        if (validation.data.materialId && validation.data.quantity) {
            await Material.findByIdAndUpdate(validation.data.materialId, {
                $inc: { currentStock: validation.data.quantity }
            })
        }

        logActivity({
            action: 'CREATE_PURCHASE',
            module: 'Purchases',
            description: `Recorded Purchase: ${validation.data.quantity} sheets from ${validation.data.supplier || 'Supplier'} (Total: ₹${validation.data.total})`,
            metadata: { supplier: validation.data.supplier, quantity: validation.data.quantity, totalAmount: validation.data.total }
        })

        return NextResponse.json(purchase, { status: 201 })
    } catch (error) {
        console.error('Error creating purchase:', error)
        return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 })
    }
}
