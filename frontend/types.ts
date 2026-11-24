
export enum Role {
  Admin = 'Admin',
  Teacher = 'Teacher',
  Student = 'Student',
}

export interface User {
  id: string;
  name: string;
  role: Role;
  department?: string;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  year: number;
  contact: string;
}

export interface Teacher {
  id: string;
  name: string;
  teacherId: string;
  department: string;
  contact: string;
  subjects: string[];
}

export interface Course {
  id: string;
  courseId: string;
  name: string;
  credits: number;
  department: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: string; // YYYY-MM-DD
  present: boolean;
}
