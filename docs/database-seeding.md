# Database Seeding Documentation

This document describes how to seed the database with lecturer data using Prisma ORM.

## Prisma Schema

The database uses a `Lecturer` model with the following structure:

```prisma
model Lecturer {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  firstname  String
  lastname   String
  email      String?  @unique
  department String?
  status     String?  @default("active")
  created_at DateTime @default(now()) @db.Timestamptz

  @@map("lecturers")
}
```

**Note**: The `program` field has been removed from the Lecturer model. All program information is now handled through the `department` field.

## Available Scripts

### Generate Prisma Client
```bash
npm run db:generate
```

### Seed Biomedical Engineering Lecturers
```bash
npm run db:seed-biomed
```

### Seed Computer Engineering Lecturers
```bash
npm run db:seed-computer
```

### Seed All Lecturers
```bash
npm run db:seed-all
```

These scripts will:
- Check if lecturers already exist for the specified department
- If they don't exist, insert the lecturers from the respective department
- Skip insertion if lecturers already exist to avoid duplicates

## Seeded Data

### Biomedical Engineering Lecturers
1. **Dr. Isaac ACQUAH** - iacquah@knust.edu.gh
2. **Dr. Prince Ebenezer ADJEI** - padjei@knust.edu.gh
3. **Dr. Daniel Akwei ADDO** - daddo@knust.edu.gh
4. **Dr. Dorothy Adwoa Yacoba AGYAPONG** - dagyapong@knust.edu.gh
5. **Dr. Prince ODAME** - podame@knust.edu.gh

### Computer Engineering Lecturers
1. **Dr. Eliel KEELSON** - ekeelson@knust.edu.gh
2. **Prof. Kwame Osei BOATENG** - kboateng@knust.edu.gh
3. **Prof. Emmanuel Kofi AKOWUAH** - eakowuah@knust.edu.gh
4. **Dr. Bright YEBOAH-AKOWUAH** - byakowuah@knust.edu.gh
5. **Dr. Andrew Selasi AGBEMENU** - aagbemenu@knust.edu.gh
6. **Dr. Henry NUNOO-MENSAH** - hnmensah@knust.edu.gh
7. **Dr. Eric Tutu TCHAO** - etchao@knust.edu.gh

## Utility Functions

The `lib/seed-utils.ts` file provides utility functions for seeding:

- `seedLecturers(lecturers: LecturerData[], department: string)` - Seed lecturers for a specific department
- `clearLecturersByDepartment(department: string)` - Clear all lecturers from a specific department
- `disconnect()` - Disconnect from the database

## Adding New Departments

To add lecturers for a new department:

1. Create a new script in `scripts/` directory
2. Import the utility functions from `lib/seed-utils.ts`
3. Define the lecturer data
4. Use the `seedLecturers` function
5. Add a new npm script in `package.json`

Example:
```typescript
import { seedLecturers, disconnect, LecturerData } from '../lib/seed-utils'

const newDepartmentLecturers: LecturerData[] = [
  {
    firstname: "John",
    lastname: "DOE",
    email: "jdoe@knust.edu.gh",
    department: "New Department",
    status: "active"
  }
  // ... more lecturers
]

async function main() {
  try {
    await seedLecturers(newDepartmentLecturers, "New Department")
    console.log('New Department lecturers seeded successfully!')
  } catch (error) {
    console.error('Seeding failed:', error)
    process.exit(1)
  } finally {
    await disconnect()
  }
}

main()
```

## Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:pull` - Pull schema from database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:reset` - Reset database and run migrations 