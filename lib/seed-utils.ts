import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface LecturerData {
  firstname: string
  lastname: string
  email: string
  department: string
  status?: string
}

export async function seedLecturers(lecturers: LecturerData[], department: string) {
  try {
    console.log(`Starting to seed ${department} lecturers...`)
    
    // Check if lecturers already exist
    const existingLecturers = await prisma.lecturer.findMany({
      where: {
        department: department
      }
    })
    
    if (existingLecturers.length > 0) {
      console.log(`Found ${existingLecturers.length} existing ${department} lecturers. Skipping insertion.`)
      return existingLecturers
    }
    
    // Insert the lecturers
    const result = await prisma.lecturer.createMany({
      data: lecturers.map(lecturer => ({
        ...lecturer,
        status: lecturer.status || "active"
      })),
      skipDuplicates: true
    })
    
    console.log(`Successfully inserted ${result.count} ${department} lecturers.`)
    
    // Verify the insertion
    const insertedLecturers = await prisma.lecturer.findMany({
      where: {
        department: department
      }
    })
    
    console.log(`Inserted ${department} lecturers:`)
    insertedLecturers.forEach(lecturer => {
      console.log(`- ${lecturer.firstname} ${lecturer.lastname} (${lecturer.email})`)
    })
    
    return insertedLecturers
    
  } catch (error) {
    console.error(`Error seeding ${department} lecturers:`, error)
    throw error
  }
}

export async function clearLecturersByDepartment(department: string) {
  try {
    console.log(`Clearing ${department} lecturers...`)
    
    const result = await prisma.lecturer.deleteMany({
      where: {
        department: department
      }
    })
    
    console.log(`Deleted ${result.count} ${department} lecturers.`)
    return result.count
    
  } catch (error) {
    console.error(`Error clearing ${department} lecturers:`, error)
    throw error
  }
}

export async function disconnect() {
  await prisma.$disconnect()
} 