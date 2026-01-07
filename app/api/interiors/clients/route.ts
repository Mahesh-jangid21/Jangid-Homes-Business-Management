import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorClient } from '@/lib/models/interiors'

// GET all clients
export async function GET() {
    try {
        await dbConnect()
        const clients = await InteriorClient.find({}).sort({ createdAt: -1 })
        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
    }
}

// POST create new client
export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()
        const client = await InteriorClient.create(body)
        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
    }
}
