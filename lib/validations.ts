import { z } from 'zod'

// ==================== COMMON VALIDATORS ====================

// Mobile number: 10-15 digits (flexible for international formats)
const mobileSchema = z.string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number is too long')
    .regex(/^\d+$/, 'Mobile number should only contain digits')

// GST Number: 15 characters or empty (optional)
const gstSchema = z.string()
    .max(15, 'GST number is too long')
    .optional()
    .default('')

// Email: proper email format or empty
const emailSchema = z.string()
    .email('Invalid email format')
    .or(z.literal(''))
    .optional()
    .default('')

// Name: allow letters, numbers, spaces, and common characters
const nameSchema = z.string()
    .min(1, 'Name is required')
    .max(100, 'Name is too long')

// Amount/Money: positive number
const amountSchema = z.number()
    .positive('Amount must be positive')

// Date: flexible date format
const dateSchema = z.string().or(z.date())

// ==================== CNC SCHEMAS ====================

// CNC Client validation
export const cncClientSchema = z.object({
    name: nameSchema,
    mobile: mobileSchema,
    address: z.string().max(500).optional().default(''),
    gst: gstSchema,
    type: z.enum(['Architect', 'Contractor', 'Shop', 'Individual', 'Other']).default('Individual'),
    outstandingBalance: z.number().optional().default(0),
})

// CNC Material validation
export const materialSchema = z.object({
    type: z.enum(['Acrylic', 'WPC', 'MDF', 'HDMR', 'Plywood', 'Wood']),
    size: z.string().min(1, 'Size is required'),
    thickness: z.number().positive('Thickness must be positive'),
    openingStock: z.number().min(0).optional().default(0),
    currentStock: z.number().min(0).optional().default(0),
    lowStockAlert: z.number().min(0).optional().default(5),
    rate: z.number().positive('Rate must be positive'),
})

// CNC Order validation
export const orderSchema = z.object({
    orderNumber: z.string().min(1, 'Order number is required'),
    date: dateSchema,
    clientId: z.string().min(1, 'Client is required'),
    designType: z.string().min(1, 'Design type is required'),
    materials: z.array(z.object({
        materialId: z.string(),
        quantity: z.number().min(0),
        cost: z.number().min(0),
    })).optional().default([]),
    labourCost: z.number().min(0).optional().default(0),
    totalValue: z.number().min(0).optional().default(0),
    advanceReceived: z.number().min(0).optional().default(0),
    balanceAmount: z.number().min(0).optional().default(0),
    payments: z.array(z.object({
        amount: z.number().min(0),
        date: dateSchema,
        method: z.enum(['Cash', 'UPI', 'Card', 'Bank']),
        account: z.enum(['Kamal Jangid', 'Hiralal Jangid']).optional(),
    })).optional().default([]),
    deliveryDate: dateSchema.optional(),
    status: z.enum(['Pending', 'In Progress', 'Completed', 'Billed']).optional().default('Pending'),
})

// CNC Expense validation
export const cncExpenseSchema = z.object({
    date: dateSchema,
    type: z.enum(['Raw Material', 'Labour', 'Electricity', 'Rent', 'Maintenance', 'Transport', 'Misc']),
    description: z.string().min(1, 'Description is required').max(500),
    amount: z.number().positive('Amount must be positive'),
    paymentMode: z.enum(['Cash', 'Bank', 'UPI', 'Card']).optional().default('Cash'),
    account: z.enum(['Kamal Jangid', 'Hiralal Jangid']).optional(),
})

// CNC Purchase validation
export const purchaseSchema = z.object({
    materialId: z.string().min(1, 'Material is required'),
    date: dateSchema,
    supplier: z.string().min(1, 'Supplier is required').max(100),
    quantity: z.number().positive('Quantity must be positive'),
    rate: z.number().positive('Rate must be positive'),
    total: z.number().positive('Total must be positive'),
})

// CNC Wastage validation
export const wastageSchema = z.object({
    materialId: z.string().min(1, 'Material is required'),
    date: dateSchema,
    quantity: z.number().positive('Quantity must be positive'),
    reason: z.string().min(1, 'Reason is required').max(500),
})

// CNC Stock Adjustment validation
export const stockAdjustmentSchema = z.object({
    materialId: z.string().min(1, 'Material is required'),
    date: dateSchema,
    newStock: z.number().min(0, 'Stock cannot be negative'),
    reason: z.string().max(500).optional().default('Manual Stock Audit'),
})

// ==================== INTERIOR SCHEMAS ====================

// Interior Client validation
export const interiorClientSchema = z.object({
    name: nameSchema,
    mobile: mobileSchema,
    email: emailSchema,
    address: z.string().max(500).optional().default(''),
    referredBy: z.string().max(100).optional().default(''),
    referralType: z.enum(['Client', 'Architect', 'Contractor', 'Website', 'Social Media', 'Walk-in', 'Other']).optional().default('Walk-in'),
    notes: z.string().max(1000).optional().default(''),
})

// Interior Project validation
export const interiorProjectSchema = z.object({
    projectNumber: z.string().min(1, 'Project number is required'),
    clientId: z.string().min(1, 'Client is required'),
    projectName: z.string().min(1, 'Project name is required').max(200),
    siteAddress: z.string().max(500).optional().default(''),
    projectType: z.enum(['Full Home', 'Kitchen', 'Bedroom', 'Living Room', 'Bathroom', 'Office', 'Commercial', 'Other']).optional().default('Full Home'),
    estimatedValue: z.number().min(0).optional().default(0),
    advanceReceived: z.number().min(0).optional().default(0),
    balanceAmount: z.number().min(0).optional().default(0),
    startDate: dateSchema.optional(),
    expectedEndDate: dateSchema.optional(),
    actualEndDate: dateSchema.optional(),
    status: z.enum(['Enquiry', 'Quotation Sent', 'Confirmed', 'In Progress', 'On Hold', 'Completed', 'Cancelled']).optional().default('Enquiry'),
    description: z.string().max(2000).optional().default(''),
})

// Interior Expense validation
export const interiorExpenseSchema = z.object({
    projectId: z.string().optional(),
    date: dateSchema,
    type: z.enum(['Material', 'Labour', 'Transport', 'Site Expenses', 'Designer Fee', 'Vendor Payment', 'Misc']),
    description: z.string().min(1, 'Description is required').max(500),
    amount: z.number().positive('Amount must be positive'),
    paymentMode: z.enum(['Cash', 'Bank', 'UPI', 'Cheque']).optional().default('Cash'),
    vendor: z.string().max(100).optional().default(''),
})

// ==================== HELPERS ====================

// MongoDB ObjectId validation helper
export const objectIdSchema = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format')

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
    const result = schema.safeParse(data)
    if (result.success) {
        return { success: true, data: result.data }
    }
    return { success: false, errors: result.error }
}

// Format validation errors for API response
export function formatValidationErrors(errors: z.ZodError) {
    return errors.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
    }))
}
