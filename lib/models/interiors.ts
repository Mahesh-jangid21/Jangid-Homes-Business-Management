import mongoose, { Schema, Document } from 'mongoose'

// Interior Client Schema
export interface IInteriorClient extends Document {
    name: string
    mobile: string
    email: string
    address: string
    referredBy: string
    referralType: 'Client' | 'Architect' | 'Contractor' | 'Website' | 'Social Media' | 'Walk-in' | 'Other'
    notes: string
    createdAt: Date
    updatedAt: Date
}

const InteriorClientSchema = new Schema<IInteriorClient>(
    {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        referredBy: { type: String, default: '' },
        referralType: {
            type: String,
            enum: ['Client', 'Architect', 'Contractor', 'Website', 'Social Media', 'Walk-in', 'Other'],
            default: 'Walk-in',
        },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
)

// Interior Project Schema
export interface IInteriorProject extends Document {
    projectNumber: string
    clientId: mongoose.Types.ObjectId
    projectName: string
    siteAddress: string
    projectType: 'Full Home' | 'Kitchen' | 'Bedroom' | 'Living Room' | 'Bathroom' | 'Office' | 'Commercial' | 'Other'
    estimatedValue: number
    advanceReceived: number
    balanceAmount: number
    startDate: Date
    expectedEndDate: Date
    actualEndDate: Date
    status: 'Enquiry' | 'Quotation Sent' | 'Confirmed' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled'
    description: string
    createdAt: Date
    updatedAt: Date
}

const InteriorProjectSchema = new Schema<IInteriorProject>(
    {
        projectNumber: { type: String, required: true, unique: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'InteriorClient', required: true },
        projectName: { type: String, required: true },
        siteAddress: { type: String, default: '' },
        projectType: {
            type: String,
            enum: ['Full Home', 'Kitchen', 'Bedroom', 'Living Room', 'Bathroom', 'Office', 'Commercial', 'Other'],
            default: 'Full Home',
        },
        estimatedValue: { type: Number, default: 0 },
        advanceReceived: { type: Number, default: 0 },
        balanceAmount: { type: Number, default: 0 },
        startDate: { type: Date },
        expectedEndDate: { type: Date },
        actualEndDate: { type: Date },
        status: {
            type: String,
            enum: ['Enquiry', 'Quotation Sent', 'Confirmed', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
            default: 'Enquiry',
        },
        description: { type: String, default: '' },
    },
    { timestamps: true }
)

// Interior Expense Schema
export interface IInteriorExpense extends Document {
    projectId: mongoose.Types.ObjectId
    date: Date
    type: 'Material' | 'Labour' | 'Transport' | 'Site Expenses' | 'Designer Fee' | 'Vendor Payment' | 'Misc'
    description: string
    amount: number
    paymentMode: 'Cash' | 'Bank' | 'UPI' | 'Cheque'
    vendor: string
    createdAt: Date
    updatedAt: Date
}

const InteriorExpenseSchema = new Schema<IInteriorExpense>(
    {
        projectId: { type: Schema.Types.ObjectId, ref: 'InteriorProject' },
        date: { type: Date, required: true },
        type: {
            type: String,
            enum: ['Material', 'Labour', 'Transport', 'Site Expenses', 'Designer Fee', 'Vendor Payment', 'Misc'],
            required: true,
        },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Bank', 'UPI', 'Cheque'],
            default: 'Cash',
        },
        vendor: { type: String, default: '' },
    },
    { timestamps: true }
)

// ==================== INDEXES ====================
// Interior Client - for search and mobile lookup
InteriorClientSchema.index({ mobile: 1 })
InteriorClientSchema.index({ name: 'text' })

// Interior Project - frequently filtered fields
InteriorProjectSchema.index({ clientId: 1 })
InteriorProjectSchema.index({ status: 1 })
InteriorProjectSchema.index({ startDate: -1 })

// Interior Expense - date range and project queries
InteriorExpenseSchema.index({ projectId: 1 })
InteriorExpenseSchema.index({ date: -1 })

// Export models
export const InteriorClient =
    mongoose.models.InteriorClient || mongoose.model<IInteriorClient>('InteriorClient', InteriorClientSchema)

export const InteriorProject =
    mongoose.models.InteriorProject || mongoose.model<IInteriorProject>('InteriorProject', InteriorProjectSchema)

export const InteriorExpense =
    mongoose.models.InteriorExpense || mongoose.model<IInteriorExpense>('InteriorExpense', InteriorExpenseSchema)
