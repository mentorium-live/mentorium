
import { create } from 'zustand';

// Define the types for our data
interface Result {
  index_number: string;
  academic_year: string; // e.g. "2023/2024"
  semester: string;      // e.g. "Semester 1" or numeric
  cwa: number;
}

interface Student {
  index_number: string;
  firstname: string;
  lastname: string;
  cwa: number;
  results?: Result[]; // NEW – full semester history
  year?: number; // NEW – year of study (1-4)
}

interface Lecturer {
  id: number;
  firstname: string;
  lastname: string;
  email?: string;
  department?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
}

interface Pairing {
  student: Student;
  lecturer: Lecturer;
}

interface UploadEntry {
  id: number;
  fileName: string;
  rows: number;
  date: string; // ISO
  paired: boolean;
  status: "success" | "failed" | "pending";
}

// Define the state and actions for our store
interface PairingState {
  students: Student[];
  lecturers: Lecturer[];
  pairings: Pairing[];
  uploads: UploadEntry[]; // NEW
  addStudent: (student: Omit<Student, 'results'>) => void; // NEW – add single student
  addLecturersBulk: (lecturers: Omit<Lecturer, 'id' | 'created_at'>[]) => void; // NEW – bulk add lecturers
  setStudents: (students: Student[]) => void;
  setLecturers: (lecturers: Lecturer[]) => void;
  addLecturer: (lecturer: Omit<Lecturer, 'id' | 'created_at'>) => void;
  updateLecturer: (id: number, lecturer: Partial<Lecturer>) => void;
  deleteLecturer: (id: number) => void;
  performPairing: () => void;
  addSemesterResults: (results: Result[]) => void; // NEW
  addUploadEntry: (entry: UploadEntry) => void; // NEW
}

// Create the Zustand store
export const usePairingStore = create<PairingState>((set, get) => ({
  students: [],
  lecturers: [
    // Mock data for lecturers until we have a database
         { 
       id: 1, 
       firstname: 'Dr. Ada',
       lastname: 'Lovelace',
       email: 'ada.lovelace@knust.edu.gh',
       department: 'Computer Engineering',
       status: 'active',
       created_at: '2024-01-15'
     },
     { 
       id: 2, 
       firstname: 'Dr. Grace',
       lastname: 'Hopper',
       email: 'grace.hopper@knust.edu.gh',
       department: 'Computer Engineering',
       status: 'active',
       created_at: '2024-01-20'
     },
     { 
       id: 3, 
       firstname: 'Dr. Alan',
       lastname: 'Turing',
       email: 'alan.turing@knust.edu.gh',
       department: 'Computer Engineering',
       status: 'active',
       created_at: '2024-02-01'
     },
     { 
       id: 4, 
       firstname: 'Dr. John von',
       lastname: 'Neumann',
       email: 'john.neumann@knust.edu.gh',
       department: 'Computer Engineering',
       status: 'inactive',
       created_at: '2024-02-10'
     },
         { 
       id: 5, 
       firstname: 'Dr. Kwesi',
       lastname: 'Mensah',
       email: 'kwesi.mensah@knust.edu.gh',
       department: 'Computer Engineering',
       status: 'active',
       created_at: '2024-02-15'
     },
     { 
       id: 6, 
       firstname: 'Dr. Abena',
       lastname: 'Osei',
       email: 'abena.osei@knust.edu.gh',
       department: 'Biomedical Engineering',
       status: 'active',
       created_at: '2024-02-20'
     },
  ],
  pairings: [],
  uploads: [],
  addStudent: (newStudent) => {
    set((state) => {
      // Avoid duplicates by index_number
      const exists = state.students.some((s) => s.index_number === newStudent.index_number);
      if (exists) return state;
      return {
        students: [
          ...state.students,
          { ...newStudent, year: newStudent.year ?? 1 },
        ],
      };
    });
  },

  addLecturersBulk: (newLecturers) => {
    // Reuse addLecturer logic to generate IDs
    newLecturers.forEach((lec) => {
      const { addLecturer } = get();
      addLecturer(lec);
    });
  },
  setStudents: (students) => set({
    students: students.map(s => ({ ...s, year: s.year ?? 1 }))
  }),
  setLecturers: (lecturers) => set({ lecturers }),
  addLecturer: (lecturer) => {
    const { lecturers } = get();
    const newLecturer: Lecturer = {
      ...lecturer,
      id: Math.max(...lecturers.map(l => l.id), 0) + 1,
      created_at: new Date().toISOString().split('T')[0],
      status: lecturer.status || 'active'
    };
    set({ lecturers: [...lecturers, newLecturer] });
  },
  updateLecturer: (id, updatedLecturer) => {
    const { lecturers } = get();
    set({
      lecturers: lecturers.map(lecturer =>
        lecturer.id === id ? { ...lecturer, ...updatedLecturer } : lecturer
      )
    });
  },
  deleteLecturer: (id) => {
    const { lecturers } = get();
    set({ lecturers: lecturers.filter(lecturer => lecturer.id !== id) });
  },
  performPairing: () => {
    const { students, lecturers } = get();
    
    // Only use active lecturers for pairing
    const activeLecturers = lecturers.filter(l => l.status === 'active');
    
    if (students.length === 0 || activeLecturers.length === 0) {
      return;
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
        lecturerIndices = Array.from({ length: activeLecturers.length }, (_, i) => i);
      } else {
        // Right-to-left: MN → ... → M3 → M2 → M1
        lecturerIndices = Array.from({ length: activeLecturers.length }, (_, i) => activeLecturers.length - 1 - i);
      }
      
      // Assign students to lecturers in current direction
      for (const lecturerIndex of lecturerIndices) {
        if (studentIndex >= sortedStudents.length) break;
        
        pairings.push({
          student: sortedStudents[studentIndex],
          lecturer: activeLecturers[lecturerIndex]
        });
        studentIndex++;
      }
      
      // Switch direction for next pass
      direction *= -1;
    }

    set({ pairings });
  },
  addSemesterResults: (newResults) => {
    set((state) => {
      const studentsMap = new Map(state.students.map((s) => [s.index_number, s]));

      newResults.forEach((r) => {
        const student = studentsMap.get(r.index_number);
        if (!student) return; // Ignore unknown students for now

        // Initialize results array if missing
        if (!student.results) student.results = [];

        // Check if result for same acad year + semester exists – replace, else push
        const existingIndex = student.results.findIndex(
          (res) =>
            res.academic_year === r.academic_year && res.semester === r.semester
        );
        if (existingIndex !== -1) {
          student.results[existingIndex] = r;
        } else {
          student.results.push(r);
        }

        // Update latest CWA
        student.cwa = r.cwa;
      });

      return {
        students: Array.from(studentsMap.values()),
      };
    });
  },
  addUploadEntry: (entry) => {
    set((state) => ({ uploads: [...state.uploads, entry] }))
  },
}));

// Export types for use in other files
export type { Student, Lecturer, Pairing, Result, UploadEntry };
