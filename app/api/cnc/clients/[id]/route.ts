import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { CNCClient } from '@/lib/models/cnc-shop'

/**
 * @swagger
 * /api/cnc/clients/{id}:
 *   get:
 *     tags:
 *       - CNC Clients
 *     summary: Get CNC client by ID
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
        const client = await CNCClient.findById(id)
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }
}

/**
 * @swagger
 * /api/cnc/clients/{id}:
 *   put:
 *     tags:
 *       - CNC Clients
 *     summary: Update CNC client
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
        const client = await CNCClient.findByIdAndUpdate(id, body, { new: true })
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json(client)
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

/**
 * @swagger
 * /api/cnc/clients/{id}:
 *   delete:
 *     tags:
 *       - CNC Clients
 *     summary: Delete CNC client
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
        const client = await CNCClient.findByIdAndDelete(id)
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json({ message: 'Client deleted successfully' })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
