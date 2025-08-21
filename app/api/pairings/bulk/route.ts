import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bulk save pairings
// Expected body: { pairings: [{ student_index_number, lecturer_id }] }

export async function POST(req: NextRequest) {
  try {
    const { pairings } = await req.json()
    if (!Array.isArray(pairings) || pairings.length === 0) {
      return NextResponse.json({ error: 'pairings array required' }, { status: 400 })
    }

    await prisma.$connect()

    let saved = 0
    for (const p of pairings) {
      try {
        const student = await prisma.students.findUnique({ where: { index_number: String(p.student_index_number) } })
        if (!student) continue
        await prisma.pairings.upsert({
          where: { student_id: student.id },
          update: {
            lecturer_id: p.lecturer_id,
            status: 'active',
            paired_at: new Date(),
            updated_at: new Date(),
          },
          create: {
            student_id: student.id,
            lecturer_id: p.lecturer_id,
            status: 'active',
            paired_at: new Date(),
            updated_at: new Date(),
          }
        })
        saved += 1
      } catch (e) {
        // continue
      }
    }

    return NextResponse.json({ saved, message: `Saved ${saved} pairings` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


