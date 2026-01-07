import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { Material } from '@/lib/models/cnc-shop'

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
        return NextResponse.json(material)
    } catch (error) {
        console.error('Error updating material:', error)
        return NextResponse.json({ error: 'Failed to update material' }, { status: 500 })
    }
}

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
        return NextResponse.json({ message: 'Material deleted successfully' })
    } catch (error) {
        console.error('Error deleting material:', error)
        return NextResponse.json({ error: 'Failed to delete material' }, { status: 500 })
    }
}
