import mongoose, { Schema, Document } from 'mongoose'

export type BusinessType = 'cnc-shop' | 'interiors' | 'drapes'

export interface IUser extends Document {
    email: string
    password: string
    name: string
    role: 'admin' | 'user'
    allowedBusinesses: BusinessType[]
    createdAt: Date
    updatedAt: Date
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            required: true,
            select: false // Don't include password in queries by default
        },
        name: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'user'],
            default: 'user',
        },
        allowedBusinesses: {
            type: [String],
            enum: ['cnc-shop', 'interiors', 'drapes'],
            default: ['cnc-shop', 'interiors', 'drapes'], // Default all for admin
        },
    },
    { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)


