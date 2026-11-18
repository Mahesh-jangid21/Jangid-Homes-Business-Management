import mongoose, { Schema, Document } from 'mongoose'

export type BusinessType = 'cnc-shop'

export interface IUser extends Document {
    email: string
    password: string
    name: string
    role: 'admin' | 'user' | 'staff'
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
            enum: ['admin', 'user', 'staff'],
            default: 'user',
        },
        allowedBusinesses: {
            type: [String],
            enum: ['cnc-shop'],
            default: ['cnc-shop'],
        },
    },
    { timestamps: true }
)

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)


