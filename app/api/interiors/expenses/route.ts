import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorExpense } from '@/lib/models/interiors'
import { interiorExpenseSchema, formatValidationErrors } from '@/lib/validations'

// GET all expenses
export async function GET() {
    try {
        await dbConnect()
        const expenses = await InteriorExpense.find({}).sort({ date: -1 })
        return NextResponse.json(expenses)
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }
}

// POST create new expense
export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = interiorExpenseSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const expense = await InteriorExpense.create(validation.data)
        return NextResponse.json(expense, { status: 201 })
    } catch (error) {
        console.error('Error creating expense:', error)
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }
}
