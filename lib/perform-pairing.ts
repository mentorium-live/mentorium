
import { Student, Lecturer, Pairing } from '@/hooks/use-pairing-store';

export function performBidirectionalPairing(
  students: Student[],
  lecturers: Lecturer[]
): Pairing[] {
  if (students.length === 0 || lecturers.length === 0) {
    return [];
  }

  // Sort students by CWA in descending order
  const sortedStudents = [...students].sort((a, b) => b.cwa - a.cwa);
  
  const pairings: Pairing[] = [];
  let studentIndex = 0;
  let direction = 1; // 1 for left-to-right, -1 for right-to-left
  
  while (studentIndex < sortedStudents.length) {
    // Determine lecturer order for this pass
    let lecturerIndices: number[];
    if (direction === 1) {
      // Left-to-right: M1 → M2 → M3 → MN
      lecturerIndices = Array.from({ length: lecturers.length }, (_, i) => i);
    } else {
      // Right-to-left: MN → ... → M3 → M2 → M1
      lecturerIndices = Array.from({ length: lecturers.length }, (_, i) => lecturers.length - 1 - i);
    }
    
    // Assign students to lecturers in current direction
    for (const lecturerIndex of lecturerIndices) {
      if (studentIndex >= sortedStudents.length) break;
      
      pairings.push({
        student: sortedStudents[studentIndex],
        lecturer: lecturers[lecturerIndex]
      });
      studentIndex++;
    }
    
    // Switch direction for next pass
    direction *= -1;
  }

  return pairings;
}
