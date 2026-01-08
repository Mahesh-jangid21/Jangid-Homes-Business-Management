import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { StockAdjustment, Material } from '@/lib/models/cnc-shop'
import { stockAdjustmentSchema, formatValidationErrors } from '@/lib/validations'

export async function GET() {
    try {
        await dbConnect()
        const adjustments = await StockAdjustment.find({}).sort({ createdAt: -1 })
        return NextResponse.json(adjustments)
    } catch (error) {
        console.error('Error fetching adjustments:', error)
        return NextResponse.json({ error: 'Failed to fetch adjustments' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = stockAdjustmentSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const { materialId, newStock, reason, date } = validation.data

        // Find material to get current stock
        const material = await Material.findById(materialId)
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 })
        }

        const previousStock = material.currentStock
        const adjustmentAmount = newStock - previousStock

        // Create adjustment record
        const adjustment = await StockAdjustment.create({
            materialId,
            date,
            previousStock,
            newStock,
            adjustment: adjustmentAmount,
            reason: reason || 'Manual Stock Audit'
        })

        // Update material stock
        material.currentStock = newStock
        await material.save()

        return NextResponse.json(adjustment, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating adjustment:', error)
        const message = error instanceof Error ? error.message : 'Failed to create adjustment'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
