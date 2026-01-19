import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import dbConnect from '@/lib/db/mongodb'
import { User } from '@/lib/models/user'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Validation schema
const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(1, 'Name is required'),
    role: z.enum(['admin', 'user']).default('user'),
    allowedBusinesses: z.array(z.enum(['cnc-shop', 'interiors', 'drapes'])).min(1, 'At least one business access is required'),
})

// GET - List all users (admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await dbConnect()

        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search') || ''

        const query = search
            ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ],
            }
            : {}

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({
            users: users.map((user: any) => ({
                id: user._id.toString(),
                email: user.email,
                name: user.name,
                role: user.role,
                allowedBusinesses: user.allowedBusinesses || ['cnc-shop', 'interiors', 'drapes'],
                createdAt: user.createdAt,
            })),
        })
    } catch (error) {
        console.error('Get users error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

// POST - Create new user (admin only)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await dbConnect()

        const body = await request.json()

        const validation = createUserSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password, name, role, allowedBusinesses } = validation.data

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await User.create({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name: name.trim(),
            role,
            allowedBusinesses,
        })

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    allowedBusinesses: user.allowedBusinesses,
                },
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Create user error:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
