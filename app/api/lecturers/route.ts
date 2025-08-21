import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const department = searchParams.get('department')
    const status = searchParams.get('status')

    console.log('API: Fetching lecturers with filters:', { department, status })

    const whereClause: any = {}

    // Only filter by status if explicitly provided
    if (status) {
      whereClause.status = status
    }

    if (department) {
      whereClause.department = department
    }

    const lecturers = await prisma.lecturer.findMany({
      where: whereClause,
      orderBy: {
        firstname: 'asc'
      }
    })

    console.log('API: Found lecturers:', lecturers.length)
    return NextResponse.json(lecturers)
  } catch (error) {
    console.error('Error fetching lecturers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lecturers' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstname, lastname, email, department, status } = body

    if (!firstname || !lastname || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    const lecturer = await prisma.lecturer.create({
      data: {
        firstname,
        lastname,
        email,
        department,
        status: status || 'active'
      }
    })

    return NextResponse.json(lecturer)
  } catch (error) {
    console.error('Error creating lecturer:', error)
    return NextResponse.json(
      { error: 'Failed to create lecturer' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, firstname, lastname, email, department, status } = body

    if (!id || !firstname || !lastname || !email) {
      return NextResponse.json(
        { error: 'ID, first name, last name, and email are required' },
        { status: 400 }
      )
    }

    const lecturer = await prisma.lecturer.update({
      where: { id },
      data: {
        firstname,
        lastname,
        email,
        department,
        status
      }
    })

    return NextResponse.json(lecturer)
  } catch (error) {
    console.error('Error updating lecturer:', error)
    return NextResponse.json(
      { error: 'Failed to update lecturer' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Lecturer ID is required' },
        { status: 400 }
      )
    }

    await prisma.lecturer.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting lecturer:', error)
    return NextResponse.json(
      { error: 'Failed to delete lecturer' },
      { status: 500 }
    )
  }
}
