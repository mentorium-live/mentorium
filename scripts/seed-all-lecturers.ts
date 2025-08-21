import { seedLecturers, disconnect, LecturerData } from '../lib/seed-utils'

const biomedicalEngineeringLecturers: LecturerData[] = [
  {
    firstname: "Isaac",
    lastname: "ACQUAH",
    email: "iacquah@knust.edu.gh",
    department: "Biomedical Engineering",
    status: "active"
  },
  {
    firstname: "Prince Ebenezer",
    lastname: "ADJEI",
    email: "padjei@knust.edu.gh",
    department: "Biomedical Engineering",
    status: "active"
  },
  {
    firstname: "Daniel Akwei",
    lastname: "ADDO",
    email: "daddo@knust.edu.gh",
    department: "Biomedical Engineering",
    status: "active"
  },
  {
    firstname: "Dorothy Adwoa Yacoba",
    lastname: "AGYAPONG",
    email: "dagyapong@knust.edu.gh",
    department: "Biomedical Engineering",
    status: "active"
  },
  {
    firstname: "Prince",
    lastname: "ODAME",
    email: "podame@knust.edu.gh",
    department: "Biomedical Engineering",
    status: "active"
  }
]

const computerEngineeringLecturers: LecturerData[] = [
  {
    firstname: "Eliel",
    lastname: "KEELSON",
    email: "ekeelson@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Kwame Osei",
    lastname: "BOATENG",
    email: "kboateng@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Emmanuel Kofi",
    lastname: "AKOWUAH",
    email: "eakowuah@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Bright",
    lastname: "YEBOAH-AKOWUAH",
    email: "byakowuah@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Andrew Selasi",
    lastname: "AGBEMENU",
    email: "aagbemenu@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Henry",
    lastname: "NUNOO-MENSAH",
    email: "hnmensah@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  },
  {
    firstname: "Eric Tutu",
    lastname: "TCHAO",
    email: "etchao@knust.edu.gh",
    department: "Computer Engineering",
    status: "active"
  }
]

async function main() {
  try {
    console.log('Starting to seed all lecturers...\n')
    
    // Seed Biomedical Engineering lecturers
    await seedLecturers(biomedicalEngineeringLecturers, "Biomedical Engineering")
    console.log('')
    
    // Seed Computer Engineering lecturers
    await seedLecturers(computerEngineeringLecturers, "Computer Engineering")
    console.log('')
    
    console.log('All lecturers seeding completed successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  } finally {
    await disconnect()
  }
}

main() 