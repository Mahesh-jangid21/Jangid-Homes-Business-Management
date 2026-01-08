import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { CNCExpense } from '@/lib/models/cnc-shop'
import { cncExpenseSchema, formatValidationErrors } from '@/lib/validations'

export async function GET() {
    try {
        await dbConnect()
        const expenses = await CNCExpense.find({}).sort({ date: -1 })
        return NextResponse.json(expenses)
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = cncExpenseSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const expense = await CNCExpense.create(validation.data)
        return NextResponse.json(expense, { status: 201 })
    } catch (error) {
        console.error('Error creating expense:', error)
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }
}
