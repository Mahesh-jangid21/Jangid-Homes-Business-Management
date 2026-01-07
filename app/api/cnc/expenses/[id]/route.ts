import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { CNCExpense } from '@/lib/models/cnc-shop'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect()
        const { id } = await params
        const expense = await CNCExpense.findByIdAndDelete(id)
        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }
        return NextResponse.json({ message: 'Expense deleted successfully' })
    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
    }
}
