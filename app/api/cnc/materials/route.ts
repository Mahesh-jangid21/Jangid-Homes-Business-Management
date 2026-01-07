import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Material } from '@/lib/models/cnc-shop'

export async function GET() {
    try {
        await dbConnect()
        const materials = await Material.find({}).sort({ createdAt: -1 })
        return NextResponse.json(materials)
    } catch (error) {
        console.error('Error fetching materials:', error)
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()
        const material = await Material.create(body)
        return NextResponse.json(material, { status: 201 })
    } catch (error) {
        console.error('Error creating material:', error)
        return NextResponse.json({ error: 'Failed to create material' }, { status: 500 })
    }
}
