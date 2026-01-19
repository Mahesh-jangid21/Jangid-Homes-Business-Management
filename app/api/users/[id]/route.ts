import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import dbConnect from '@/lib/db/mongodb'
import { User } from '@/lib/models/user'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Validation schema for updates
const updateUserSchema = z.object({
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    name: z.string().min(1, 'Name is required').optional(),
    role: z.enum(['admin', 'user']).optional(),
    allowedBusinesses: z.array(z.enum(['cnc-shop', 'interiors', 'drapes'])).min(1).optional(),
})

// PUT - Update user (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await dbConnect()

        const { id } = await params
        const body = await request.json()

        const validation = updateUserSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.errors[0].message },
                { status: 400 }
            )
        }

        const { email, password, name, role, allowedBusinesses } = validation.data

        const existingUser = await User.findById(id)
        if (!existingUser) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Check email uniqueness
        if (email && email.toLowerCase() !== existingUser.email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() })
            if (emailExists) {
                return NextResponse.json(
                    { error: 'A user with this email already exists' },
                    { status: 409 }
                )
            }
        }

        // Build update object
        const updateData: Record<string, any> = {}
        if (email) updateData.email = email.toLowerCase().trim()
        if (name) updateData.name = name.trim()
        if (role) updateData.role = role
        if (allowedBusinesses) updateData.allowedBusinesses = allowedBusinesses
        if (password) updateData.password = await bcrypt.hash(password, 12)

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        ).select('-password')

        return NextResponse.json({
            message: 'User updated successfully',
            user: {
                id: updatedUser._id.toString(),
                email: updatedUser.email,
                name: updatedUser.name,
                role: updatedUser.role,
                allowedBusinesses: updatedUser.allowedBusinesses,
            },
        })
    } catch (error) {
        console.error('Update user error:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

// DELETE - Delete user (admin only, prevent self-deletion)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json(
                { error: 'Unauthorized. Admin access required.' },
                { status: 403 }
            )
        }

        await dbConnect()

        const { id } = await params
        const currentUserId = (session.user as any)?.id

        // Prevent self-deletion
        if (id === currentUserId) {
            return NextResponse.json(
                { error: 'You cannot delete your own account' },
                { status: 400 }
            )
        }

        const user = await User.findById(id)
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        await User.findByIdAndDelete(id)

        return NextResponse.json({
            message: 'User deleted successfully',
        })
    } catch (error) {
        console.error('Delete user error:', error)
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        )
    }
}
