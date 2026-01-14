import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorProject } from '@/lib/models/interiors'
import { interiorProjectSchema, formatValidationErrors } from '@/lib/validations'

// GET all projects with optional pagination and filters
export async function GET(request: NextRequest) {
    try {
        await dbConnect()

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '0') // 0 = no limit
        const search = searchParams.get('search') || ''
        const status = searchParams.get('status') || ''
        const projectType = searchParams.get('projectType') || ''

        // Build query filter
        const filter: Record<string, unknown> = {}

        if (status && status !== 'all') {
            filter.status = status
        }

        if (projectType && projectType !== 'all') {
            filter.projectType = projectType
        }

        if (search) {
            // Search by project name or number
            filter.$or = [
                { projectName: { $regex: search, $options: 'i' } },
                { projectNumber: { $regex: search, $options: 'i' } }
            ]
        }

        // If no pagination requested, return all (backward compatible)
        if (limit === 0) {
            const projects = await InteriorProject.find(filter).sort({ createdAt: -1 })
            return NextResponse.json(projects)
        }

        // Paginated query
        const skip = (page - 1) * limit
        const [projects, total] = await Promise.all([
            InteriorProject.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
            InteriorProject.countDocuments(filter)
        ])

        return NextResponse.json({
            data: projects,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        })
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
    }
}

// POST create new project
export async function POST(request: NextRequest) {
    try {
        await dbConnect()
        const body = await request.json()

        // Validate input
        const validation = interiorProjectSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: formatValidationErrors(validation.error) },
                { status: 400 }
            )
        }

        const project = await InteriorProject.create(validation.data)
        return NextResponse.json(project, { status: 201 })
    } catch (error: unknown) {
        console.error('Error creating project:', error)
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }
}
