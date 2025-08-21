import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST { index_numbers: string[] }
// Returns: { [index_number]: lecturer_full_name }
export async function POST(req: NextRequest) {
  try {
    const { index_numbers } = await req.json()
    if (!Array.isArray(index_numbers) || index_numbers.length === 0) {
      return NextResponse.json({ error: 'index_numbers array required' }, { status: 400 })
    }

    const students = await prisma.students.findMany({
      where: { index_number: { in: index_numbers.map(String) } },
      include: {
        pairings: {
          include: { lecturers: true }
        }
      }
    })

    const mapping: Record<string, string> = {}
    for (const s of students) {
      const lec = s.pairings?.lecturers
      if (lec) {
        mapping[s.index_number] = `${lec.firstname} ${lec.lastname}`
      }
    }
    return NextResponse.json(mapping)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


