import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bulk upsert students into Supabase (via Prisma)
// Expected body: { rows: [{ index_number, name?, original_name?, cwa?, year_of_admission?, department? }] }

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

function parseName(fullName: string): { firstName: string; lastName: string; middleName: string } {
  const nameWithoutMiss = (fullName || '').replace(/\s*\(Miss\)\s*/, '').trim()
  const parts = nameWithoutMiss.split(',')
  if (parts.length >= 2) {
    const lastName = parts[0].trim()
    const firstMiddleNames = parts[1].trim()
    const nameParts = firstMiddleNames.split(' ')
    const firstName = nameParts[0] || ''
    const middleName = nameParts.slice(1).join(' ') || ''
    return { firstName, lastName, middleName }
  }
  const tokens = nameWithoutMiss.split(' ')
  return { firstName: tokens[0] || '', lastName: tokens.slice(1).join(' ') || '', middleName: '' }
}

export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }

    await prisma.$connect()

    let saved = 0
    for (const r of rows) {
      try {
        const originalName = r.original_name || r.name || ''
        const parsed = parseName(originalName)
        const firstName = [parsed.firstName, parsed.middleName].filter(Boolean).join(' ').trim()
        const lastName = toTitleCase(parsed.lastName)

        const data = {
          index_number: String(r.index_number),
          firstname: firstName,
          lastname: lastName,
          current_cwa: r.cwa != null ? parseFloat(r.cwa.toString()) : null,
          year_of_admission: r.year_of_admission ?? new Date().getFullYear(),
          department: r.department || null,
          updated_at: new Date(),
        }

        await prisma.students.upsert({
          where: { index_number: data.index_number },
          update: data,
          create: data,
        })
        saved += 1
      } catch (e) {
        // continue with others
      }
    }

    return NextResponse.json({ inserted: saved, message: `Saved ${saved} students` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


