import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorProject } from '@/lib/models/interiors'
import { interiorProjectSchema, formatValidationErrors } from '@/lib/validations'

// GET all projects
export async function GET() {
    try {
        await dbConnect()
        const projects = await InteriorProject.find({}).sort({ createdAt: -1 })
        return NextResponse.json(projects)
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
        const message = error instanceof Error ? error.message : 'Failed to create project'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
