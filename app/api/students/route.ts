import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching students from database...')
    const students = await prisma.students.findMany({
      include: {
        pairings: {
          include: {
            lecturers: true
          }
        }
      },
      orderBy: {
        index_number: 'asc'
      }
    });
    
    console.log(`Found ${students.length} students in database`)
    
    // Format the response to match frontend expectations
    const formattedStudents = students.map(student => ({
      pairing_id: student.pairings?.id || null,
      student_id: student.id,
      index_number: student.index_number,
      student_name: `${student.firstname} ${student.lastname}`,
      current_cwa: student.current_cwa ? Number(student.current_cwa) : null,
      year_of_admission: student.year_of_admission,
      department: (student as any).department || null,
      lecturer_id: student.pairings?.lecturers?.id || null,
      lecturer_name: student.pairings?.lecturers ? 
        `${student.pairings.lecturers.firstname} ${student.pairings.lecturers.lastname}` : 
        null,
      paired_at: student.pairings?.paired_at?.toISOString() || null,
      status: student.pairings?.status || null,
    }));
    
    console.log(`Returning ${formattedStudents.length} formatted students`)
    return NextResponse.json(formattedStudents);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { index_number, firstname, lastname, year_of_admission, current_cwa, department } = body

    if (!index_number || !firstname || !lastname || !year_of_admission) {
      return NextResponse.json(
        { error: 'Index number, first name, last name, and year of admission are required' },
        { status: 400 }
      )
    }

    const student = await prisma.students.create({
      data: {
        index_number,
        firstname,
        lastname,
        year_of_admission,
        current_cwa: current_cwa ? parseFloat(current_cwa) : null,
        ...(department && { department: department as any }),
        updated_at: new Date(),
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, index_number, firstname, lastname, year_of_admission, current_cwa, department } = body

    if (!id || !index_number || !firstname || !lastname || !year_of_admission) {
      return NextResponse.json(
        { error: 'ID, index number, first name, last name, and year of admission are required' },
        { status: 400 }
      )
    }

    const student = await prisma.students.update({
      where: { id },
      data: {
        index_number,
        firstname,
        lastname,
        year_of_admission,
        current_cwa: current_cwa ? parseFloat(current_cwa) : null,
        ...(department && { department: department as any }),
        updated_at: new Date(),
      }
    })

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
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
        { error: 'Student ID is required' },
        { status: 400 }
      )
    }

    await prisma.students.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
