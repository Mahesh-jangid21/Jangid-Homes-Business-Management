import mongoose, { Schema, Document } from 'mongoose'

// Material Schema
export interface IMaterial extends Document {
    type: 'Acrylic' | 'WPC' | 'MDF' | 'HDMR' | 'Plywood' | 'Wood'
    size: string
    thickness: number
    openingStock: number
    currentStock: number
    lowStockAlert: number
    rate: number
    createdAt: Date
    updatedAt: Date
}

const MaterialSchema = new Schema<IMaterial>(
    {
        type: {
            type: String,
            enum: ['Acrylic', 'WPC', 'MDF', 'HDMR', 'Plywood', 'Wood'],
            required: true,
        },
        size: { type: String, required: true },
        thickness: { type: Number, required: true },
        openingStock: { type: Number, default: 0 },
        currentStock: { type: Number, default: 0 },
        lowStockAlert: { type: Number, default: 5 },
        rate: { type: Number, required: true },
    },
    { timestamps: true }
)

// Purchase Schema
export interface IPurchase extends Document {
    materialId: mongoose.Types.ObjectId
    date: Date
    supplier: string
    quantity: number
    rate: number
    total: number
    createdAt: Date
    updatedAt: Date
}

const PurchaseSchema = new Schema<IPurchase>(
    {
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        date: { type: Date, required: true },
        supplier: { type: String, required: true },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true },
        total: { type: Number, required: true },
    },
    { timestamps: true }
)

// CNC Client Schema
export interface ICNCClient extends Document {
    name: string
    mobile: string
    address: string
    gst: string
    type: 'Architect' | 'Contractor' | 'Shop' | 'Individual' | 'Other'
    outstandingBalance: number
    createdAt: Date
    updatedAt: Date
}

const CNCClientSchema = new Schema<ICNCClient>(
    {
        name: { type: String, required: true },
        mobile: { type: String, required: true },
        address: { type: String, default: '' },
        gst: { type: String, default: '' },
        type: {
            type: String,
            enum: ['Architect', 'Contractor', 'Shop', 'Individual', 'Other'],
            default: 'Individual',
        },
        outstandingBalance: { type: Number, default: 0 },
    },
    { timestamps: true }
)

// Order Schema
export interface IOrder extends Document {
    orderNumber: string
    date: Date
    clientId: mongoose.Types.ObjectId
    clientSnapshot: {  // Snapshot of client data at order time
        name: string
        mobile: string
        type: string
        address?: string
    }
    designType: string
    materials: {
        materialId: mongoose.Types.ObjectId
        materialSnapshot: {  // Snapshot of material data at order time
            type: string
            size: string
            thickness: number
        }
        quantity: number
        width?: number
        height?: number
        cost: number
    }[]
    labourCost: number
    totalValue: number
    advanceReceived: number
    payments: {
        amount: number;
        date: Date;
        method: 'Cash' | 'UPI' | 'Card' | 'Bank';
        account?: 'Kamal Jangid' | 'Hiralal Jangid'
    }[]
    balanceAmount: number
    deliveryDate: Date
    status: 'Pending' | 'In Progress' | 'Completed' | 'Billed'
    createdAt: Date
    updatedAt: Date
}

const OrderSchema = new Schema<IOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        date: { type: Date, required: true },
        clientId: { type: Schema.Types.ObjectId, ref: 'CNCClient', required: true },
        clientSnapshot: {
            name: { type: String, required: true },
            mobile: { type: String, required: true },
            type: { type: String, default: 'Individual' },
            address: { type: String, default: '' }
        },
        designType: { type: String, required: true },
        materials: [
            {
                materialId: { type: Schema.Types.ObjectId, ref: 'Material' },
                materialSnapshot: {
                    type: { type: String },
                    size: { type: String },
                    thickness: { type: Number }
                },
                quantity: { type: Number },
                width: { type: Number },
                height: { type: Number },
                cost: { type: Number },
            },
        ],
        labourCost: { type: Number, default: 0 },
        totalValue: { type: Number, default: 0 },
        advanceReceived: { type: Number, default: 0 },
        payments: [
            {
                amount: { type: Number, required: true },
                date: { type: Date, default: Date.now },
                method: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank'], required: true },
                account: { type: String, enum: ['Kamal Jangid', 'Hiralal Jangid'] },
            }
        ],
        balanceAmount: { type: Number, default: 0 },
        deliveryDate: { type: Date },
        status: {
            type: String,
            enum: ['Pending', 'In Progress', 'Completed', 'Billed'],
            default: 'Pending',
        },
    },
    { timestamps: true }
)

