import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorExpense } from '@/lib/models/interiors'

// GET single expense
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const expense = await InteriorExpense.findById(id)
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }
        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error fetching expense:', error)
        return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 })
    }
}

// PUT update expense
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const body = await request.json()
        const expense = await InteriorExpense.findByIdAndUpdate(id, body, { new: true })
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }
        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error updating expense:', error)
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
    }
}

// DELETE expense
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const expense = await InteriorExpense.findByIdAndDelete(id)
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }
        return NextResponse.json({ message: 'Expense deleted successfully' })
    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }
}
