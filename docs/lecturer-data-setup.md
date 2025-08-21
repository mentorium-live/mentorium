# Lecturer Data Setup Guide

## Issue
The lecturer data is not showing in the `/coordinator/teachers` page because the Supabase database is not configured or seeded with data.

## Current Status
- The frontend is configured to fetch data from Supabase
- The seed scripts exist but require Supabase environment variables
- Environment variables are not configured

## Solutions

### Option 1: Configure Supabase Environment Variables

1. Create a `.env.local` file in the project root with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration (for Prisma)
DATABASE_URL=your_database_connection_string
DIRECT_URL=your_direct_database_connection_string
```

2. Get these values from your Supabase project dashboard

3. Run the Supabase seed script:
```bash
npm run db:seed-supabase
```

### Option 2: Use Test Data (Temporary)

The `useLecturers` hook has been modified to return test data when Supabase is not configured. This allows you to see the UI working with sample data.

### Option 3: Use Prisma Instead of Supabase

If you prefer to use Prisma for data fetching:

1. Run the Prisma seed scripts:
```bash
npm run db:seed-all
```

2. Modify the `useLecturers` hook to use Prisma instead of Supabase

## Test Data Currently Available

The following test lecturers are available when Supabase is not configured:

- **Biomedical Engineering:**
  - Isaac ACQUAH (iacquah@knust.edu.gh)
  - Prince Ebenezer ADJEI (padjei@knust.edu.gh)

- **Computer Engineering:**
  - Eliel KEELSON (ekeelson@knust.edu.gh)
  - Kwame Osei BOATENG (kboateng@knust.edu.gh)
  - Emmanuel Kofi AKOWUAH (eakowuah@knust.edu.gh) - inactive

## Next Steps

1. Configure Supabase environment variables
2. Run the seed script to populate the database
3. The lecturer data should then appear in the `/coordinator/teachers` page

## Troubleshooting

- Check browser console for any connection errors
- Verify environment variables are correctly set
- Ensure the Supabase project has the `lecturers` table created
- Check that the table schema matches the expected structure 