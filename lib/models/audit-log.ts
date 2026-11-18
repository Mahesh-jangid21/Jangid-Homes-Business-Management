import mongoose, { Schema, Document } from 'mongoose'

export type AuditModule =
  | 'Orders'
  | 'Inventory'
  | 'Clients'
  | 'Purchases'
  | 'Expenses'
  | 'Wastage'
  | 'Users'
  | 'Auth'

export interface IAuditLog extends Document {
  action: string
  module: AuditModule
  description: string
  userName: string
  userEmail: string
  userRole: string
  userId?: string
  metadata?: Record<string, any>
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    module: { type: String, required: true, index: true },
    description: { type: String, required: true },
    userName: { type: String, required: true, default: 'System' },
    userEmail: { type: String, default: '' },
    userRole: { type: String, default: 'unknown' },
    userId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt needed for logs
  }
)

// Optimized indexes for fast paginated queries and module filtering
AuditLogSchema.index({ createdAt: -1 })
AuditLogSchema.index({ module: 1, createdAt: -1 })

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
