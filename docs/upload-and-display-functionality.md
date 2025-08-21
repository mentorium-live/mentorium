# Upload and Display Functionality

## Overview

This document explains how the file upload functionality works and how uploaded students and pairings are displayed in the students directory.

## Upload Process

### 1. File Upload
- Users can upload Excel files (.xlsx, .xls) containing student data
- The system supports drag-and-drop and click-to-upload functionality
- Files must contain columns for: Student ID, Index Number, Name, CWA

### 2. Data Parsing
- The system parses the Excel file and extracts student information
- Names are parsed from the format: "LASTNAME, Firstname MiddleName (Miss)"
- CWA values are validated and converted to numbers
- Department, Year Group, and Semester are set from the upload configuration

### 3. Upload Configuration
Before uploading, users must configure:
- **Year Group**: 1-4 (represents the year of study)
- **Semester**: 1-2
- **Department**: Computer Engineering or Biomedical Engineering

### 4. Pairing Logic
- **Year 1, Semester 1**: Automatically creates pairings with lecturers from the same department
- **Other semesters**: Only updates student data without creating pairings

## Database Storage

### Students Table
- `index_number`: Unique identifier for each student
- `firstname`, `lastname`: Parsed from the uploaded name
- `current_cwa`: Academic performance score
- `year_of_admission`: Year group (1-4)
- `department`: Department from upload configuration
- `updated_at`: Timestamp of last update

### Pairings Table
- `student_id`: Reference to students table
- `lecturer_id`: Reference to lecturers table
- `paired_at`: When the pairing was created
- `status`: Active/inactive status
- `updated_at`: Timestamp of last update

## API Endpoints

### POST /api/pair-and-store
- Accepts: `{ rows: [{ index_number, name, cwa, year_of_admission, department, semester }] }`
- Returns: `{ inserted: number, pairings: number, message: string }`
- Handles both student creation and pairing generation

### GET /api/students
- Returns: Array of students with their pairing information
- Includes lecturer names and pairing status
- Used by the students directory page

## Display in Students Directory

### Features
- **Search**: Filter by student name or index number
- **Performance Filter**: Filter by CWA ranges (Excellent, Good, Fair, Needs Attention)
- **Department Filter**: Filter by department
- **Year Filter**: Filter by year of study
- **Lecturer Filter**: Filter by assigned mentor
- **Sorting**: Sort by any column (name, index, CWA, year, department, mentor)
- **Pagination**: Configurable rows per page

### Statistics
- Total number of students
- Number of assigned vs unassigned students
- Average CWA across all students
- Performance distribution breakdown

### Table Columns
1. **Index Number**: Student's unique identifier
2. **Name**: Full name (firstname + lastname)
3. **Year**: Year of study (calculated from year_of_admission)
4. **Current CWA**: Academic performance with performance badge
5. **Department**: Student's department
6. **Mentor**: Assigned lecturer with avatar

## Refresh Mechanism

After successful upload:
1. Success message is displayed with upload details
2. After 2 seconds, user is redirected to students directory
3. Students directory automatically refreshes to show new data
4. Manual refresh button is available for immediate updates

## Error Handling

### Upload Errors
- Invalid file format
- Missing required columns
- Database connection issues
- No lecturers available for pairing
- Duplicate index numbers

### Display Errors
- Network connectivity issues
- Database query failures
- Invalid data format

## Usage Workflow

1. **Upload Configuration**: Set year group, semester, and department
2. **File Upload**: Drag and drop or select Excel file
3. **Data Preview**: Review parsed data and statistics
4. **Pairing Preview** (Year 1, Sem 1 only): Review generated pairings
5. **Save to Database**: Confirm upload and save to database
6. **Redirect**: Automatically redirected to students directory
7. **View Results**: See uploaded students and pairings in the directory

## File Format Requirements

### Required Columns
- `STUDENTID` or `studentid`: 8-digit student ID
- `INDEXNO` or `indexno`: 7-digit index number
- `NAME` or `name`: Full name in format "LASTNAME, Firstname MiddleName (Miss)"
- `CWA` or `cwa`: Cumulative Weighted Average (0-100)

### Optional Columns
- Any additional columns will be ignored
- Column names are case-insensitive

## Troubleshooting

### Common Issues
1. **"No active lecturers found"**: Add lecturers to the system first
2. **"Invalid file format"**: Ensure file is Excel (.xlsx or .xls)
3. **"Missing required columns"**: Check column names match requirements
4. **"Duplicate index numbers"**: Students with same index number will be updated

### Debug Information
- Console logs show detailed upload process
- API responses include success/error details
- Database operations are logged for troubleshooting
