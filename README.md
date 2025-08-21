# Mentorium

A data-driven platform for mentorship management at KNUST (Kwame Nkrumah University of Science and Technology).

## Features

### Role-Based Access Control
- **Academic Coordinator**:
  - Student directory management
  - Teacher management  
  - Excel file upload for student data
  - Automated student-lecturer pairing
- **Lecturer**:
  - View assigned mentees
  - Performance analytics dashboard

### Excel Upload Functionality
- Upload Excel files (.xlsx, .xls) containing student data
- Automatic parsing and validation
- Support for standard format: STUDENTID, INDEXNO, NAME, CWA
- Name parsing: "LASTNAME, Firstname MiddleName (Miss)" format
- Real-time preview of parsed data
- Automated pairing with available lecturers
- Database storage with conflict detection

### Data Management
- Student directory with search and filtering
- Teacher management with CRUD operations
- Performance tracking and analytics


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Excel Upload Functionality

The application supports Excel file uploads for student results with comprehensive analytics.

### Template Generation

To create the Excel template for student uploads:

```bash
npm run create-excel-template
```

This will generate `public/templates/results_upload_template.xlsx` with the required column structure.

### Required Excel Columns:
- `STUDENTID`: Student ID number
- `INDEXNO`: Index number
- `NAME`: Full name in format "LASTNAME, Firstname MiddleName (Miss)"
- `CWA`: Cumulative Weighted Average

**Name Format**: Names should follow the format "LASTNAME, Firstname MiddleName" with "(Miss)" for female students.

### Features:
- **Year/Semester Configuration**: Upload results for different year groups (1-4) and semesters (1-2)
- **Real-time Analytics**: Automatic calculation of performance statistics
- **Performance Distribution**: Categorizes students by CWA ranges (Excellent, Good, Fair, Needs Improvement)
- **Quick Insights**: Provides percentage breakdowns and class averages
- **Conditional Pairing**: Year 1, Semester 1 enables student-lecturer pairing
- **Data Preview**: Paginated table view of uploaded data with pairing status


## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI components
- **Database**: Supabase
- **File Processing**: XLSX library for Excel files
- **State Management**: Zustand, SWR
- **Icons**: Tabler Icons, Lucide React