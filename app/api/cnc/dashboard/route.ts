import { NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Order, CNCExpense, Material, CNCClient } from '@/lib/models/cnc-shop'

// Dashboard stats API with MongoDB aggregation for performance
export async function GET() {
    try {
        await dbConnect()

        // Get date boundaries
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(todayStart)
        todayEnd.setDate(todayEnd.getDate() + 1)

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

        // Run all aggregations in parallel
        const [
            todayStats,
            monthStats,
            pendingPayments,
            lowStockCount,
            pendingOrdersCount,
            totalClientsCount,
            totalMaterialsCount,
            recentOrders
        ] = await Promise.all([
            // Today's stats
            Order.aggregate([
                { $match: { date: { $gte: todayStart, $lt: todayEnd } } },
                { $group: { _id: null, total: { $sum: '$totalValue' }, count: { $sum: 1 } } }
            ]),

            // This month's stats
            Order.aggregate([
                { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
                { $group: { _id: null, total: { $sum: '$totalValue' }, count: { $sum: 1 } } }
            ]),

            // Total pending payments
            Order.aggregate([
                { $match: { balanceAmount: { $gt: 0 } } },
                { $group: { _id: null, total: { $sum: '$balanceAmount' } } }
            ]),

            // Low stock count
            Material.countDocuments({
                $expr: { $lte: ['$currentStock', '$lowStockAlert'] }
            }),

            // Pending orders count
            Order.countDocuments({ status: { $in: ['Pending', 'In Progress'] } }),

            // Total clients
            CNCClient.countDocuments({}),

            // Total materials
            Material.countDocuments({}),

            // Recent pending orders with client info
            Order.aggregate([
                { $match: { status: { $in: ['Pending', 'In Progress'] } } },
                { $sort: { date: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'cncclients',
                        localField: 'clientId',
                        foreignField: '_id',
                        as: 'client'
                    }
                },
                { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        orderNumber: 1,
                        totalValue: 1,
                        status: 1,
                        date: 1,
                        designType: 1,
                        clientName: { $ifNull: ['$client.name', 'Unknown'] }
                    }
                }
            ])
        ])

        return NextResponse.json({
            today: {
                sales: todayStats[0]?.total || 0,
                orderCount: todayStats[0]?.count || 0
            },
            month: {
                sales: monthStats[0]?.total || 0,
                orderCount: monthStats[0]?.count || 0
            },
            pendingPayments: pendingPayments[0]?.total || 0,
            lowStockCount,
            pendingOrdersCount,
            totalClients: totalClientsCount,
            totalMaterials: totalMaterialsCount,
            recentPendingOrders: recentOrders
        })
    } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