// CNC Expense Schema
export interface ICNCExpense extends Document {
    date: Date
    type: 'Raw Material' | 'Labour' | 'Electricity' | 'Rent' | 'Maintenance' | 'Transport' | 'Misc'
    description: string
    amount: number
    paymentMode: 'Cash' | 'Bank' | 'UPI' | 'Card'
    account?: 'Kamal Jangid' | 'Hiralal Jangid'
    createdAt: Date
    updatedAt: Date
}

const CNCExpenseSchema = new Schema<ICNCExpense>(
    {
        date: { type: Date, required: true },
        type: {
            type: String,
            enum: ['Raw Material', 'Labour', 'Electricity', 'Rent', 'Maintenance', 'Transport', 'Misc'],
            required: true,
        },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        paymentMode: {
            type: String,
            enum: ['Cash', 'Bank', 'UPI', 'Card'],
            default: 'Cash',
        },
        account: { type: String, enum: ['Kamal Jangid', 'Hiralal Jangid'] },
    },
    { timestamps: true }
)

// Wastage Schema
export interface IWastage extends Document {
    materialId: mongoose.Types.ObjectId
    date: Date
    quantity: number
    reason: string
    createdAt: Date
    updatedAt: Date
}

const WastageSchema = new Schema<IWastage>(
    {
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        date: { type: Date, required: true },
        quantity: { type: Number, required: true },
        reason: { type: String, required: true },
    },
    { timestamps: true }
)

// Stock Adjustment Schema
export interface IStockAdjustment extends Document {
    materialId: mongoose.Types.ObjectId
    date: Date
    previousStock: number
    newStock: number
    adjustment: number
    reason: string
    createdAt: Date
    updatedAt: Date
}

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
    {
        materialId: { type: Schema.Types.ObjectId, ref: 'Material', required: true },
        date: { type: Date, required: true },
        previousStock: { type: Number, required: true },
        newStock: { type: Number, required: true },
        adjustment: { type: Number, required: true },
        reason: { type: String, default: 'Manual Audit' },
    },
    { timestamps: true }
)

// ==================== INDEXES ====================
// Material - compound index for type/size/thickness lookups
MaterialSchema.index({ type: 1, size: 1, thickness: 1 })

// Purchase - for date range queries and material lookups
PurchaseSchema.index({ materialId: 1 })
PurchaseSchema.index({ date: -1 })

// CNC Client - for search and mobile lookup
CNCClientSchema.index({ mobile: 1 })
CNCClientSchema.index({ name: 'text' })

// Order - frequently filtered fields
OrderSchema.index({ date: -1 })
OrderSchema.index({ clientId: 1 })
OrderSchema.index({ status: 1 })

// CNC Expense - date range queries
CNCExpenseSchema.index({ date: -1 })
CNCExpenseSchema.index({ type: 1 })

// Wastage - material and date queries
WastageSchema.index({ materialId: 1 })
WastageSchema.index({ date: -1 })

// Stock Adjustment - material and date queries
StockAdjustmentSchema.index({ materialId: 1 })
StockAdjustmentSchema.index({ date: -1 })

// Export models
export const Material =
    mongoose.models.Material || mongoose.model<IMaterial>('Material', MaterialSchema)

export const Purchase =
    mongoose.models.Purchase || mongoose.model<IPurchase>('Purchase', PurchaseSchema)

export const CNCClient =
    mongoose.models.CNCClient || mongoose.model<ICNCClient>('CNCClient', CNCClientSchema)

export const Order =
    mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema)

export const CNCExpense =
    mongoose.models.CNCExpense || mongoose.model<ICNCExpense>('CNCExpense', CNCExpenseSchema)

export const Wastage =
    mongoose.models.Wastage || mongoose.model<IWastage>('Wastage', WastageSchema)

export const StockAdjustment =
    mongoose.models.StockAdjustment || mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema)
