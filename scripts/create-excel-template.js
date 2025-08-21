const XLSX = require('xlsx');

// Create a new workbook
const workbook = XLSX.utils.book_new();

// Sample data for the template matching the actual format
const templateData = [
  {
    STUDENTID: "20884333",
    INDEXNO: "1822522",
    NAME: "BOATENG, Delasi Ama (Miss)",
    CWA: 82.3
  },
  {
    STUDENTID: "20881667",
    INDEXNO: "1828322",
    NAME: "SARPONG, Fred Nana",
    CWA: 80.4
  },
  {
    STUDENTID: "20886484",
    INDEXNO: "1814322",
    NAME: "AGBOZO, Kwaku",
    CWA: 75.3
  },
  {
    STUDENTID: "20910042",
    INDEXNO: "1817322",
    NAME: "AMPONG, Kelvin",
    CWA: 71.3
  },
  {
    STUDENTID: "20881895",
    INDEXNO: "1813522",
    NAME: "ADDO, Nana Yaa (Miss)",
    CWA: 69.4
  }
];

// Convert to worksheet
const worksheet = XLSX.utils.json_to_sheet(templateData);

// Add the worksheet to the workbook
XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

// Write the file
XLSX.writeFile(workbook, 'public/templates/results_upload_template.xlsx');

console.log('Excel template created successfully!');
console.log('Template includes the following columns:');
console.log('- STUDENTID: Student ID number');
console.log('- INDEXNO: Index number');
console.log('- NAME: Full name in format "LASTNAME, Firstname MiddleName (Miss)"');
console.log('- CWA: Cumulative Weighted Average');
console.log('');
console.log('Note: Names should follow the format "LASTNAME, Firstname MiddleName" with "(Miss)" for female students.'); 