import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/db/mongodb'
import { Order, Material, CNCClient, Wastage } from '@/lib/models/cnc-shop'
import { orderSchema } from '@/lib/validations'
import { logActivity } from '@/lib/audit-logger'

function parseSheetArea(sizeStr?: string): number {
    if (!sizeStr) return 32
    const parts = sizeStr.toLowerCase().split('x')
    if (parts.length === 2) {
        const w = parseFloat(parts[0])
        const h = parseFloat(parts[1])
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return w * h
    }
    return 32
}

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

    let candidate = `${prefix}-${String(count).padStart(3, "0")}`
    while (await Order.exists({ orderNumber: candidate })) {
        count++
        candidate = `${prefix}-${String(count).padStart(3, "0")}`
    }

    return candidate
}

/**
 * @swagger
 * /api/cnc/orders:
 *   get:
 *     tags:
 *       - Orders
 *     summary: Get orders
 *     responses:
 *       200:
 *         description: Success
 */
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

/**
 * @swagger
 * /api/cnc/orders:
 *   post:
 *     tags:
 *       - Orders
 *     summary: Create order
 *     responses:
 *       200:
 *         description: Success
 */
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
        if (!mongoose.Types.ObjectId.isValid(orderData.clientId)) {
            return NextResponse.json({ error: 'Invalid client ID selected' }, { status: 400 })
        }
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
                // If client material or no valid ID, ensure materialId is completely removed to avoid Mongoose CastError on ObjectId
                if (mat.isClientMaterial || !mat.materialId || !mongoose.Types.ObjectId.isValid(mat.materialId)) {
                    delete mat.materialId
                    continue
                }

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

        // Clean up payments array
        if (orderData.payments && Array.isArray(orderData.payments)) {
            for (const p of orderData.payments) {
                if (!p.account) {
                    delete p.account
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

        // Process inventory deductions and custom size wastage logging
        if (orderData.materials && Array.isArray(orderData.materials)) {
            for (const mat of orderData.materials) {
                // If material is provided by client OR is only wastage/scrap material, do not deduct full sheet stock and do not log wastage
                if (mat.isClientMaterial || mat.materialUsageType === 'wastage_only') {
                    continue
                }

                // If material is full sheet + wastage scrap, deduct ONLY the full sheet count from inventory
                if (mat.materialUsageType === 'full_plus_wastage') {
                    if (mat.materialId && mat.quantity && mat.quantity > 0) {
                        await Material.findByIdAndUpdate(mat.materialId, {
                            $inc: { currentStock: -mat.quantity }
                        })
                    }
                    continue
                }

                if (mat.materialId) {
                    const material = await Material.findById(mat.materialId)
                    if (!material) continue

                    const isCustomSize = Boolean(mat.width && mat.height && mat.width > 0 && mat.height > 0)

                    if (isCustomSize && mat.width && mat.height) {
                        const sheetArea = parseSheetArea(material.size)
                        const pieces = mat.pieces || 1
                        const totalCustomArea = (mat.width * mat.height) * pieces
                        // Full sheets pulled from stock to cut this custom piece
                        const sheetsNeeded = Math.max(1, Math.ceil(totalCustomArea / sheetArea))
                        const sheetFractionUsed = totalCustomArea / sheetArea
                        const leftoverSheets = Math.max(0, parseFloat((sheetsNeeded - sheetFractionUsed).toFixed(3)))
                        const leftoverAreaSqFt = parseFloat((leftoverSheets * sheetArea).toFixed(1))

                        // Deduct full sheets pulled from inventory
                        await Material.findByIdAndUpdate(mat.materialId, {
                            $inc: { currentStock: -sheetsNeeded }
                        })

                        // Record leftover offcut into Wastage collection
                        if (leftoverSheets > 0.005) {
                            await Wastage.create({
                                materialId: mat.materialId,
                                date: orderData.date ? new Date(orderData.date) : new Date(),
                                quantity: leftoverSheets,
                                reason: `Offcut from Order ${order.orderNumber} (Cut ${mat.width}x${mat.height} ft [${pieces} pcs] from ${material.size} sheet, leftover: ${leftoverAreaSqFt} sq ft)`,
                            })
                        }
                    } else if (mat.quantity) {
                        // Standard full sheets used
                        await Material.findByIdAndUpdate(mat.materialId, {
                            $inc: { currentStock: -mat.quantity }
                        })
                    }
                }
            }
        }

        // Record audit log entry
        logActivity({
            action: 'CREATE_ORDER',
            module: 'Orders',
            description: `Created Order ${order.orderNumber} for ${order.clientSnapshot?.name || 'Client'} (Total: ₹${order.totalValue}, Advance: ₹${order.advanceReceived})`,
            metadata: {
                orderNumber: order.orderNumber,
                client: order.clientSnapshot?.name,
                totalValue: order.totalValue,
                advance: order.advanceReceived,
                materialsCount: order.materials?.length || 0,
            }
        })

        return NextResponse.json(order, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating order:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to create order'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}

