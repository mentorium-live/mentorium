# Test Accounts Setup

This document explains the test accounts configuration for the Mentorium platform.

## Authentication & Role Assignment

The application uses email-based role assignment with the following rules:

### Coordinator Access
- **Email**: `tsadjaidoo@knust.edu.gh`
- **Role**: Academic Coordinator
- **Access**: Full coordinator dashboard with student management, lecturer management, upload functionality, and analytics

### Lecturer Access
- **Test Accounts**: 
  - `ekeelson@knust.edu.gh` (Eliel KEELSON - Computer Engineering)
  - `iacquah@knust.edu.gh` (Isaac ACQUAH - Biomedical Engineering)
- **Role**: Lecturer
- **Access**: Lecturer dashboard with mentee management and analytics

### General Lecturer Access
- **Pattern**: Any email ending with `@knust.edu.gh` or `@st.knust.edu.gh`
- **Role**: Lecturer
- **Access**: Lecturer dashboard (same as test accounts)

## Test Account Details

### Eliel KEELSON
- **Email**: `ekeelson@knust.edu.gh`
- **Department**: Computer Engineering
- **Status**: Active
- **Access**: Lecturer dashboard

### Isaac ACQUAH
- **Email**: `iacquah@knust.edu.gh`
- **Department**: Biomedical Engineering
- **Status**: Active
- **Access**: Lecturer dashboard

## Testing the Setup

### 1. Run the Test Script
```bash
npm run test:lecturer-accounts
```

This will:
- Check if test lecturer accounts exist in the database
- Verify role assignment logic
- Display usage instructions

### 2. Seed the Database (if needed)
If the test accounts don't exist in your database:

```bash
npm run db:seed-all
```

This will add all lecturer accounts including the test accounts.

### 3. Test Login
1. Start the development server: `npm run dev`
2. Navigate to the login page
3. Use one of the test accounts to login:
   - `ekeelson@knust.edu.gh`
   - `iacquah@knust.edu.gh`
4. You should be redirected to the lecturer dashboard

## Role-Based Access Control

### Coordinator Routes (`/coordinator/*`)
- Only accessible to `tsadjaidoo@knust.edu.gh`
- Includes: students, lecturers, upload, analytics

### Lecturer Routes (`/lecturer/*`)
- Accessible to all lecturer accounts
- Includes: mentees, analytics

### Public Routes
- `/login`, `/signup`, `/forgot-password`
- Accessible to all users

## Implementation Details

The role assignment logic is implemented in:
- `components/auth-provider.tsx` - Main role determination
- `components/ui/auth-form.tsx` - Signup role assignment
- `components/role-context.tsx` - Role state management

## Security Notes

- Only KNUST domain emails (`@knust.edu.gh`, `@st.knust.edu.gh`) are allowed
- Role assignment is based on email patterns
- Coordinator access is restricted to `tsadjaidoo@knust.edu.gh`
- All other valid emails get lecturer access by default

## Troubleshooting

### Test Accounts Not Found
If the test script shows no accounts found:
1. Run `npm run db:seed-all` to populate the database
2. Check your database connection in `.env.local`
3. Verify Prisma is properly configured

### Login Issues
1. Ensure the development server is running
2. Check that Supabase authentication is configured
3. Verify the email domain restrictions are working

### Role Assignment Issues
1. Clear browser localStorage to reset role state
2. Check the auth provider logs for role assignment
3. Verify the email patterns in the role assignment logic
