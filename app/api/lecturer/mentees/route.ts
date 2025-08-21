import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/lecturer/mentees?email=...
// Returns mentees (students) assigned to the lecturer with the given email
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const lecturer = await prisma.lecturer.findUnique({ where: { email } })
    if (!lecturer) {
      return NextResponse.json({ mentees: [] })
    }

    // Pairings for this lecturer, include student
    const pairings = await prisma.pairings.findMany({
      where: { lecturer_id: lecturer.id, status: 'active' },
      include: {
        students: true,
      },
      orderBy: { paired_at: 'asc' },
    })

    const currentYear = new Date().getFullYear()
    const mentees = pairings.map((p) => ({
      index_number: p.students.index_number,
      firstname: p.students.firstname,
      lastname: p.students.lastname,
      current_cwa: p.students.current_cwa ? Number(p.students.current_cwa) : 0,
      year_of_admission: p.students.year_of_admission,
      year: Math.max(1, currentYear - (p.students.year_of_admission ?? currentYear) + 1),
    }))

    return NextResponse.json({ mentees })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


