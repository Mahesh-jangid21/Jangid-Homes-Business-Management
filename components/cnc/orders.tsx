"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCNC, type Order, type Client } from "@/lib/contexts/cnc-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, ClipboardList, Trash2, X, Loader2, Printer, FileText, IndianRupee, Search, UserPlus, AlertCircle, Share2, Phone, MapPin, Calendar, ChevronDown, Pencil, Scissors, CheckCircle, Recycle, Layers } from "lucide-react"
import { usePermissions } from "@/lib/hooks/use-permissions"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"


const designTypes = [
  "Mandir Jali",
  "Traditional Jali",
  "3D Wall Panel",
  "Engraving",
  "Carving",
  "CNC Cutting",
  "Custom Design",
]

const orderStatuses = [
  "Pending",
  "Quotation Sent",
  "Design Pending",
  "Design Sent",
  "Design Approved",
  "In Progress",
  "Ready for Pickup",
  "Completed",
  "Delivered",
  "Billed",
  "Cancelled",
] as const

export function CNCOrders() {
  const { orders, clients, materials, wastages, loading, addOrder, updateOrder, deleteOrder, addClient, fetchOrdersByMonth, ordersLoading } = useCNC()
  const searchParams = useSearchParams()
  const { canViewFinancials } = usePermissions()
  const initialSearch = searchParams.get("search") || ""
  const [showAddOrder, setShowAddOrder] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [saving, setSaving] = useState(false)
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({})
  const [showJobCard, setShowJobCard] = useState<Order | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState<Order | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  // Update search query if URL parameter changes
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch)
      setActiveTab("all") // Ensure we are on the 'all' tab to see the search result

      // Clear the search param from the URL so it doesn't persist on refresh
      const params = new URLSearchParams(window.location.search)
      if (params.has("search")) {
        params.delete("search")
        const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
        window.history.replaceState(null, "", newUrl)
      }
    }
  }, [initialSearch])
  const [materialWidth, setMaterialWidth] = useState<number>(0)
  const [materialHeight, setMaterialHeight] = useState<number>(0)
  const [useCustomSize, setUseCustomSize] = useState(false)
  const [isClientMaterial, setIsClientMaterial] = useState(false)
  const [materialSource, setMaterialSource] = useState<'workshop' | 'client'>('workshop')
  const [workshopUsageType, setWorkshopUsageType] = useState<'full_sheet' | 'wastage_only' | 'full_plus_wastage'>('full_sheet')
  const [chargeFullSheets, setChargeFullSheets] = useState(true)
  const [scrapSourceType, setScrapSourceType] = useState<'logged' | 'custom'>('logged')
  const [selectedWastageId, setSelectedWastageId] = useState<string>("")
  const [scrapMaterialType, setScrapMaterialType] = useState<string>("MDF")
  const [scrapWidth, setScrapWidth] = useState<number>(0)
  const [scrapHeight, setScrapHeight] = useState<number>(0)
  const [scrapPieces, setScrapPieces] = useState<number>(1)
  const [scrapCost, setScrapCost] = useState<number>(0)
  const [clientMaterialType, setClientMaterialType] = useState<string>("MDF")
  const [clientMaterialSize, setClientMaterialSize] = useState<string>("8x4")
  const [manualArea, setManualArea] = useState<number | "">("")
  const [labourRatePerSqFt, setLabourRatePerSqFt] = useState<number | "">("")
  const [directLabourCost, setDirectLabourCost] = useState<number | "">("")
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank'>('Cash')
  const [paymentAccount, setPaymentAccount] = useState<'Kamal Jangid' | 'Hiralal Jangid' | ''>('')
  const [showQuickClient, setShowQuickClient] = useState(false)
  const [quickClient, setQuickClient] = useState({ name: "", mobile: "", type: "Individual" as Client["type"] })
  const [addingClient, setAddingClient] = useState(false)
  const [customDesignType, setCustomDesignType] = useState("")
  const [isCustomDesign, setIsCustomDesign] = useState(false)
  const [dateFilter, setDateFilter] = useState("all") // all, today, week, month, custom
  const [customFromDate, setCustomFromDate] = useState("") // Custom date range start
  const [customToDate, setCustomToDate] = useState("") // Custom date range end
  const [visibleCount, setVisibleCount] = useState(15) // Pagination: show 15 orders at a time

  // Edit Order state for Admin / User (Option C)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [editLabourCost, setEditLabourCost] = useState<number>(0)
  const [editTotalValue, setEditTotalValue] = useState<number>(0)
  const [editAdvanceReceived, setEditAdvanceReceived] = useState<number>(0)
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>("")
  const [editDesignType, setEditDesignType] = useState<string>("")
  const [editStatus, setEditStatus] = useState<Order["status"]>("Pending")
  const [savingEdit, setSavingEdit] = useState(false)

  // Month/Year selector state - defaults to current month
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1) // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Month names for dropdown
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

  // Fetch orders when month/year changes
  useEffect(() => {
    fetchOrdersByMonth(selectedMonth, selectedYear)
  }, [selectedMonth, selectedYear])

  const generateOrderNumber = () => {
    // Now returns placeholder - actual order number is generated by server
    const date = new Date()
    const prefix = `ORD${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`
    return `${prefix}-XXX`
  }

  const getSheetArea = (size: string) => {
    const parts = size.toLowerCase().split("x")
    if (parts.length === 2) {
      const w = parseFloat(parts[0])
      const h = parseFloat(parts[1])
      if (!isNaN(w) && !isNaN(h)) return w * h
    }
    return 32 // Default 8x4
  }

  const getSheetDimensions = (size?: string): { length: number; width: number; area: number } => {
    if (!size) return { length: 8, width: 4, area: 32 }
    const parts = size.toLowerCase().split("x")
    if (parts.length === 2) {
      const d1 = parseFloat(parts[0])
      const d2 = parseFloat(parts[1])
      if (!isNaN(d1) && !isNaN(d2)) {
        const length = Math.max(d1, d2)
        const width = Math.min(d1, d2)
        return { length, width, area: length * width }
      }
    }
    return { length: 8, width: 4, area: 32 }
  }

  const getScrapValidationMessage = (
    w: number,
    h: number,
    pieces: number,
    source: 'logged' | 'custom',
    wastageId: string,
    rawMaterialId?: string
  ): string | null => {
    if (w <= 0 || h <= 0) return null
    if (pieces <= 0) return "Pieces must be at least 1."
    if (w > 50 || h > 50) return "Dimensions are too large. Please enter dimensions in feet."

    const enteredArea = w * h * pieces
    const enteredMaxDim = Math.max(w, h)
    const enteredMinDim = Math.min(w, h)

    if (source === 'logged' && wastageId) {
      const wObj = wastages.find((item) => (item.id || item._id) === wastageId)
      if (wObj) {
        const mat = materials.find((m) => (m.id || m._id) === wObj.materialId)
        const dims = getSheetDimensions(mat?.size)
        const maxAvailableArea = wObj.quantity * dims.area

        if (enteredArea > maxAvailableArea + 0.05) {
          return `Requested cut is ${enteredArea.toFixed(1)} sq ft (${w}×${h} ft × ${pieces} pcs), which exceeds the selected scrap offcut capacity of ${maxAvailableArea.toFixed(1)} sq ft (${(wObj.quantity).toFixed(2)} sheets). Please reduce dimensions or select another offcut.`
        }
        if (enteredMaxDim > dims.length || enteredMinDim > dims.width) {
          return `Piece dimensions (${w}×${h} ft) exceed raw single sheet limits (${dims.length}×${dims.width} ft). A scrap offcut cannot physically be larger than a raw sheet.`
        }
      }
    } else {
      const mat = rawMaterialId ? materials.find((m) => (m.id || m._id) === rawMaterialId) : undefined
      const dims = getSheetDimensions(mat?.size || "8x4")

      if (enteredMaxDim > dims.length || enteredMinDim > dims.width) {
        return `Scrap piece dimensions (${w}×${h} ft) exceed single raw sheet boundaries (${dims.length}×${dims.width} ft). A single scrap piece cannot be larger than a full sheet. For large cuts, use Full Sheet mode.`
      }
      if (w * h > dims.area) {
        return `Scrap piece cut area (${(w * h).toFixed(1)} sq ft) cannot exceed a single raw sheet (${dims.area} sq ft).`
      }
    }

    return null
  }

  const [newOrder, setNewOrder] = useState<Partial<Order>>({
    orderNumber: "Auto", // Server will generate
    date: new Date().toISOString().split("T")[0],
    clientId: "",
    designType: "",
    materials: [],
    labourCost: 0,
    totalValue: 0,
    advanceReceived: 0,
    balanceAmount: 0,
    deliveryDate: "",
    status: "Pending",
  })

  const [selectedMaterial, setSelectedMaterial] = useState("")
  const [materialQty, setMaterialQty] = useState(1)

  // Calculate total material area in sq ft (including workshop full sheets, wastage scrap, and client-provided sheets)
  const calculateTotalArea = (mats?: typeof newOrder.materials) => {
    const list = mats || newOrder.materials || []
    if (list.length === 0) return 0
    return list.reduce((total, m) => {
      const material = materials.find((mat) => (mat.id || mat._id) === m.materialId)
      const sheetArea = material 
        ? getSheetArea(material.size) 
        : (m.materialSnapshot?.size ? getSheetArea(m.materialSnapshot.size) : 32)

      let itemArea = 0
      if (m.width && m.height) {
        const pieces = m.pieces || 1
        itemArea = (m.width * m.height * pieces)
      } else {
        itemArea = (sheetArea * (m.pieces || m.quantity || 1))
      }

      // If full sheet + wastage scrap is used, add the extra scrap piece area to total cutting area
      if (m.materialUsageType === 'full_plus_wastage' && m.extraWastageWidth && m.extraWastageHeight) {
        const scrapPcs = m.extraWastagePieces || 1
        itemArea += (m.extraWastageWidth * m.extraWastageHeight * scrapPcs)
      }

      return total + itemArea
    }, 0)
  }

  const getAutoMaterialArea = (mats?: typeof newOrder.materials) => calculateTotalArea(mats)

  const getTotalMaterialArea = (mats?: typeof newOrder.materials) => {
    const autoArea = calculateTotalArea(mats)
    if (autoArea > 0) return autoArea
    if (typeof manualArea === 'number' && manualArea > 0) return manualArea
    return 0
  }

  // Reactive price synchronizer
  const syncPricing = (
    rateVal?: number | "",
    costOverride?: number | "",
    mats?: typeof newOrder.materials,
    advVal?: number,
    manualSqFt?: number | ""
  ) => {
    const activeMats = mats !== undefined ? mats : (newOrder.materials || [])
    const materialCost = activeMats.reduce((sum, m) => sum + m.cost, 0)

    const autoArea = calculateTotalArea(activeMats)
    const effectiveManualArea = manualSqFt !== undefined ? manualSqFt : manualArea
    const effectiveArea = autoArea > 0 ? autoArea : (typeof effectiveManualArea === 'number' ? effectiveManualArea : 0)

    const effectiveRate = rateVal !== undefined ? rateVal : labourRatePerSqFt

    let labourCost = 0
    if (typeof costOverride === 'number') {
      labourCost = costOverride
    } else if (typeof effectiveRate === 'number' && effectiveRate > 0) {
      labourCost = Math.round(effectiveRate * effectiveArea)
    } else if (typeof directLabourCost === 'number' && directLabourCost > 0) {
      labourCost = directLabourCost
    }

    const advance = advVal !== undefined ? advVal : (newOrder.advanceReceived || 0)
    const totalValue = materialCost + labourCost
    const balanceAmount = Math.max(0, totalValue - advance)

    setNewOrder((prev) => ({
      ...prev,
      materials: activeMats,
      labourCost,
      totalValue,
      balanceAmount,
      advanceReceived: advance,
    }))
  }

  // Re-sync labour cost whenever materials change and a rate is already set
  useEffect(() => {
    if (typeof labourRatePerSqFt === 'number' && labourRatePerSqFt > 0) {
      syncPricing(labourRatePerSqFt, undefined, newOrder.materials)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newOrder.materials?.length])

  const handleLabourRateChange = (rateVal: number | "") => {
    setLabourRatePerSqFt(rateVal)
    setDirectLabourCost("")
    syncPricing(rateVal, "")
  }

  const handleLabourCostChange = (costVal: number | "") => {
    setDirectLabourCost(costVal)
    const area = getTotalMaterialArea()
    if (typeof costVal === 'number' && costVal > 0 && area > 0) {
      setLabourRatePerSqFt(Math.round(costVal / area))
    }
    syncPricing(labourRatePerSqFt, costVal)
  }

  const handleManualAreaChange = (areaVal: number | "") => {
    setManualArea(areaVal)
    syncPricing(labourRatePerSqFt, undefined, undefined, undefined, areaVal)
  }

  const handleAdvanceChange = (advance: number) => {
    syncPricing(labourRatePerSqFt, directLabourCost, undefined, advance)
  }

  const addMaterialToOrder = () => {
    if (!selectedMaterial) return
    const material = materials.find((m) => (m.id || m._id) === selectedMaterial)
    if (!material) return

    const updatedMaterials = [...(newOrder.materials || [])]
    const sheetDims = getSheetDimensions(material.size)

    let finalQty = materialQty
    let itemCost = materialQty * material.rate
    let displaySize = material.size

    if (useCustomSize && materialWidth > 0 && materialHeight > 0) {
      const customArea = materialWidth * materialHeight * materialQty
      const sheetsNeeded = Math.max(1, Math.ceil(customArea / sheetDims.area))
      const proRatedSheets = customArea / sheetDims.area
      const isOversized = Math.max(materialWidth, materialHeight) > sheetDims.length || Math.min(materialWidth, materialHeight) > sheetDims.width

      if (chargeFullSheets) {
        finalQty = sheetsNeeded
        itemCost = sheetsNeeded * material.rate
      } else {
        finalQty = proRatedSheets
        itemCost = proRatedSheets * material.rate
      }

      displaySize = isOversized
        ? `${materialWidth}x${materialHeight} ft (${sheetsNeeded} sheets joined)`
        : `${materialWidth}x${materialHeight} ft`
    }

    updatedMaterials.push({
      materialId: selectedMaterial,
      materialSnapshot: {
        type: material.type,
        size: displaySize,
        thickness: material.thickness,
      },
      materialUsageType: 'full_sheet',
      quantity: finalQty,
      pieces: useCustomSize ? materialQty : 1,
      width: useCustomSize ? materialWidth : undefined,
      height: useCustomSize ? materialHeight : undefined,
      cost: Math.round(itemCost),
      isClientMaterial: false,
    })

    syncPricing(labourRatePerSqFt, undefined, updatedMaterials)

    setSelectedMaterial("")
    setMaterialQty(1)
    setMaterialWidth(0)
    setMaterialHeight(0)
    setUseCustomSize(false)
  }

  const addWastageOnlyMaterialToOrder = () => {
    if (!scrapWidth || !scrapHeight || scrapWidth <= 0 || scrapHeight <= 0) return
    const error = getScrapValidationMessage(
      scrapWidth,
      scrapHeight,
      scrapPieces,
      scrapSourceType,
      selectedWastageId,
      selectedMaterial
    )
    if (error) return

    let matType = scrapMaterialType
    let thickness = 18

    if (scrapSourceType === 'logged' && selectedWastageId) {
      const wObj = wastages.find((w) => (w.id || w._id) === selectedWastageId)
      if (wObj) {
        const mat = materials.find((m) => (m.id || m._id) === wObj.materialId)
        if (mat) {
          matType = mat.type
          thickness = mat.thickness
        }
      }
    } else {
      const selectedMat = materials.find((m) => (m.id || m._id) === selectedMaterial)
      if (selectedMat) {
        matType = selectedMat.type
        thickness = selectedMat.thickness
      }
    }

    const updatedMaterials = [...(newOrder.materials || [])]

    updatedMaterials.push({
      materialId: undefined, // No stock deduction for scrap
      materialSnapshot: {
        type: `${matType} (${thickness}mm) - Wastage Scrap`,
        size: `${scrapWidth}x${scrapHeight} ft`,
        thickness: thickness,
      },
      materialUsageType: 'wastage_only',
      quantity: 0,
      pieces: scrapPieces,
      width: scrapWidth,
      height: scrapHeight,
      cost: Math.round(scrapCost || 0),
      isClientMaterial: false,
    })

    syncPricing(labourRatePerSqFt, undefined, updatedMaterials)

    setScrapWidth(0)
    setScrapHeight(0)
    setScrapPieces(1)
    setScrapCost(0)
    setSelectedWastageId("")
  }

  const addFullPlusWastageMaterialToOrder = () => {
    if (!selectedMaterial) return
    if (!scrapWidth || !scrapHeight || scrapWidth <= 0 || scrapHeight <= 0) return
    const material = materials.find((m) => (m.id || m._id) === selectedMaterial)
    if (!material) return

    const error = getScrapValidationMessage(
      scrapWidth,
      scrapHeight,
      scrapPieces,
      scrapSourceType,
      selectedWastageId,
      selectedMaterial
    )
    if (error) return

    const updatedMaterials = [...(newOrder.materials || [])]
    const fullSheetsCost = materialQty * material.rate
    const totalCost = fullSheetsCost + (scrapCost || 0)

    updatedMaterials.push({
      materialId: selectedMaterial,
      materialSnapshot: {
        type: `${material.type} (${material.thickness}mm) - Full Sheet + Scrap`,
        size: material.size,
        thickness: material.thickness,
      },
      materialUsageType: 'full_plus_wastage',
      quantity: materialQty,
      pieces: materialQty,
      extraWastageWidth: scrapWidth,
      extraWastageHeight: scrapHeight,
      extraWastagePieces: scrapPieces,
      extraWastageCost: scrapCost || 0,
      cost: Math.round(totalCost),
      isClientMaterial: false,
    })

    syncPricing(labourRatePerSqFt, undefined, updatedMaterials)

    setSelectedMaterial("")
    setMaterialQty(1)
    setScrapWidth(0)
    setScrapHeight(0)
    setScrapPieces(1)
    setScrapCost(0)
    setSelectedWastageId("")
  }

  const addClientMaterialToOrder = () => {
    let sizeLabel = clientMaterialSize
    let widthVal: number | undefined = undefined
    let heightVal: number | undefined = undefined

    if (useCustomSize && materialWidth > 0 && materialHeight > 0) {
      const sheetDims = getSheetDimensions(clientMaterialSize)
      const isOversized = Math.max(materialWidth, materialHeight) > sheetDims.length || Math.min(materialWidth, materialHeight) > sheetDims.width
      const customArea = materialWidth * materialHeight * materialQty
      const sheetsNeeded = Math.max(1, Math.ceil(customArea / sheetDims.area))

      sizeLabel = isOversized
        ? `${materialWidth}x${materialHeight} ft (${sheetsNeeded} sheets joined)`
        : `${materialWidth}x${materialHeight} ft`
      widthVal = materialWidth
      heightVal = materialHeight
    }

    const updatedMaterials = [...(newOrder.materials || [])]

    updatedMaterials.push({
      materialId: undefined,
      materialSnapshot: {
        type: `${clientMaterialType} (Client Provided)`,
        size: sizeLabel,
        thickness: 18,
      },
      quantity: materialQty,
      pieces: materialQty,
      width: widthVal,
      height: heightVal,
      cost: 0,
      isClientMaterial: true,
    })

    syncPricing(labourRatePerSqFt, undefined, updatedMaterials)

    setMaterialWidth(0)
    setMaterialHeight(0)
    setUseCustomSize(false)
    setMaterialQty(1)
  }

  const removeMaterialFromOrder = (index: number) => {
    const updatedMaterials = [...(newOrder.materials || [])]
    updatedMaterials.splice(index, 1)
    syncPricing(labourRatePerSqFt, undefined, updatedMaterials)
  }

  const handleAddOrder = async () => {
    setSaving(true)
    try {
      // Clean materials: strip empty materialId strings and scrap-only items
      const cleanedMaterials = (newOrder.materials || []).map((m) => {
        const item: any = { ...m }
        if (!item.materialId || item.isClientMaterial || item.materialUsageType === 'wastage_only') {
          delete item.materialId
        }
        return item
      })

      await addOrder({
        orderNumber: "Pending", // Server generates this
        date: newOrder.date || new Date().toISOString().split("T")[0],
        clientId: newOrder.clientId || "",
        designType: newOrder.designType || "",
        materials: cleanedMaterials,
        labourCost: newOrder.labourCost || 0,
        totalValue: newOrder.totalValue || 0,
        advanceReceived: newOrder.advanceReceived || 0,
        payments: (newOrder.advanceReceived || 0) > 0 ? [{
          amount: newOrder.advanceReceived || 0,
          date: new Date().toISOString(),
          method: paymentMethod,
          account: (paymentMethod !== 'Cash' && paymentAccount) ? (paymentAccount as any) : undefined
        }] : [],
        balanceAmount: newOrder.balanceAmount || 0,
        deliveryDate: newOrder.deliveryDate ? newOrder.deliveryDate : undefined,
        status: newOrder.status as Order["status"],
      })
      setShowAddOrder(false)
      setNewOrder({
        orderNumber: "Auto", // Server will generate
        date: new Date().toISOString().split("T")[0],
        clientId: "",
        designType: "",
        materials: [],
        labourCost: 0,
        totalValue: 0,
        advanceReceived: 0,
        balanceAmount: 0,
        deliveryDate: "",
        status: "Pending",
      })
      setPaymentMethod('Cash')
      setPaymentAccount('')
      setIsClientMaterial(false)
      setMaterialSource('workshop')
      setWorkshopUsageType('full_sheet')
      setChargeFullSheets(true)
      setScrapSourceType('logged')
      setSelectedWastageId("")
      setScrapWidth(0)
      setScrapHeight(0)
      setScrapPieces(1)
      setScrapCost(0)
      setLabourRatePerSqFt("")
      setDirectLabourCost("")
      setManualArea("")
    } catch (error: any) {
      console.error("Failed to add order:", error)
      alert(error?.message || "Failed to create order. Please check the inputs.")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, status: Order["status"]) => {
    try {
      await updateOrder(orderId, { status })
    } catch (error) {
      console.error("Failed to update order:", error)
    }
  }

  const openEditOrder = (order: Order) => {
    setEditingOrder(order)
    setEditLabourCost(order.labourCost || 0)
    setEditTotalValue(order.totalValue || 0)
    setEditAdvanceReceived(order.advanceReceived || 0)
    setEditDeliveryDate(order.deliveryDate || "")
    setEditDesignType(order.designType || "")
    setEditStatus(order.status)
  }

  const handleSaveEditOrder = async () => {
    if (!editingOrder) return
    setSavingEdit(true)
    try {
      const orderId = editingOrder.id || editingOrder._id || ""
      const newBalance = Math.max(0, editTotalValue - editAdvanceReceived)
      await updateOrder(orderId, {
        labourCost: editLabourCost,
        totalValue: editTotalValue,
        advanceReceived: editAdvanceReceived,
        balanceAmount: newBalance,
        deliveryDate: editDeliveryDate,
        designType: editDesignType,
        status: editStatus,
      })
      setEditingOrder(null)
    } catch (error) {
      console.error("Failed to edit order:", error)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteOrder = async (id: string) => {
    try {
      await deleteOrder(id)
    } catch (error) {
      console.error("Failed to delete order:", error)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShareBill = async () => {
    if (!showJobCard) return
    const client = clients.find(c => (c.id || c._id) === showJobCard.clientId)
    const materialsList = showJobCard.materials.map((m) => {
      const mat = materials.find((mt) => (mt.id || mt._id) === m.materialId)
      return `  • ${mat?.type || 'Material'} ${m.width && m.height ? `(${m.width}×${m.height})` : mat?.size || ''} × ${m.quantity.toFixed(1)} sheets${m.isClientMaterial ? ' [Client Provided]' : ''}`
    }).join('\n')

    const billText = `
*SHRI SHYAM CNC*
━━━━━━━━━━━━━━━━━━━━━━━
📋 *Invoice #${showJobCard.orderNumber}*
📅 Date: ${new Date(showJobCard.date).toLocaleDateString("en-IN")}

👤 *Client:* ${client?.name || 'N/A'}
📱 Mobile: ${client?.mobile || 'N/A'}

🔧 *Work:* ${showJobCard.designType}
${showJobCard.deliveryDate ? `📆 Delivery: ${new Date(showJobCard.deliveryDate).toLocaleDateString("en-IN")}` : ''}

📦 *Materials:*
${materialsList}

━━━━━━━━━━━━━━━━━━━━━━━
💰 *Total:* ₹${showJobCard.totalValue.toLocaleString("en-IN")}
✅ *Paid:* ₹${showJobCard.advanceReceived.toLocaleString("en-IN")}
${showJobCard.balanceAmount > 0 ? `⏳ *Balance:* ₹${showJobCard.balanceAmount.toLocaleString("en-IN")}` : '✓ *PAID IN FULL*'}
━━━━━━━━━━━━━━━━━━━━━━━

Thank you for choosing Shri Shyam CNC!
📞 Contact: 9414058690
`.trim()

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice ${showJobCard.orderNumber}`,
          text: billText,
        })
      } catch (err) {
        // User cancelled or share failed, fallback to copy
        await navigator.clipboard.writeText(billText)
        alert('Bill copied to clipboard!')
      }
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(billText)
      alert('Bill copied to clipboard! You can paste it in WhatsApp or any app.')
    }
  }

  const handleRecordPayment = async () => {
    if (!showPaymentDialog || paymentAmount <= 0) return
    setSaving(true)
    try {
      const orderId = showPaymentDialog.id || showPaymentDialog._id || ""
      const currentAdvance = showPaymentDialog.advanceReceived || 0
      const newAdvance = currentAdvance + paymentAmount
      const newBalance = (showPaymentDialog.totalValue || 0) - newAdvance

      const newPayment = {
        amount: paymentAmount,
        date: new Date().toISOString(),
        method: paymentMethod,
        account: (paymentMethod !== 'Cash') ? (paymentAccount as any) : undefined
      }

      await updateOrder(orderId, {
        advanceReceived: newAdvance,
        payments: [...(showPaymentDialog.payments || []), newPayment],
        balanceAmount: Math.max(0, newBalance),
      })
      setShowPaymentDialog(null)
      setPaymentAmount(0)
      setPaymentMethod('Cash')
      setPaymentAccount('')
      setIsClientMaterial(false)
      setMaterialSource('workshop')
      setWorkshopUsageType('full_sheet')
      setChargeFullSheets(true)
      setScrapSourceType('logged')
      setSelectedWastageId("")
      setScrapWidth(0)
      setScrapHeight(0)
      setScrapPieces(1)
      setScrapCost(0)
      setLabourRatePerSqFt("")
      setDirectLabourCost("")
      setManualArea("")
    } catch (error) {
      console.error("Failed to record payment:", error)
    } finally {
      setSaving(false)
    }
  }

  // Filter orders by tab, search, and date, then sort by newest first
  const filteredOrders = orders
    .filter((o) => {
      // Tab filter
      const matchesTab = activeTab === "all" || o.status === activeTab

      // Date filter
      let matchesDate = true
      if (dateFilter !== "all") {
        const orderDate = new Date(o.date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (dateFilter === "today") {
          const orderDay = new Date(orderDate)
          orderDay.setHours(0, 0, 0, 0)
          matchesDate = orderDay.getTime() === today.getTime()
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = orderDate >= weekAgo
        } else if (dateFilter === "month") {
          matchesDate = orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear()
        } else if (dateFilter === "custom" && customFromDate && customToDate) {
          const fromDate = new Date(customFromDate)
          fromDate.setHours(0, 0, 0, 0)
          const toDate = new Date(customToDate)
          toDate.setHours(23, 59, 59, 999)
          matchesDate = orderDate >= fromDate && orderDate <= toDate
        } else if (dateFilter === "custom") {
          // Custom selected but dates not set - show all
          matchesDate = true
        }
      }

      // Search filter
      if (!searchQuery.trim()) return matchesTab && matchesDate

      const query = searchQuery.toLowerCase()
      // Use clientSnapshot first, fallback to lookup
      const clientName = o.clientSnapshot?.name || clients.find(c => (c.id || c._id) === o.clientId)?.name || ""
      const clientMobile = o.clientSnapshot?.mobile || clients.find(c => (c.id || c._id) === o.clientId)?.mobile || ""
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(query) ||
        clientName.toLowerCase().includes(query) ||
        clientMobile.includes(query) ||
        o.designType.toLowerCase().includes(query) ||
        o.status.toLowerCase().includes(query) // Added: search by status

      return matchesTab && matchesDate && matchesSearch
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Newest first

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"
      case "Quotation Sent":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
      case "Design Pending":
        return "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"
      case "Design Sent":
        return "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
      case "Design Approved":
        return "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400"
      case "In Progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
      case "Ready for Pickup":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      case "Completed":
        return "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400"
      case "Delivered":
        return "bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-400"
      case "Billed":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
      case "Cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sticky Header Section - stays fixed at top */}
      <div className="flex-shrink-0 bg-background pb-3 space-y-3">
        {/* Header - matching dashboard style */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Orders</h2>
            <span className="text-sm text-muted-foreground">
              {monthNames[selectedMonth - 1]} {selectedYear} • {orders.length} orders
            </span>
          </div>
          <Dialog open={showAddOrder} onOpenChange={setShowAddOrder}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[96vw] max-w-6xl sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0 rounded-2xl border shadow-2xl bg-background">
              {/* Fixed Header */}
              <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-border/60 bg-muted/30 flex items-center justify-between pr-12">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DialogTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                      <ClipboardList className="w-5 h-5 text-primary" />
                      Create CNC Order
                    </DialogTitle>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background">
                      Auto-ID
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Select client, configure materials, set labour rate, and confirm advance payment.
                  </p>
                </div>
              </div>

              {/* Scrollable Responsive Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Client, Design & Materials (7 cols on desktop) */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Section 1: Client & Job Details Card */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">1</span>
                          Client & Job Details
                        </span>
                      </div>

                      {/* Row 1: Client Selection - Full Width so even long names fit comfortably */}
                      <div className="space-y-1.5 min-w-0">
                        <Label className="text-xs font-medium">Client *</Label>
                        {clients.length > 0 && !showQuickClient ? (
                          <div className="flex gap-2 items-center min-w-0 overflow-hidden">
                            <Select value={newOrder.clientId} onValueChange={(v) => setNewOrder({ ...newOrder, clientId: v })}>
                              <SelectTrigger className="flex-1 h-9 text-xs bg-background min-w-0 max-w-full overflow-hidden">
                                {/* Custom render: only name + type badge, no phone, so long names stay on one line */}
                                <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                                  {newOrder.clientId ? (() => {
                                    const sel = clients.find(c => (c.id || c._id) === newOrder.clientId)
                                    if (!sel) return <span className="text-muted-foreground">Select client</span>
                                    return (
                                      <>
                                        <span className="truncate font-medium">{sel.name}</span>
                                        <span className="text-muted-foreground text-[10px] shrink-0 whitespace-nowrap">({sel.type})</span>
                                      </>
                                    )
                                  })() : <span className="text-muted-foreground">Select client</span>}
                                </span>
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map((c) => {
                                  const clientId = c.id || c._id;
                                  if (!clientId) return null;
                                  return (
                                    <SelectItem key={clientId} value={clientId}>
                                      <span className="font-medium">{c.name}</span>{" "}
                                      <span className="text-muted-foreground text-[11px]">({c.type})</span>
                                      {c.mobile ? <span className="text-muted-foreground text-[11px] ml-1">• {c.mobile}</span> : null}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 shrink-0"
                              onClick={() => setShowQuickClient(true)}
                              title="Add New Client"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground py-1.5">
                            {clients.length === 0 ? "No clients yet. Add one below." : "Adding new client..."}
                          </p>
                        )}
                      </div>

                      {/* Row 2: Design Type & Order Date (2 Columns with clean responsive grid) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        <div className="space-y-1.5 min-w-0">
                          <Label className="text-xs font-medium">Design / Work Type *</Label>
                          {!isCustomDesign ? (
                            <Select
                              value={newOrder.designType}
                              onValueChange={(v) => {
                                if (v === "__custom__") {
                                  setIsCustomDesign(true)
                                  setNewOrder({ ...newOrder, designType: "" })
                                } else {
                                  setNewOrder({ ...newOrder, designType: v })
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 text-xs bg-background min-w-0 overflow-hidden">
                                <SelectValue placeholder="Select design type" className="truncate block" />
                              </SelectTrigger>
                              <SelectContent>
                                {designTypes.map((d) => (
                                  <SelectItem key={d} value={d}>
                                    {d}
                                  </SelectItem>
                                ))}
                                <SelectItem value="__custom__" className="text-primary font-medium">
                                  + Add Custom Design
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex gap-1.5 min-w-0">
                              <Input
                                placeholder="Enter custom design type..."
                                value={customDesignType}
                                onChange={(e) => {
                                  setCustomDesignType(e.target.value)
                                  setNewOrder({ ...newOrder, designType: e.target.value })
                                }}
                                className="flex-1 h-9 text-xs bg-background min-w-0"
                                autoFocus
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => {
                                  setIsCustomDesign(false)
                                  setCustomDesignType("")
                                  setNewOrder({ ...newOrder, designType: "" })
                                }}
                                title="Back to list"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 min-w-0">
                          <Label className="text-xs font-medium">Order Date</Label>
                          <Input
                            type="date"
                            value={newOrder.date}
                            onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                            className="h-9 text-xs bg-background min-w-0"
                          />
                        </div>
                      </div>

                {/* Quick Add Client Section - Full Width */}
                {(clients.length === 0 || showQuickClient) && (
                  <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">
                          {clients.length === 0 ? "Add Your First Client" : "Quick Add New Client"}
                        </span>
                      </div>
                      {clients.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setShowQuickClient(false)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Input
                          placeholder="Client Name *"
                          value={quickClient.name}
                          onChange={(e) => {
                            setQuickClient({ ...quickClient, name: e.target.value })
                            if (clientErrors.name) setClientErrors({ ...clientErrors, name: "" })
                          }}
                          className={clientErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {clientErrors.name && (
                          <p className="text-[10px] font-medium text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {clientErrors.name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Input
                          placeholder="Mobile Number"
                          value={quickClient.mobile}
                          onChange={(e) => {
                            setQuickClient({ ...quickClient, mobile: e.target.value })
                            if (clientErrors.mobile) setClientErrors({ ...clientErrors, mobile: "" })
                          }}
                          className={clientErrors.mobile ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {clientErrors.mobile && (
                          <p className="text-[10px] font-medium text-destructive flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            {clientErrors.mobile}
                          </p>
                        )}
                      </div>
                      <Select
                        value={quickClient.type}
                        onValueChange={(v) => setQuickClient({ ...quickClient, type: v as Client["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Individual">Individual</SelectItem>
                          <SelectItem value="Architect">Architect</SelectItem>
                          <SelectItem value="Contractor">Contractor</SelectItem>
                          <SelectItem value="Shop">Shop</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={addingClient}
                      onClick={async () => {
                        const newErrors: Record<string, string> = {}
                        if (!quickClient.name.trim()) newErrors.name = "Required"
                        if (!quickClient.mobile.trim()) {
                          newErrors.mobile = "Required"
                        } else if (!/^\d{10}$/.test(quickClient.mobile.trim())) {
                          newErrors.mobile = "10 digits"
                        }

                        if (Object.keys(newErrors).length > 0) {
                          setClientErrors(newErrors)
                          return
                        }

                        setAddingClient(true)
                        try {
                          await addClient({
                            name: quickClient.name,
                            mobile: quickClient.mobile,
                            type: quickClient.type,
                            address: "",
                            gst: "",
                            outstandingBalance: 0
                          })
                          setQuickClient({ name: "", mobile: "", type: "Individual" })
                          setShowQuickClient(false)
                          setClientErrors({})
                        } catch (error) {
                          console.error("Failed to add client:", error)
                        } finally {
                          setAddingClient(false)
                        }
                      }}
                    >
                      {addingClient && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Client
                    </Button>
                  </div>
                )}
                    </div>

                    {/* Section 2: Materials Used Card */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">2</span>
                          Materials Used
                        </span>
                    <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialSource('workshop')
                          setIsClientMaterial(false)
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-medium transition-all",
                          materialSource === 'workshop' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Workshop Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMaterialSource('client')
                          setIsClientMaterial(true)
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-md font-medium transition-all flex items-center gap-1",
                          materialSource === 'client' ? "bg-blue-600 text-white shadow-sm font-semibold" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Client Provided Material
                      </button>
                    </div>
                  </div>

                  {materialSource === 'workshop' ? (
                    /* Workshop Stock Material Form with Full Sheet, Only Wastage Scrap, and Full + Scrap options */
                    <div className="space-y-3 p-3 bg-muted/40 rounded-xl border border-border/60">
                      {/* Sub-selector for Workshop Material Source Mode */}
                      <div className="flex items-center gap-1.5 p-1 bg-background/80 rounded-lg border border-border/50 text-xs overflow-x-auto">
                        <button
                          type="button"
                          onClick={() => setWorkshopUsageType('full_sheet')}
                          className={cn(
                            "px-3 py-1.5 rounded-md font-medium transition-all text-xs whitespace-nowrap flex items-center gap-1.5",
                            workshopUsageType === 'full_sheet'
                              ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Full Sheet(s)
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkshopUsageType('wastage_only')}
                          className={cn(
                            "px-3 py-1.5 rounded-md font-medium transition-all text-xs whitespace-nowrap flex items-center gap-1.5",
                            workshopUsageType === 'wastage_only'
                              ? "bg-amber-600 text-white shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Recycle className="w-3.5 h-3.5" />
                          Only Wastage / Scrap
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkshopUsageType('full_plus_wastage')}
                          className={cn(
                            "px-3 py-1.5 rounded-md font-medium transition-all text-xs whitespace-nowrap flex items-center gap-1.5",
                            workshopUsageType === 'full_plus_wastage'
                              ? "bg-purple-600 text-white shadow-xs font-semibold"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          Full Sheet + Scrap
                        </button>
                      </div>

                      {/* MODE 1: FULL FRESH SHEET(S) */}
                      {workshopUsageType === 'full_sheet' && (
                        <div className="space-y-2.5 animate-in fade-in duration-150">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                              <SelectTrigger className="w-full sm:flex-1 bg-background min-w-0">
                                <SelectValue placeholder="Select workshop material" className="truncate" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((m) => {
                                  const materialId = m.id || m._id
                                  if (!materialId) return null
                                  return (
                                    <SelectItem key={materialId} value={materialId}>
                                      {m.type} - {m.size} ({m.thickness}mm) - Stock: {m.currentStock}
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                className="w-24 bg-background"
                                value={materialQty}
                                onChange={(e) => setMaterialQty(Math.max(1, Number(e.target.value)))}
                                min={1}
                                placeholder="Qty"
                              />
                              <Button onClick={addMaterialToOrder} disabled={!selectedMaterial} className="flex-1 sm:flex-none">
                                Add
                              </Button>
                            </div>
                          </div>

                          {selectedMaterial && (() => {
                            const selectedMatObj = materials.find((m) => (m.id || m._id) === selectedMaterial)
                            const sheetDims = getSheetDimensions(selectedMatObj?.size)
                            const sheetArea = sheetDims.area
                            const customArea = useCustomSize && materialWidth > 0 && materialHeight > 0 ? materialWidth * materialHeight * materialQty : 0
                            const sheetsNeeded = customArea > 0 ? Math.max(1, Math.ceil(customArea / sheetArea)) : materialQty
                            const usedFraction = customArea > 0 ? customArea / sheetArea : materialQty
                            const leftoverFraction = customArea > 0 ? Math.max(0, sheetsNeeded - usedFraction) : 0
                            const leftoverSqFt = customArea > 0 ? (leftoverFraction * sheetArea) : 0
                            const isOversized = useCustomSize && materialWidth > 0 && materialHeight > 0 && (
                              Math.max(materialWidth, materialHeight) > sheetDims.length || Math.min(materialWidth, materialHeight) > sheetDims.width
                            )

                            return (
                              <div className="space-y-2 pt-2 border-t border-border/40">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    id="customSize"
                                    checked={useCustomSize}
                                    onChange={(e) => setUseCustomSize(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                  />
                                  <Label htmlFor="customSize" className="text-xs font-medium cursor-pointer">
                                    Custom Cut Dimensions (Width × Height ft)
                                  </Label>
                                </div>

                                {useCustomSize && (
                                  <div className="space-y-2.5 pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-medium text-muted-foreground">Dimensions:</span>
                                      <div className="flex items-center gap-1.5">
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min={0.1}
                                          placeholder="Width"
                                          className="w-20 h-8 text-xs bg-background"
                                          value={materialWidth || ""}
                                          onChange={(e) => setMaterialWidth(Number(e.target.value))}
                                        />
                                        <span className="text-xs text-muted-foreground">×</span>
                                        <Input
                                          type="number"
                                          step="0.1"
                                          min={0.1}
                                          placeholder="Height"
                                          className="w-20 h-8 text-xs bg-background"
                                          value={materialHeight || ""}
                                          onChange={(e) => setMaterialHeight(Number(e.target.value))}
                                        />
                                        <span className="text-xs text-muted-foreground">ft</span>
                                      </div>
                                    </div>

                                    {materialWidth > 0 && materialHeight > 0 && (
                                      isOversized ? (
                                        <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs space-y-2">
                                          <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                                            <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                                            <span>Multi-Sheet Joined Cut ({materialWidth}×{materialHeight} ft exceeds {sheetDims.length}×{sheetDims.width} ft sheet)</span>
                                          </div>
                                          <p className="text-[11.5px] text-blue-800/90 dark:text-blue-300">
                                            This oversized cut requires joining <strong>{sheetsNeeded} full sheets</strong> ({sheetsNeeded * sheetArea} sq ft raw stock) to fulfill.
                                          </p>
                                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-blue-200/70 dark:border-blue-800/50">
                                            <div>Cut Area (for Labour): <strong>{customArea.toFixed(1)} sq ft</strong></div>
                                            <div>Sheets from Stock: <strong>{sheetsNeeded} full sheets</strong></div>
                                            <div>Leftover Scrap: <strong>{leftoverSqFt.toFixed(1)} sq ft ({leftoverFraction.toFixed(2)} sh)</strong></div>
                                            <div className="text-emerald-700 dark:text-emerald-400 font-medium">✓ Auto-logs scrap to Wastage</div>
                                          </div>
                                          <div className="pt-1.5 border-t border-blue-200/60 dark:border-blue-800/40 flex items-center justify-between flex-wrap gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-foreground">
                                              <input
                                                type="checkbox"
                                                checked={chargeFullSheets}
                                                onChange={(e) => setChargeFullSheets(e.target.checked)}
                                                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                                              />
                                              <span>Charge for {sheetsNeeded} full sheets (₹{(sheetsNeeded * (selectedMatObj?.rate || 0)).toLocaleString("en-IN")})</span>
                                            </label>
                                            <span className="text-[10.5px] text-muted-foreground">
                                              {!chargeFullSheets && `(Pro-rated cut area: ₹${Math.round(usedFraction * (selectedMatObj?.rate || 0)).toLocaleString("en-IN")})`}
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="text-[11px] p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-1">
                                          <div className="flex justify-between font-medium">
                                            <span>Cut Area: {customArea.toFixed(1)} sq ft ({usedFraction.toFixed(2)} sheets)</span>
                                            <span>Sheets Pulled: {sheetsNeeded}</span>
                                          </div>
                                          <div className="flex justify-between text-muted-foreground text-[10.5px]">
                                            <span>Leftover Scrap: {leftoverSqFt.toFixed(1)} sq ft ({leftoverFraction.toFixed(2)} sheets)</span>
                                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                              Will auto-log to Wastage
                                            </span>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* MODE 2: ONLY WASTAGE / SCRAP MATERIAL */}
                      {workshopUsageType === 'wastage_only' && (() => {
                        const scrapValidationErr = getScrapValidationMessage(
                          scrapWidth,
                          scrapHeight,
                          scrapPieces,
                          scrapSourceType,
                          selectedWastageId,
                          selectedMaterial
                        )
                        const scrapArea = (scrapWidth > 0 && scrapHeight > 0) ? (scrapWidth * scrapHeight * scrapPieces) : 0
                        const availableWastages = wastages.filter(w => (w.quantity || 0) > 0)
                        const selectedWObj = selectedWastageId ? wastages.find(w => (w.id || w._id) === selectedWastageId) : undefined
                        const selectedWMat = selectedWObj ? materials.find(m => (m.id || m._id) === selectedWObj.materialId) : undefined
                        const selectedWDims = getSheetDimensions(selectedWMat?.size)
                        const selectedWMaxArea = selectedWObj ? selectedWObj.quantity * selectedWDims.area : 0

                        return (
                          <div className="space-y-3 p-3 bg-amber-500/10 dark:bg-amber-950/20 rounded-xl border border-amber-500/25 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                <Recycle className="w-4 h-4 text-amber-600 shrink-0" />
                                Only Wastage / Scrap Material
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                0 full sheets deducted from inventory
                              </span>
                            </div>

                            {/* Scrap Source Toggle: Pick Logged Scrap vs Custom Offcut */}
                            <div className="flex items-center gap-2 text-xs flex-wrap">
                              <span className="text-muted-foreground font-medium">Scrap Source:</span>
                              <div className="flex items-center gap-3">
                                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-xs">
                                  <input
                                    type="radio"
                                    name="scrapSourceType"
                                    value="logged"
                                    checked={scrapSourceType === 'logged'}
                                    onChange={() => setScrapSourceType('logged')}
                                    className="text-amber-600 focus:ring-amber-500"
                                  />
                                  <span>From Shop Wastage ({availableWastages.length} in stock)</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-xs">
                                  <input
                                    type="radio"
                                    name="scrapSourceType"
                                    value="custom"
                                    checked={scrapSourceType === 'custom'}
                                    onChange={() => setScrapSourceType('custom')}
                                    className="text-amber-600 focus:ring-amber-500"
                                  />
                                  <span>Custom / Unlogged Offcut</span>
                                </label>
                              </div>
                            </div>

                            {/* When Logged Scrap selected */}
                            {scrapSourceType === 'logged' ? (
                              <div className="space-y-2">
                                <Label className="text-xs font-medium">Select Available Scrap Offcut</Label>
                                {availableWastages.length === 0 ? (
                                  <div className="p-2.5 rounded-lg bg-background/80 border border-amber-300 dark:border-amber-900 text-xs text-muted-foreground">
                                    No recorded wastage offcuts in stock. Switch to <strong>Custom / Unlogged Offcut</strong> above.
                                  </div>
                                ) : (
                                  <Select
                                    value={selectedWastageId}
                                    onValueChange={(val) => {
                                      setSelectedWastageId(val)
                                      const w = wastages.find(w => (w.id || w._id) === val)
                                      if (w) {
                                        const mat = materials.find(m => (m.id || m._id) === w.materialId)
                                        if (mat) setScrapMaterialType(mat.type)
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="w-full bg-background min-w-0 text-xs">
                                      <SelectValue placeholder="Choose a wastage piece from shop" className="truncate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableWastages.map((w) => {
                                        const wId = w.id || w._id || ""
                                        const mat = materials.find((m) => (m.id || m._id) === w.materialId)
                                        const dims = getSheetDimensions(mat?.size)
                                        const wArea = w.quantity * dims.area
                                        return (
                                          <SelectItem key={wId} value={wId}>
                                            {mat ? `${mat.type} (${mat.thickness}mm)` : "Scrap"} — {wArea.toFixed(1)} sq ft avail ({w.quantity.toFixed(2)} sh) • {w.reason || 'Offcut'}
                                          </SelectItem>
                                        )
                                      })}
                                    </SelectContent>
                                  </Select>
                                )}

                                {selectedWObj && (
                                  <div className="text-[11.5px] p-2 rounded-lg bg-background/90 border border-border flex justify-between items-center text-muted-foreground flex-wrap gap-1">
                                    <span>
                                      Piece: <strong>{selectedWMat?.type || scrapMaterialType}</strong> ({selectedWMat?.thickness || 18}mm)
                                    </span>
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                                      Max Usable: {selectedWMaxArea.toFixed(1)} sq ft ({selectedWObj.quantity.toFixed(2)} sheets)
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* When Custom Scrap selected */
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="space-y-1 min-w-0">
                                  <Label className="text-xs">Material Type & Thickness</Label>
                                  <Select
                                    value={selectedMaterial || scrapMaterialType}
                                    onValueChange={(v) => {
                                      setSelectedMaterial(v)
                                      const found = materials.find(m => (m.id || m._id) === v)
                                      if (found) setScrapMaterialType(found.type)
                                    }}
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-background min-w-0">
                                      <SelectValue placeholder="Select material type" className="truncate" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {materials.map((m) => {
                                        const mId = m.id || m._id
                                        if (!mId) return null
                                        return (
                                          <SelectItem key={mId} value={mId}>
                                            {m.type} ({m.thickness}mm)
                                          </SelectItem>
                                        )
                                      })}
                                      {["MDF", "Acrylic", "WPC", "HDMR", "Plywood", "Wood"].map((t) => (
                                        <SelectItem key={t} value={t}>
                                          {t} (Standard 18mm)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-1 min-w-0">
                                  <Label className="text-xs">Scrap Material Charge (₹)</Label>
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-8 text-xs bg-background"
                                    value={scrapCost || ""}
                                    placeholder="0 (Free scrap or custom price)"
                                    onChange={(e) => setScrapCost(Math.max(0, Number(e.target.value)))}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Scrap Cost for Logged mode if not shown above */}
                            {scrapSourceType === 'logged' && (
                              <div className="space-y-1">
                                <Label className="text-xs">Scrap Material Charge (₹)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  className="h-8 text-xs bg-background"
                                  value={scrapCost || ""}
                                  placeholder="0 (Free scrap or custom price)"
                                  onChange={(e) => setScrapCost(Math.max(0, Number(e.target.value)))}
                                />
                              </div>
                            )}

                            {/* Cut Dimensions */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">Cut Piece Dimensions (ft)</Label>
                              <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border/60 flex-wrap">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0.1}
                                  placeholder="W (ft)"
                                  className="w-20 h-7 text-xs bg-muted/40"
                                  value={scrapWidth || ""}
                                  onChange={(e) => setScrapWidth(Number(e.target.value))}
                                />
                                <span className="text-xs text-muted-foreground">×</span>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0.1}
                                  placeholder="H (ft)"
                                  className="w-20 h-7 text-xs bg-muted/40"
                                  value={scrapHeight || ""}
                                  onChange={(e) => setScrapHeight(Number(e.target.value))}
                                />
                                <span className="text-xs text-muted-foreground">ft</span>
                                <span className="text-xs text-muted-foreground ml-2">Qty:</span>
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-16 h-7 text-xs bg-muted/40"
                                  value={scrapPieces}
                                  onChange={(e) => setScrapPieces(Math.max(1, Number(e.target.value)))}
                                />
                                {scrapArea > 0 && (
                                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 ml-auto">
                                    = {scrapArea.toFixed(1)} sq ft
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Validation Error Message */}
                            {scrapValidationErr && (
                              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold">Invalid Scrap Dimensions</p>
                                  <p className="text-[11.5px] mt-0.5">{scrapValidationErr}</p>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">
                                Cut Area: <strong className="text-foreground">{scrapArea.toFixed(1)} sq ft</strong> (charged in Labour)
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium"
                                disabled={Boolean(scrapValidationErr) || !scrapWidth || !scrapHeight || scrapWidth <= 0 || scrapHeight <= 0 || (scrapSourceType === 'logged' && !selectedWastageId)}
                                onClick={addWastageOnlyMaterialToOrder}
                              >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Wastage Scrap
                              </Button>
                            </div>
                          </div>
                        )
                      })()}

                      {/* MODE 3: FULL SHEET + WASTAGE SCRAP PIECE */}
                      {workshopUsageType === 'full_plus_wastage' && (() => {
                        const scrapValidationErr = getScrapValidationMessage(
                          scrapWidth,
                          scrapHeight,
                          scrapPieces,
                          'custom',
                          '',
                          selectedMaterial
                        )
                        const matObj = materials.find((m) => (m.id || m._id) === selectedMaterial)
                        const fullSheetArea = matObj ? getSheetArea(matObj.size) * materialQty : 32 * materialQty
                        const scrapArea = (scrapWidth > 0 && scrapHeight > 0) ? (scrapWidth * scrapHeight * scrapPieces) : 0
                        const totalArea = fullSheetArea + scrapArea
                        const fullCost = matObj ? materialQty * matObj.rate : 0
                        const totalItemCost = fullCost + (scrapCost || 0)

                        return (
                          <div className="space-y-3 p-3 bg-purple-500/10 dark:bg-purple-950/20 rounded-xl border border-purple-500/25 animate-in fade-in duration-150">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                                <Scissors className="w-4 h-4 text-purple-600 shrink-0" />
                                Full Sheet + Wastage Scrap Piece
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Deducts only full sheet stock • Reuses offcut
                              </span>
                            </div>

                            {/* 1. Full Sheets */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-medium">1. Full Sheet(s) from Inventory</Label>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                                  <SelectTrigger className="w-full sm:flex-1 bg-background min-w-0">
                                    <SelectValue placeholder="Select workshop material" className="truncate" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {materials.map((m) => {
                                      const materialId = m.id || m._id
                                      if (!materialId) return null
                                      return (
                                        <SelectItem key={materialId} value={materialId}>
                                          {m.type} - {m.size} ({m.thickness}mm) - Stock: {m.currentStock}
                                        </SelectItem>
                                      )
                                    })}
                                  </SelectContent>
                                </Select>
                                <div className="flex gap-2 items-center">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">Sheets:</span>
                                  <Input
                                    type="number"
                                    className="w-20 bg-background h-8 text-xs"
                                    value={materialQty}
                                    onChange={(e) => setMaterialQty(Math.max(1, Number(e.target.value)))}
                                    min={1}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* 2. Extra Scrap Piece */}
                            <div className="space-y-1.5 pt-1 border-t border-purple-200/50 dark:border-purple-900/30">
                              <Label className="text-xs font-medium">2. Extra Scrap Piece Cut Size (ft)</Label>
                              <div className="flex items-center gap-2 p-2 bg-background rounded-lg border border-border/60 flex-wrap">
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0.1}
                                  placeholder="W (ft)"
                                  className="w-20 h-7 text-xs bg-muted/40"
                                  value={scrapWidth || ""}
                                  onChange={(e) => setScrapWidth(Number(e.target.value))}
                                />
                                <span className="text-xs text-muted-foreground">×</span>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0.1}
                                  placeholder="H (ft)"
                                  className="w-20 h-7 text-xs bg-muted/40"
                                  value={scrapHeight || ""}
                                  onChange={(e) => setScrapHeight(Number(e.target.value))}
                                />
                                <span className="text-xs text-muted-foreground">ft</span>
                                <span className="text-xs text-muted-foreground ml-2">Qty:</span>
                                <Input
                                  type="number"
                                  min={1}
                                  className="w-16 h-7 text-xs bg-muted/40"
                                  value={scrapPieces}
                                  onChange={(e) => setScrapPieces(Math.max(1, Number(e.target.value)))}
                                />
                                <span className="text-xs text-muted-foreground ml-2">Scrap Cost: ₹</span>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="0"
                                  className="w-20 h-7 text-xs bg-muted/40"
                                  value={scrapCost || ""}
                                  onChange={(e) => setScrapCost(Math.max(0, Number(e.target.value)))}
                                />
                              </div>
                            </div>

                            {/* Validation Error Message */}
                            {scrapValidationErr && (
                              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2 animate-in fade-in">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-semibold">Invalid Scrap Dimensions</p>
                                  <p className="text-[11.5px] mt-0.5">{scrapValidationErr}</p>
                                </div>
                              </div>
                            )}

                            {/* Summary & Add */}
                            {selectedMaterial && (
                              <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                                <div className="text-xs space-y-0.5">
                                  <div>
                                    Total Area: <strong className="text-foreground">{totalArea.toFixed(1)} sq ft</strong>{" "}
                                    <span className="text-muted-foreground">({fullSheetArea.toFixed(0)} full + {scrapArea.toFixed(1)} scrap)</span>
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    Cost: ₹{totalItemCost.toLocaleString("en-IN")} • Inventory: {materialQty} full sheet{materialQty > 1 ? 's' : ''} deducted
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  size="sm"
                                  className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-medium"
                                  disabled={Boolean(scrapValidationErr) || !selectedMaterial || !scrapWidth || !scrapHeight || scrapWidth <= 0 || scrapHeight <= 0}
                                  onClick={addFullPlusWastageMaterialToOrder}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" />
                                  Add Combined Material
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    /* Client Provided Material Form */
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                          Client Material (₹0 Material Cost)
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Only labour rate will be charged to client
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="space-y-1">
                          <Label className="text-xs">Material Type</Label>
                          <Select value={clientMaterialType} onValueChange={setClientMaterialType}>
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["MDF", "Acrylic", "WPC", "HDMR", "Plywood", "Wood", "Other"].map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Sheet Size / Type</Label>
                          <Select
                            value={useCustomSize ? "custom" : clientMaterialSize}
                            onValueChange={(v) => {
                              if (v === "custom") {
                                setUseCustomSize(true)
                              } else {
                                setUseCustomSize(false)
                                setClientMaterialSize(v)
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="8x4">8×4 ft (32 sq ft)</SelectItem>
                              <SelectItem value="7x4">7×4 ft (28 sq ft)</SelectItem>
                              <SelectItem value="6x4">6×4 ft (24 sq ft)</SelectItem>
                              <SelectItem value="8x3">8×3 ft (24 sq ft)</SelectItem>
                              <SelectItem value="custom">Custom Dimensions (W × H)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Quantity (Sheets / Pcs)</Label>
                          <Input
                            type="number"
                            min={1}
                            className="h-8 text-xs bg-background"
                            value={materialQty}
                            onChange={(e) => setMaterialQty(Math.max(1, Number(e.target.value)))}
                          />
                        </div>
                      </div>

                      {useCustomSize && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-2 bg-background/80 rounded-lg border border-border/60 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground">Dimensions (ft):</span>
                            <Input
                              type="number"
                              step="0.1"
                              min={0.1}
                              placeholder="W"
                              className="w-20 h-7 text-xs"
                              value={materialWidth || ""}
                              onChange={(e) => setMaterialWidth(Number(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">×</span>
                            <Input
                              type="number"
                              step="0.1"
                              min={0.1}
                              placeholder="H"
                              className="w-20 h-7 text-xs"
                              value={materialHeight || ""}
                              onChange={(e) => setMaterialHeight(Number(e.target.value))}
                            />
                            <span className="text-xs text-muted-foreground">ft</span>
                            {materialWidth > 0 && materialHeight > 0 && (
                              <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 ml-auto">
                                = {(materialWidth * materialHeight * materialQty).toFixed(1)} sq ft
                              </span>
                            )}
                          </div>

                          {materialWidth > 0 && materialHeight > 0 && (() => {
                            const sheetDims = getSheetDimensions("8x4")
                            const isOversized = Math.max(materialWidth, materialHeight) > sheetDims.length || Math.min(materialWidth, materialHeight) > sheetDims.width
                            const totalCustomArea = materialWidth * materialHeight * materialQty
                            const sheetsNeeded = Math.max(1, Math.ceil(totalCustomArea / sheetDims.area))

                            if (isOversized) {
                              return (
                                <div className="p-2.5 rounded-lg bg-blue-100/70 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-xs space-y-1">
                                  <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                                    <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>Multi-Sheet Joined Cut ({materialWidth}×{materialHeight} ft exceeds single 8×4 ft sheet)</span>
                                  </div>
                                  <p className="text-blue-800 dark:text-blue-300 text-[11px]">
                                    Client must supply at least <strong>{sheetsNeeded} full sheets</strong> ({sheetsNeeded * sheetDims.area} sq ft) for CNC cutting & panel joining.
                                  </p>
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-1 flex-wrap gap-2">
                        <span className="text-xs text-muted-foreground">
                          Area: <strong className="text-foreground">{
                            useCustomSize && materialWidth > 0 && materialHeight > 0 
                              ? (materialWidth * materialHeight * materialQty).toFixed(1) 
                              : (getSheetArea(clientMaterialSize) * materialQty).toFixed(1)
                          } sq ft</strong> (₹0 Material Cost)
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          onClick={addClientMaterialToOrder}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Add Client Material
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of Added Materials */}
                  {newOrder.materials && newOrder.materials.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {newOrder.materials.map((m, index) => {
                        const material = materials.find((mat) => (mat.id || mat._id) === m.materialId)
                        const matDisplayName = m.materialSnapshot?.type || material?.type || "Material"
                        const matDisplaySize = m.materialSnapshot?.size || material?.size || ""

                        return (
                          <div key={`${m.materialId || 'mat'}-${index}`} className="flex justify-between items-center p-2.5 bg-muted rounded-xl border border-border/50">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">
                                  {matDisplayName} {matDisplaySize ? `- ${matDisplaySize}` : ""}
                                </span>
                                {m.isClientMaterial ? (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 text-[10px] px-1.5 py-0 font-medium">
                                    Client Material
                                  </Badge>
                                ) : m.materialUsageType === 'wastage_only' ? (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] px-1.5 py-0 font-medium">
                                    Wastage Scrap Only (0 Stock Deducted)
                                  </Badge>
                                ) : m.materialUsageType === 'full_plus_wastage' ? (
                                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 text-[10px] px-1.5 py-0 font-medium">
                                    Full Sheet + Scrap
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-medium">
                                    Workshop Stock
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                                {m.materialUsageType === 'wastage_only' ? (
                                  <>
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">Scrap Piece [{m.width}×{m.height} ft]</span>
                                    <span>•</span>
                                    <span>{m.pieces || 1} pc ({((m.width || 0) * (m.height || 0) * (m.pieces || 1)).toFixed(1)} sq ft)</span>
                                    <span>•</span>
                                    <span>Material Cost: ₹{(m.cost || 0).toLocaleString("en-IN")}</span>
                                  </>
                                ) : m.materialUsageType === 'full_plus_wastage' ? (
                                  <>
                                    <span>{m.quantity || 1} Full Sheet(s) ({((getSheetArea(matDisplaySize)) * (m.quantity || 1)).toFixed(0)} sq ft)</span>
                                    <span>+</span>
                                    <span className="text-purple-600 dark:text-purple-400 font-medium">Scrap [{m.extraWastageWidth}×{m.extraWastageHeight} ft] ({((m.extraWastageWidth || 0) * (m.extraWastageHeight || 0) * (m.extraWastagePieces || 1)).toFixed(1)} sq ft)</span>
                                    <span>•</span>
                                    <span>Material: ₹{(m.cost || 0).toLocaleString("en-IN")}</span>
                                  </>
                                ) : m.width && m.height ? (
                                  <>
                                    <span className="text-primary font-medium">Cut [{m.width}×{m.height} ft]</span>
                                    <span>•</span>
                                    <span>{m.pieces || 1} pcs ({((m.width * m.height * (m.pieces || 1))).toFixed(1)} sq ft)</span>
                                    {!m.isClientMaterial && (
                                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        • offcut to wastage
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span>{m.pieces || m.quantity || 1} sheet(s) ({((getSheetArea(matDisplaySize)) * (m.pieces || m.quantity || 1)).toFixed(1)} sq ft)</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {canViewFinancials && (
                                <span className="font-semibold text-sm">
                                  {m.isClientMaterial ? (
                                    <span className="text-blue-600 dark:text-blue-400">₹0 (Client)</span>
                                  ) : (
                                    `₹${m.cost.toLocaleString("en-IN")}`
                                  )}
                                </span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => removeMaterialFromOrder(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                    </div>
                  </div>

                  {/* Right Column: Pricing, Labour & Advance (5 cols on desktop, sticky) */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Section 3: Labour & Cutting Area Card */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-card space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">3</span>
                          Labour & Delivery
                        </span>
                        {getTotalMaterialArea() > 0 && (
                          <span className="text-xs text-primary font-bold">
                            {getTotalMaterialArea().toFixed(1)} sq ft
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Total Area (sq ft)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={getTotalMaterialArea() > 0 ? getTotalMaterialArea().toFixed(1) : (manualArea || "")}
                            onChange={(e) => handleManualAreaChange(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 32"
                            className="h-9 text-xs bg-background"
                            disabled={getAutoMaterialArea() > 0}
                            title={getAutoMaterialArea() > 0 ? "Calculated from added materials" : "Enter square feet"}
                          />
                          {getAutoMaterialArea() > 0 ? (
                            <p className="text-[10px] text-muted-foreground">From added items</p>
                          ) : (
                            <p className="text-[10px] text-muted-foreground">Manual square feet</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Labour Rate (₹/sq ft)</Label>
                          <Input
                            type="number"
                            value={labourRatePerSqFt || ""}
                            onChange={(e) => handleLabourRateChange(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="e.g. 90"
                            className="h-9 text-xs font-medium bg-background"
                          />
                          {typeof labourRatePerSqFt === 'number' && labourRatePerSqFt > 0 && getTotalMaterialArea() > 0 && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                              ₹{labourRatePerSqFt} × {getTotalMaterialArea().toFixed(1)} sq ft
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold">Labour Cost (₹)</Label>
                          <Input
                            type="number"
                            value={newOrder.labourCost || ""}
                            onChange={(e) => handleLabourCostChange(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0"
                            className="h-9 text-xs font-bold text-foreground bg-background"
                          />
                          <p className="text-[10px] text-muted-foreground">Auto or direct amount</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Delivery Date</Label>
                          <Input
                            type="date"
                            value={newOrder.deliveryDate}
                            onChange={(e) => setNewOrder({ ...newOrder, deliveryDate: e.target.value })}
                            className="h-9 text-xs bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 4: Financial Summary & Advance Payment */}
                    <div className="p-3.5 sm:p-4 rounded-xl border border-border/60 bg-muted/40 space-y-3.5 shadow-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">4</span>
                        Order Value & Advance
                      </span>

                      {/* Live Calculation Box */}
                      <div className="p-3 bg-background rounded-xl border border-border/60 space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Material Cost:</span>
                          <span className="font-semibold text-foreground">
                            {(newOrder.materials?.reduce((sum, m) => sum + m.cost, 0) || 0) === 0 && newOrder.materials?.some(m => m.isClientMaterial) ? (
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">₹0 (Client Material)</span>
                            ) : (
                              `₹${(newOrder.materials?.reduce((sum, m) => sum + m.cost, 0) || 0).toLocaleString("en-IN")}`
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            Labour Cost:
                            {typeof labourRatePerSqFt === 'number' && labourRatePerSqFt > 0 && getTotalMaterialArea() > 0 && (
                              <span className="text-[11px] text-muted-foreground">
                                (₹{labourRatePerSqFt} × {getTotalMaterialArea().toFixed(1)})
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-foreground">
                            ₹{(newOrder.labourCost || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-border">
                          <span className="font-bold text-sm text-foreground">Total Order Value:</span>
                          <span className="font-extrabold text-xl text-primary">
                            ₹{(newOrder.totalValue || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Advance Received (₹)</Label>
                          <Input
                            type="number"
                            value={newOrder.advanceReceived || ""}
                            onChange={(e) => handleAdvanceChange(Number(e.target.value))}
                            placeholder="0"
                            className="h-9 text-xs font-semibold bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium">Balance Amount</Label>
                          <Input
                            value={`₹${(newOrder.balanceAmount || 0).toLocaleString("en-IN")}`}
                            disabled
                            className="h-9 text-xs bg-muted font-bold text-foreground"
                          />
                        </div>
                      </div>

                      {/* Payment Method Details (if advance > 0) */}
                      {(newOrder.advanceReceived || 0) > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in">
                          <div className="space-y-1">
                            <Label className="text-[11px]">Payment Mode</Label>
                            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                              <SelectTrigger className="h-8 text-xs bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="UPI">UPI</SelectItem>
                                <SelectItem value="Bank">Bank Transfer</SelectItem>
                                <SelectItem value="Card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {paymentMethod !== 'Cash' && (
                            <div className="space-y-1">
                              <Label className="text-[11px]">Received In Account</Label>
                              <Select value={paymentAccount} onValueChange={(v: any) => setPaymentAccount(v)}>
                                <SelectTrigger className="h-8 text-xs bg-background">
                                  <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Kamal Jangid">Kamal Jangid</SelectItem>
                                  <SelectItem value="Hiralal Jangid">Hiralal Jangid</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fixed Responsive Footer */}
              <div className="px-5 py-3 sm:px-6 sm:py-3.5 border-t border-border/60 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-start">
                  <div>
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold text-foreground text-sm">₹{(newOrder.totalValue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div>
                    <span className="text-muted-foreground">Balance: </span>
                    <span className="font-bold text-primary text-sm">₹{(newOrder.balanceAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 flex-1 sm:flex-none text-xs"
                    onClick={() => setShowAddOrder(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-9 flex-1 sm:flex-none text-xs font-semibold px-5"
                    onClick={handleAddOrder}
                    disabled={!newOrder.clientId || !newOrder.designType || saving}
                  >
                    {saving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter - Professional compact style */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search orders, clients, or designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Status Filter + Date Filter Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status dropdown filter */}
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="h-9 text-xs bg-background w-full sm:w-56">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                <span className="font-medium">All Orders</span>
                <span className="ml-1.5 text-muted-foreground">({orders.length})</span>
              </SelectItem>
              {([
                "Pending",
                "Quotation Sent",
                "Design Pending",
                "Design Sent",
                "Design Approved",
                "In Progress",
                "Ready for Pickup",
                "Completed",
                "Delivered",
                "Billed",
                "Cancelled",
              ] as const).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  <span>{s}</span>
                  <span className="ml-1.5 text-muted-foreground">({orders.filter((o) => o.status === s).length})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <Select value={dateFilter} onValueChange={(v) => {
              setDateFilter(v)
              // Reset custom dates when switching away from custom
              if (v !== "custom") {
                setCustomFromDate("")
                setCustomToDate("")
              }
            }}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {/* Month Selector */}
            <Select value={selectedMonth.toString()} onValueChange={(v) => {
              setSelectedMonth(parseInt(v))
              setVisibleCount(15) // Reset pagination on month change
            }}>
              <SelectTrigger className="w-[110px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, idx) => (
                  <SelectItem key={idx} value={(idx + 1).toString()} className="text-xs">
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Year Selector */}
            <Select value={selectedYear.toString()} onValueChange={(v) => {
              setSelectedYear(parseInt(v))
              setVisibleCount(15) // Reset pagination on year change
            }}>
              <SelectTrigger className="w-[75px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {ordersLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            {/* Custom Date Range Inputs */}
            {dateFilter === "custom" && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                <Input
                  type="date"
                  value={customFromDate}
                  onChange={(e) => setCustomFromDate(e.target.value)}
                  className="h-9 w-[130px] text-xs"
                  placeholder="From"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={customToDate}
                  onChange={(e) => setCustomToDate(e.target.value)}
                  className="h-9 w-[130px] text-xs"
                  placeholder="To"
                />
                {(customFromDate || customToDate) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setCustomFromDate("")
                      setCustomToDate("")
                    }}
                    title="Clear dates"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Orders Section */}
      <div className="flex-1 overflow-y-auto pt-4">

        {filteredOrders.length === 0 ? (
          <Card className="border shadow-sm">
            <CardContent className="py-10 text-center">
              <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {filteredOrders.slice(0, visibleCount).map((order) => {
                const orderId = order.id || order._id || ""
                // Use clientSnapshot if available, fallback to lookup for older orders
                const clientName = order.clientSnapshot?.name || clients.find((c) => (c.id || c._id) === order.clientId)?.name || "Unknown Client"
                return (
                  <Card key={orderId} className="border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      {/* Main Content Grid */}
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left Section - Order Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header Row */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-semibold text-foreground">{order.orderNumber}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>

                          {/* Client & Design Info */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-medium text-foreground">{clientName}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{order.designType || "Job"}</span>
                          </div>

                          {/* Date & Delivery */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>Ordered: {order.date ? new Date(order.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "N/A"}</span>
                            {order.deliveryDate && (
                              <>
                                <span>•</span>
                                <span className="text-primary font-medium">Due: {new Date(order.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              </>
                            )}
                          </div>

                          {/* Materials - Compact Display */}
                          {order.materials.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {order.materials.slice(0, 3).map((m, idx) => {
                                // Use materialSnapshot if available, fallback to lookup
                                const matType = m.materialSnapshot?.type || materials.find((mat) => (mat.id || mat._id) === m.materialId)?.type || "Material"
                                return (
                                  <span
                                    key={idx}
                                    className={cn(
                                      "text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1",
                                      m.isClientMaterial
                                        ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {matType} {m.width && m.height ? `${m.width}×${m.height}` : ""} ×{m.quantity.toFixed(1)}
                                    {m.isClientMaterial && <span className="text-[9px] font-semibold tracking-wide">(Client)</span>}
                                  </span>
                                )
                              })}
                              {order.materials.length > 3 && (
                                <span className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                                  +{order.materials.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Right Section - Financial Info (hidden for staff) */}
                        {canViewFinancials && (
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 sm:text-right min-w-fit">
                          <div>
                            <p className="text-lg font-bold text-foreground">₹{(order.totalValue || 0).toLocaleString("en-IN")}</p>
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Total Value</p>
                          </div>
                          <div className="text-right">
                            {(order.balanceAmount || 0) > 0 ? (
                              <>
                                <p className="text-base font-bold text-amber-600">₹{(order.balanceAmount || 0).toLocaleString("en-IN")}</p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-amber-600/70">Balance Due</p>
                              </>
                            ) : (
                              <>
                                <p className="text-base font-bold text-green-600">Paid</p>
                                <p className="text-[10px] font-medium uppercase tracking-wide text-green-600/70">Complete</p>
                              </>
                            )}
                          </div>
                        </div>
                        )}
                      </div>

                      {/* Payment History - Compact (hidden for staff) */}
                      {canViewFinancials && order.payments && order.payments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Payments:</span>
                            {order.payments.slice(-3).map((p, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full">
                                ₹{p.amount.toLocaleString("en-IN")}
                                <span className="text-green-600/70 dark:text-green-500/70">
                                  ({p.method}{p.account && p.method !== 'Cash' ? ` → ${p.account}` : ''})
                                </span>
                              </span>
                            ))}
                            {order.payments.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">+{order.payments.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-border/50">
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleUpdateOrderStatus(orderId, v as Order["status"])}
                        >
                          <SelectTrigger className="h-8 w-32 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {orderStatuses.map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs gap-1.5"
                            onClick={() => setShowJobCard(order)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Job Card</span>
                          </Button>
                          {canViewFinancials && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5"
                              onClick={() => openEditOrder(order)}
                              title="Edit Order Pricing & Details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                          )}
                          {order.balanceAmount > 0 && canViewFinancials && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setShowPaymentDialog(order)
                                setPaymentAmount(order.balanceAmount)
                              }}
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Payment</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteOrder(orderId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            {/* Show More Button */}
            {visibleCount < filteredOrders.length && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((prev) => prev + 15)}
                  className="w-full max-w-xs h-10 border-dashed hover:border-primary hover:text-primary transition-all"
                >
                  Show More ({filteredOrders.length - visibleCount} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
        {/* Professional Invoice / Bill Dialog */}
        <Dialog open={!!showJobCard} onOpenChange={(o) => !o && setShowJobCard(null)}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-2xl p-6 printing-area">
            <DialogHeader className="print:hidden">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice / Bill
              </DialogTitle>
            </DialogHeader>

            {showJobCard && (() => {
              const client = clients.find(c => (c.id || c._id) === showJobCard.clientId)
              // Use snapshot if available, fallback to lookup
              const clientName = showJobCard.clientSnapshot?.name || client?.name || "N/A"
              const clientMobile = showJobCard.clientSnapshot?.mobile || client?.mobile
              const clientAddress = showJobCard.clientSnapshot?.address || client?.address
              return (
                <div className="space-y-5 pt-2">
                  {/* Company Header */}
                  <div className="text-center border-b-2 border-primary pb-4">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">JANGID HOMES</h1>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Shri Shyam CNC</p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        9929981304
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Jaipur, Rajasthan
                      </span>
                    </div>
                  </div>

                  {/* Invoice Info Row */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Invoice No.</p>
                      <p className="text-xl font-bold text-foreground">{showJobCard.orderNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Date</p>
                      <p className="text-sm font-semibold text-foreground">{new Date(showJobCard.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      {showJobCard.deliveryDate && (
                        <p className="text-xs text-primary font-medium mt-0.5">
                          Due: {new Date(showJobCard.deliveryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Client & Work Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-xl">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Bill To</p>
                      <p className="text-base font-bold text-foreground">{clientName}</p>
                      {clientMobile && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {clientMobile}
                        </p>
                      )}
                      {clientAddress && (
                        <p className="text-xs text-muted-foreground mt-1">{clientAddress}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Work Description</p>
                      <p className="text-lg font-bold text-primary">{showJobCard.designType}</p>
                    </div>
                  </div>

                  {/* Items Table with Pricing */}
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-primary/10">
                        <tr className="text-[10px] uppercase font-semibold tracking-wide text-primary">
                          <th className="text-left p-3">Item Description</th>
                          <th className="text-center p-3">Size</th>
                          <th className="text-center p-3">Qty</th>
                          {canViewFinancials && <th className="text-right p-3">Amount</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {showJobCard?.materials?.map((m, idx) => {
                          const mat = materials.find((mt) => (mt.id || mt._id) === m.materialId)
                          return (
                            <tr key={idx} className="bg-background">
                              <td className="p-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-foreground">{mat?.type || m.materialSnapshot?.type || 'Material'}</span>
                                  <span className="text-muted-foreground text-xs">({mat?.thickness || m.materialSnapshot?.thickness}mm)</span>
                                  {m.isClientMaterial ? (
                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 text-[9px] px-1.5 py-0 font-medium">
                                      Client Provided
                                    </Badge>
                                  ) : m.materialUsageType === 'wastage_only' ? (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 text-[9px] px-1.5 py-0 font-medium">
                                      Wastage Scrap
                                    </Badge>
                                  ) : m.materialUsageType === 'full_plus_wastage' ? (
                                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 text-[9px] px-1.5 py-0 font-medium">
                                      Full + Scrap
                                    </Badge>
                                  ) : null}
                                </div>
                              </td>
                              <td className="p-3 text-center text-muted-foreground">
                                {m.materialUsageType === 'full_plus_wastage' ? (
                                  <span className="font-medium text-foreground">{mat?.size || m.materialSnapshot?.size || '8x4'} + [{m.extraWastageWidth}×{m.extraWastageHeight} ft scrap]</span>
                                ) : m.width && m.height ? (
                                  <span className="font-medium text-foreground">{m.width}×{m.height} ft</span>
                                ) : (
                                  <span>{mat?.size || m.materialSnapshot?.size}</span>
                                )}
                              </td>
                              <td className="p-3 text-center font-medium">
                                {m.materialUsageType === 'wastage_only' ? (
                                  <span>{m.pieces || 1} pc</span>
                                ) : (
                                  <span>{(m.quantity || 1).toFixed(2)}</span>
                                )}
                              </td>
                              {canViewFinancials && (
                                <td className="p-3 text-right font-semibold">
                                  {m.isClientMaterial ? (
                                    <span className="text-blue-600 dark:text-blue-400 text-xs">₹0 (Client)</span>
                                  ) : (
                                    `₹${m.cost.toLocaleString("en-IN")}`
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                        {/* Labour Cost Row */}
                        {canViewFinancials && (showJobCard.labourCost || 0) > 0 && (
                          <tr className="bg-background">
                            <td className="p-3" colSpan={3}>
                              <span className="font-semibold text-foreground">Labour & Finishing Charges</span>
                            </td>
                            <td className="p-3 text-right font-semibold">₹{(showJobCard.labourCost || 0).toLocaleString("en-IN")}</td>
                          </tr>
                        )}
                      </tbody>
                      {canViewFinancials && (
                        <tfoot className="bg-muted/50">
                          <tr className="border-t-2 border-primary/20">
                            <td colSpan={3} className="p-3 text-right font-bold text-foreground">Total Amount</td>
                            <td className="p-3 text-right">
                              <span className="text-lg font-bold text-foreground">₹{(showJobCard.totalValue || 0).toLocaleString("en-IN")}</span>
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>

                  {/* Payment History */}
                  {canViewFinancials && showJobCard?.payments && showJobCard.payments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payment History</p>
                      <div className="border border-border rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-green-50 dark:bg-green-950/30">
                            <tr className="text-[10px] uppercase font-semibold tracking-wide text-green-700 dark:text-green-400">
                              <th className="text-left p-2.5">Date</th>
                              <th className="text-left p-2.5">Method</th>
                              <th className="text-left p-2.5">Received By</th>
                              <th className="text-right p-2.5">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {showJobCard?.payments?.map((p, idx) => (
                              <tr key={idx}>
                                <td className="p-2.5 text-muted-foreground">{new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                                <td className="p-2.5">
                                  <span className="px-2 py-0.5 bg-muted rounded-full text-xs font-medium">{p.method}</span>
                                </td>
                                <td className="p-2.5">
                                  {p.method !== 'Cash' && p.account ? (
                                    <span className="font-medium text-primary">{p.account}</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-semibold text-green-600">₹{p.amount.toLocaleString("en-IN")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Financial Summary */}
                  {canViewFinancials && (
                    <div className="p-4 rounded-xl border-2 border-dashed border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Bill Amount</span>
                        <span className="font-semibold">₹{(showJobCard.totalValue || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Amount Received</span>
                        <span className="font-semibold text-green-600">₹{(showJobCard.advanceReceived || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between text-base pt-2 border-t border-border">
                        {(showJobCard.balanceAmount || 0) > 0 ? (
                          <>
                            <span className="font-bold text-amber-600">Balance Due</span>
                            <span className="font-bold text-amber-600">₹{(showJobCard.balanceAmount || 0).toLocaleString("en-IN")}</span>
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-green-600">Status</span>
                            <span className="font-bold text-green-600 flex items-center gap-1">✓ PAID IN FULL</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer Note */}
                  <div className="text-center pt-2 border-t border-dashed border-border">
                    <p className="text-xs text-muted-foreground">Thank you for choosing Shri Shyam CNC!</p>
                    <p className="text-[10px] text-muted-foreground mt-1">This is a computer-generated invoice.</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap justify-end gap-2 print:hidden pt-2">
                    <Button variant="outline" size="sm" onClick={() => setShowJobCard(null)} className="h-9">
                      Close
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareBill} className="h-9 gap-1.5">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                    <Button size="sm" onClick={handlePrint} className="h-9 gap-1.5">
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Record Payment Dialog */}
        <Dialog open={!!showPaymentDialog} onOpenChange={(o) => !o && setShowPaymentDialog(null)}>
          <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6 overflow-y-auto max-h-[calc(100dvh-4rem)]">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>

            {showPaymentDialog && (
              <div className="space-y-4 pt-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Order Number:</span>
                    <span className="font-bold">{showPaymentDialog?.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Client:</span>
                    <span className="font-medium">{showPaymentDialog?.clientSnapshot?.name || clients.find(c => (c.id || c._id) === showPaymentDialog.clientId)?.name || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Value:</span>
                    <span>₹{(showPaymentDialog?.totalValue || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Already Paid:</span>
                    <span className="text-green-600">₹{(showPaymentDialog?.advanceReceived || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Pending Balance:</span>
                    <span className="text-amber-600">₹{(showPaymentDialog?.balanceAmount || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Payment Amount (₹)</Label>
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Math.min(Number(e.target.value), showPaymentDialog?.balanceAmount || 0))}
                    max={showPaymentDialog?.balanceAmount}
                    min={0}
                    className="text-lg font-bold"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(Math.round((showPaymentDialog?.balanceAmount || 0) * 0.5))}
                    >
                      50%
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentAmount(showPaymentDialog?.balanceAmount || 0)}
                    >
                      Full Amount
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {paymentMethod !== 'Cash' && (
                    <div className="space-y-2">
                      <Label>Received By</Label>
                      <Select value={paymentAccount} onValueChange={(v: any) => setPaymentAccount(v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kamal Jangid">Kamal Jangid</SelectItem>
                          <SelectItem value="Hiralal Jangid">Hiralal Jangid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>New Balance After Payment:</span>
                    <span className="font-bold text-green-700">
                      ₹{Math.max(0, (showPaymentDialog.balanceAmount || 0) - paymentAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPaymentDialog(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleRecordPayment}
                    disabled={paymentAmount <= 0 || saving}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Confirm Payment
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog (Option C: For Admin & User to adjust pricing & details) */}
        <Dialog open={!!editingOrder} onOpenChange={(o) => !o && setEditingOrder(null)}>
          <DialogContent className="max-w-lg w-[95vw] max-h-[calc(100dvh-4rem)] overflow-y-auto rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-primary" />
                Edit Order & Pricing — {editingOrder?.orderNumber}
              </DialogTitle>
            </DialogHeader>

            {editingOrder && (() => {
              const client = clients.find(c => (c.id || c._id) === editingOrder.clientId)
              const clientName = editingOrder.clientSnapshot?.name || client?.name || "Unknown Client"
              const materialCost = editingOrder.materials?.reduce((sum, m) => sum + m.cost, 0) || 0
              const calculatedBalance = Math.max(0, editTotalValue - editAdvanceReceived)

              return (
                <div className="space-y-4 pt-3">
                  {/* Client & Info Summary */}
                  <div className="p-3 bg-muted/60 rounded-xl space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-semibold">{clientName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order Date:</span>
                      <span>{editingOrder.date ? new Date(editingOrder.date).toLocaleDateString("en-IN") : "N/A"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Design / Work Type</Label>
                      <Input
                        value={editDesignType}
                        onChange={(e) => setEditDesignType(e.target.value)}
                        placeholder="Design type"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Status</Label>
                      <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Order["status"])}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Delivery Due Date</Label>
                    <Input
                      type="date"
                      value={editDeliveryDate}
                      onChange={(e) => setEditDeliveryDate(e.target.value)}
                    />
                  </div>

                  {/* Financial Breakdown Section */}
                  <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">Material Cost (from sheets):</span>
                      <span className="font-semibold">₹{materialCost.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Labour Cost (₹)</Label>
                      <Input
                        type="number"
                        value={editLabourCost}
                        onChange={(e) => {
                          const newLabour = Number(e.target.value)
                          setEditLabourCost(newLabour)
                          setEditTotalValue(materialCost + newLabour)
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Total Order Value (₹)</Label>
                      <Input
                        type="number"
                        value={editTotalValue}
                        onChange={(e) => setEditTotalValue(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Advance Received (₹)</Label>
                      <Input
                        type="number"
                        value={editAdvanceReceived}
                        onChange={(e) => setEditAdvanceReceived(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border/50 text-sm">
                      <span className="font-semibold">Balance Due:</span>
                      <span className={`font-bold ${calculatedBalance > 0 ? "text-amber-600" : "text-green-600"}`}>
                        ₹{calculatedBalance.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setEditingOrder(null)}>
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-primary"
                      onClick={handleSaveEditOrder}
                      disabled={savingEdit}
                    >
                      {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Changes
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printing-area, .printing-area * {
            visibility: visible;
          }
          .printing-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none;
            border: none;
          }
        }
      `}</style>
      </div>
    </div >
  )
}
