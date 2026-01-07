import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorClient } from '@/lib/models/interiors'

// GET single client
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const client = await InteriorClient.findById(id)
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
    }
}

// PUT update client
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const body = await request.json()
        const client = await InteriorClient.findByIdAndUpdate(id, body, { new: true })
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json(client)
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

// DELETE client
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const client = await InteriorClient.findByIdAndDelete(id)
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }
        return NextResponse.json({ message: 'Client deleted successfully' })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
