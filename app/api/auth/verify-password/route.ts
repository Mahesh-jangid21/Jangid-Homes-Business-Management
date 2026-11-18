import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db/mongodb'
import { User } from '@/lib/models/user'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
        }

        const body = await request.json()
        const { password } = body

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 })
        }

        await dbConnect()

        const user = await User.findOne({ email: session.user.email.toLowerCase() }).select('+password')
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Allow master reports password if configured, or verify user's login password
        const reportsMasterPassword = process.env.REPORTS_PASSWORD
        let isValid = false

        if (reportsMasterPassword && password === reportsMasterPassword) {
            isValid = true
        } else {
            isValid = await bcrypt.compare(password, user.password)
        }

        if (!isValid) {
            return NextResponse.json({ error: 'Incorrect password. Access denied.' }, { status: 401 })
        }

        return NextResponse.json({ success: true, message: 'Password verified successfully' })
    } catch (error) {
        console.error('Verify password error:', error)
        return NextResponse.json({ error: 'Failed to verify password' }, { status: 500 })
    }
}

