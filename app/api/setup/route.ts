import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import dbConnect from '@/lib/db/mongodb'
import { User } from '@/lib/models/user'

// This route creates the initial admin user
// It should only work once - when no users exist
export async function POST(request: NextRequest) {
    try {
        await dbConnect()

        // Check if any users exist
        const existingUser = await User.findOne({})
        if (existingUser) {
            return NextResponse.json(
                { error: 'Setup already completed. Users already exist.' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { email, password, name } = body

        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create admin user
        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name: name.trim(),
            role: 'admin',
        })

        return NextResponse.json(
            {
                message: 'Admin user created successfully',
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Setup error:', error)

        if (error.code === 11000) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}

// GET to check if setup is needed
export async function GET() {
    try {
        await dbConnect()
        const userCount = await User.countDocuments()

        return NextResponse.json({
            setupRequired: userCount === 0,
            message: userCount === 0
                ? 'No users found. Setup is required.'
                : 'Setup already completed.'
        })
    } catch (error) {
        console.error('Setup check error:', error)
        return NextResponse.json(
            { error: 'Failed to check setup status' },
            { status: 500 }
        )
    }
}
