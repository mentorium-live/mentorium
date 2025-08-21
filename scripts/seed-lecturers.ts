import { prisma } from '../lib/prisma'

async function seedLecturers() {
  console.log('🌱 Seeding lecturers...')

  const sampleLecturers = [
    // Computer Engineering lecturers
    {
      firstname: 'Dr. John',
      lastname: 'Smith',
      email: 'john.smith@knust.edu.gh',
      department: 'Computer Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Mary',
      lastname: 'Johnson',
      email: 'mary.johnson@knust.edu.gh',
      department: 'Computer Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. David',
      lastname: 'Wilson',
      email: 'david.wilson@knust.edu.gh',
      department: 'Computer Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Sarah',
      lastname: 'Brown',
      email: 'sarah.brown@knust.edu.gh',
      department: 'Computer Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Michael',
      lastname: 'Davis',
      email: 'michael.davis@knust.edu.gh',
      department: 'Computer Engineering',
      status: 'active'
    },
    // Biomedical Engineering lecturers
    {
      firstname: 'Dr. Ahmed',
      lastname: 'Hassan',
      email: 'ahmed.hassan@knust.edu.gh',
      department: 'Biomedical Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Fatima',
      lastname: 'Ali',
      email: 'fatima.ali@knust.edu.gh',
      department: 'Biomedical Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Kwame',
      lastname: 'Asante',
      email: 'kwame.asante@knust.edu.gh',
      department: 'Biomedical Engineering',
      status: 'active'
    },
    {
      firstname: 'Dr. Abena',
      lastname: 'Osei',
      email: 'abena.osei@knust.edu.gh',
      department: 'Biomedical Engineering',
      status: 'active'
    }
  ]

  try {
    // Check if lecturers already exist
    const existingCount = await prisma.lecturer.count()
    
    if (existingCount > 0) {
      console.log(`📚 Found ${existingCount} existing lecturers in database`)
      
      const compEngCount = await prisma.lecturer.count({
        where: { department: 'Computer Engineering', status: 'active' }
      })
      
      const biomedCount = await prisma.lecturer.count({
        where: { department: 'Biomedical Engineering', status: 'active' }
      })
      
      console.log(`   - Computer Engineering: ${compEngCount} lecturers`)
      console.log(`   - Biomedical Engineering: ${biomedCount} lecturers`)
      
      if (compEngCount > 0 && biomedCount > 0) {
        console.log('✅ Database already has lecturers for both departments')
        return
      }
    }

    // Insert sample lecturers
    console.log('📝 Inserting sample lecturers...')
    
    const result = await prisma.lecturer.createMany({
      data: sampleLecturers,
      skipDuplicates: true
    })

    console.log(`✅ Successfully added ${result.count} lecturers to the database`)
    
    // Verify insertion
    const finalCount = await prisma.lecturer.count()
    const compEngFinalCount = await prisma.lecturer.count({
      where: { department: 'Computer Engineering', status: 'active' }
    })
    const biomedFinalCount = await prisma.lecturer.count({
      where: { department: 'Biomedical Engineering', status: 'active' }
    })
    
    console.log(`📊 Final counts:`)
    console.log(`   - Total lecturers: ${finalCount}`)
    console.log(`   - Computer Engineering: ${compEngFinalCount} lecturers`)
    console.log(`   - Biomedical Engineering: ${biomedFinalCount} lecturers`)
    
  } catch (error) {
    console.error('❌ Error seeding lecturers:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedLecturers().catch(console.error)
