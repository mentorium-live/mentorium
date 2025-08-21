import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

const departments = [
  'Computer Science',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Engineering',
  'Economics',
  'Psychology'
]

const firstNames = [
  'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma',
  'Robert', 'Olivia', 'William', 'Ava', 'Richard', 'Isabella', 'Joseph', 'Sophia',
  'Thomas', 'Mia', 'Christopher', 'Charlotte', 'Charles', 'Amelia', 'Daniel', 'Harper',
  'Matthew', 'Evelyn', 'Anthony', 'Abigail', 'Mark', 'Emily', 'Donald', 'Elizabeth',
  'Steven', 'Sofia', 'Paul', 'Avery', 'Andrew', 'Ella', 'Joshua', 'Madison',
  'Kenneth', 'Scarlett', 'Kevin', 'Victoria', 'Brian', 'Aria', 'George', 'Grace',
  'Timothy', 'Chloe', 'Ronald', 'Camila', 'Jason', 'Penelope', 'Edward', 'Layla'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker'
]

function generateStudentData(count: number) {
  const students = []
  const currentYear = new Date().getFullYear()
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
    const department = departments[Math.floor(Math.random() * departments.length)]
    const yearOfAdmission = currentYear - Math.floor(Math.random() * 4) // Random year 1-4
    const cwa = Math.random() * 40 + 50 // Random CWA between 50-90
    const indexNumber = String(1000000 + i + 1) // Sequential index numbers starting from 1000001
    
    students.push({
      id: randomUUID(),
      index_number: indexNumber,
      firstname: firstName,
      lastname: lastName,
      year_of_admission: yearOfAdmission,
      current_cwa: parseFloat(cwa.toFixed(2)),
      department: department,
      inserted_at: new Date(),
      updated_at: new Date()
    })
  }
  
  return students
}

async function seedStudents() {
  try {
    console.log('🌱 Starting to seed students...')
    
    // Generate 50 sample students
    const students = generateStudentData(50)
    
    console.log(`📝 Inserting ${students.length} students...`)
    
    // Insert students in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < students.length; i += batchSize) {
      const batch = students.slice(i, i + batchSize)
      await prisma.students.createMany({
        data: batch,
        skipDuplicates: true
      })
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(students.length / batchSize)}`)
    }
    
    console.log('🎉 Successfully seeded students!')
    
    // Verify the data
    const count = await prisma.students.count()
    console.log(`📊 Total students in database: ${count}`)
    
    // Show some sample data
    const sampleStudents = await prisma.students.findMany({
      take: 5,
      orderBy: { index_number: 'asc' }
    })
    
    console.log('\n📋 Sample students:')
    sampleStudents.forEach(student => {
      console.log(`  - ${student.firstname} ${student.lastname} (${student.index_number}) - CWA: ${student.current_cwa}, Year: ${student.year_of_admission}, Dept: ${student.department}`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding students:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeding
seedStudents()
