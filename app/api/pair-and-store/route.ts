import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { performBidirectionalPairing } from '@/lib/perform-pairing'

// Expected JSON body: { rows: [{ index_number, name, original_name, cwa, year_of_admission?, department?, semester? }] }

// Function to parse the name format: "LASTNAME, Firstname MiddleName (Miss)"
function parseName(fullName: string): { firstName: string; lastName: string; middleName: string; isMiss: boolean } {
  // Remove (Miss) if present and track if it was there
  const isMiss = fullName.includes("(Miss)")
  const nameWithoutMiss = fullName.replace(/\s*\(Miss\)\s*/, "").trim()
  
  // Split by comma to separate last name from first/middle names
  const parts = nameWithoutMiss.split(",")
  
  if (parts.length >= 2) {
    const lastName = parts[0].trim()
    const firstMiddleNames = parts[1].trim()
    
    // Split first/middle names by space
    const nameParts = firstMiddleNames.split(" ")
    const firstName = nameParts[0] || ""
    const middleName = nameParts.slice(1).join(" ") || ""
    
    return {
      firstName: firstName,
      lastName: lastName,
      middleName: middleName,
      isMiss: isMiss
    }
  } else {
    // Fallback if no comma found
    const nameParts = nameWithoutMiss.split(" ")
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    
    return {
      firstName: firstName,
      lastName: lastName,
      middleName: "",
      isMiss: isMiss
    }
  }
}

// Function to convert text to title case
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}
export async function POST(req: NextRequest) {
  try {
    const { rows } = await req.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows array required' }, { status: 400 })
    }

    console.log('📋 Processing upload request with', rows.length, 'students')
    console.log('📊 Sample row data:', {
      index_number: rows[0]?.index_number,
      original_name: rows[0]?.original_name,
      name: rows[0]?.name,
      department: rows[0]?.department,
      year_of_admission: rows[0]?.year_of_admission,
      semester: rows[0]?.semester
    })

    // Test database connection first
    await prisma.$connect()

    // Upsert students using Prisma - do them one by one to handle conflicts properly
    const students = []
    for (const r of rows) {
      try {
        // Parse the original name format properly
        const originalName = r.original_name || r.name
        const parsedName = parseName(originalName)
        
        // Combine first name and middle name for the firstname field
        // Convert lastname to title case
        const firstName = `${parsedName.firstName} ${parsedName.middleName}`.trim()
        const lastName = toTitleCase(parsedName.lastName)
        
        console.log('Parsing name:', { 
          original: originalName, 
          firstName, 
          lastName 
        })

        const studentData = {
          index_number: r.index_number,
          firstname: firstName,
          lastname: lastName,
          current_cwa: r.cwa ? parseFloat(r.cwa.toString()) : null,
          year_of_admission: r.year_of_admission ?? new Date().getFullYear(),
          department: r.department || null,
          updated_at: new Date(),
        }

        const student = await prisma.students.upsert({
          where: { index_number: r.index_number },
          update: studentData,
          create: studentData,
        })
        
        students.push(student)
        
        if (students.length <= 3) { // Only log first few for debugging
          console.log(`✅ Saved student: ${firstName} ${lastName} (${r.index_number})`)
        }
      } catch (error) {
        console.error('Error upserting student:', r.index_number, error)
        console.error('Student data that failed:', JSON.stringify(r, null, 2))
        // Continue with other students rather than failing completely
      }
    }

    console.log('✅ Students successfully saved to Supabase:', students.length, 'records')

    // Check if this is Year 1, Sem 1 upload (when pairing should occur)
    // Note: year_of_admission is actually the year group (1, 2, 3, 4)
    const isYear1Sem1 = rows.some((r: any) => 
      parseInt(r.year_of_admission?.toString()) === 1 && parseInt(r.semester?.toString()) === 1
    )
    
    console.log('Upload configuration check:', {
      yearGroup: rows[0]?.year_of_admission,
      semester: rows[0]?.semester,
      department: rows[0]?.department,
      isYear1Sem1: isYear1Sem1
    })
    
    if (isYear1Sem1) {
      console.log('✅ Year 1, Semester 1 detected - Will create pairings!')
    } else {
      console.log('ℹ️ Not Year 1, Semester 1 - Only updating student records')
    }
    
    if (isYear1Sem1) {
      // For Year 1, Sem 1: Use department-based pairing
      const department = rows[0]?.department
      if (!department) {
        return NextResponse.json({ error: 'Department is required for Year 1, Sem 1 uploads' }, { status: 400 })
      }

      // Fetch active lecturers from the same department using Prisma
      console.log('Fetching lecturers for department:', department)
      
      const lecturers = await prisma.lecturer.findMany({
        where: {
          department: department,
          status: 'active'
        }
      })

      console.log('Found lecturers:', lecturers.length)

      if (!lecturers || lecturers.length === 0) {
        return NextResponse.json({ 
          error: `No active lecturers found for department: ${department}` 
        }, { status: 400 })
      }

      // Transform types to satisfy algorithm
      const studentObjs = students.map((s: any) => ({
        index_number: s.index_number,
        name: `${s.firstname} ${s.lastname}`,
        firstname: s.firstname,
        lastname: s.lastname,
        cwa: s.current_cwa ? parseFloat(s.current_cwa.toString()) : 0,
        year: 1,
      }))

      const lecturerObjs = lecturers.map((l: any, index: number) => ({ 
        id: index + 1, // Convert UUID to sequential number for pairing algorithm
        uuid: l.id, // Keep original UUID for database operations
        firstname: l.firstname, 
        lastname: l.lastname,
        department: l.department
      }))

      console.log('Generating pairings for', studentObjs.length, 'students and', lecturerObjs.length, 'lecturers')

      const pairings = performBidirectionalPairing(studentObjs as any, lecturerObjs as any)

      console.log('Generated pairs:', pairings.length)

      // Save pairings to database using Prisma
      let savedPairingsCount = 0
      for (const p of pairings) {
        try {
          const student = students.find((s: any) => s.index_number === p.student.index_number)
          const lecturer = lecturerObjs.find((l: any) => l.id === p.lecturer.id)
          
          if (!student?.id || !lecturer?.uuid) {
            console.error('Missing student or lecturer for pairing:', p)
            continue
          }

          await prisma.pairings.upsert({
            where: { student_id: student.id },
            update: {
              lecturer_id: lecturer.uuid,
              paired_at: new Date(),
              updated_at: new Date(),
              status: 'active'
            },
            create: {
              student_id: student.id,
              lecturer_id: lecturer.uuid,
              paired_at: new Date(),
              updated_at: new Date(),
              status: 'active'
            }
          })
          
          savedPairingsCount++
        } catch (error) {
          console.error('Error saving pairing:', error)
          // Continue with other pairings rather than failing completely
        }
      }

      console.log('✅ Pairings successfully saved to Supabase:', savedPairingsCount, 'records')

      return NextResponse.json({ 
        inserted: students.length, 
        pairings: savedPairingsCount,
        department: department,
        message: `✅ Successfully saved ${students.length} students to Supabase database and created ${savedPairingsCount} pairings with ${department} lecturers`
      })
    } else {
      // For other semesters: Just update student data without pairing
      return NextResponse.json({ 
        inserted: students.length, 
        pairings: 0,
        message: `✅ Successfully saved ${students.length} students to Supabase database (Year ${rows[0]?.year_of_admission}, Semester ${rows[0]?.semester} - No pairings created)`
      })
    }
  } catch (err: any) {
    console.error('API Error in pair-and-store:', err)
    return NextResponse.json({ 
      error: `Database operation failed: ${err.message}`,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 })
  }
} 