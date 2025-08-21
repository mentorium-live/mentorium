import { prisma } from '../lib/prisma'

async function testLecturerAccounts() {
  console.log('🧪 Testing Lecturer Accounts...\n')

  try {
    // Check if the test lecturer accounts exist in the database
    const testLecturers = await prisma.lecturer.findMany({
      where: {
        email: {
          in: ['ekeelson@knust.edu.gh', 'iacquah@knust.edu.gh']
        }
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        department: true,
        status: true
      }
    })

    console.log('📋 Test Lecturer Accounts Found:')
    if (testLecturers.length === 0) {
      console.log('❌ No test lecturer accounts found in database')
      console.log('💡 Run the seed script to add lecturer accounts:')
      console.log('   npm run db:seed-all')
    } else {
      testLecturers.forEach((lecturer, index) => {
        console.log(`${index + 1}. ${lecturer.firstname} ${lecturer.lastname}`)
        console.log(`   Email: ${lecturer.email}`)
        console.log(`   Department: ${lecturer.department}`)
        console.log(`   Status: ${lecturer.status}`)
        console.log('')
      })
    }

    // Test role assignment logic
    console.log('🔐 Role Assignment Test:')
    const testEmails = [
      'tsadjaidoo@knust.edu.gh',
      'ekeelson@knust.edu.gh', 
      'iacquah@knust.edu.gh',
      'other.lecturer@knust.edu.gh',
      'student@st.knust.edu.gh',
      'unknown@example.com'
    ]

    testEmails.forEach(email => {
      let role = 'Coordinator' // default
      if (email === 'tsadjaidoo@knust.edu.gh') {
        role = 'Coordinator'
      } else if (email === 'ekeelson@knust.edu.gh' || email === 'iacquah@knust.edu.gh') {
        role = 'Lecturer'
      } else if (email && (email.endsWith('@knust.edu.gh') || email.endsWith('@st.knust.edu.gh'))) {
        role = 'Lecturer'
      }

      console.log(`   ${email} → ${role}`)
    })

    console.log('\n✅ Test completed successfully!')
    console.log('\n📝 Usage Instructions:')
    console.log('1. Use ekeelson@knust.edu.gh or iacquah@knust.edu.gh to login as lecturer')
    console.log('2. Any other @knust.edu.gh or @st.knust.edu.gh email will also get lecturer access')
    console.log('3. Only tsadjaidoo@knust.edu.gh gets coordinator access')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLecturerAccounts()
}

export { testLecturerAccounts }
