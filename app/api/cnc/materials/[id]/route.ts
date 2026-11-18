import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Material } from '@/lib/models/cnc-shop'
import { logActivity } from '@/lib/audit-logger'

/**
 * @swagger
 * /api/cnc/materials/{id}:
 *   get:
 *     tags:
 *       - Materials
 *     summary: Get material by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const material = await Material.findById(id)
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 })
        }
        return NextResponse.json(material)
    } catch (error) {
        console.error('Error fetching material:', error)
        return NextResponse.json({ error: 'Failed to fetch material' }, { status: 500 })
    }
}

/**
 * @swagger
 * /api/cnc/materials/{id}:
 *   put:
 *     tags:
 *       - Materials
 *     summary: Update material
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const body = await request.json()
        const material = await Material.findByIdAndUpdate(id, body, { new: true })
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 })
        }

        logActivity({
            action: 'UPDATE_MATERIAL',
            module: 'Inventory',
            description: `Updated Material: ${material.type} - ${material.size} (${material.thickness}mm) • Current Stock: ${material.currentStock}`,
            metadata: { type: material.type, size: material.size, thickness: material.thickness, stock: material.currentStock, rate: material.rate }
        })

        return NextResponse.json(material)
    } catch (error) {
        console.error('Error updating material:', error)
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
    }
}

/**
 * @swagger
 * /api/cnc/materials/{id}:
 *   delete:
 *     tags:
 *       - Materials
 *     summary: Delete material
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const material = await Material.findByIdAndDelete(id)
        if (!material) {
            return NextResponse.json({ error: 'Material not found' }, { status: 404 })
        }

        logActivity({
            action: 'DELETE_MATERIAL',
            module: 'Inventory',
            description: `Deleted Material: ${material.type} - ${material.size} (${material.thickness}mm)`,
            metadata: { type: material.type, size: material.size, thickness: material.thickness }
        })

        return NextResponse.json({ message: 'Material deleted successfully' })
    } catch (error) {
        console.error('Error deleting material:', error)
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
    }
}
