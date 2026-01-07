import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { InteriorProject } from '@/lib/models/interiors'

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
        const project = await InteriorProject.create(body)
        return NextResponse.json(project, { status: 201 })
    } catch (error: any) {
        console.error('Error creating project:', error)
        return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 })
    }
}
