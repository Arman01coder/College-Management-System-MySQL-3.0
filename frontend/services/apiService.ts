import { User, Student, Teacher, Course, Attendance, Role } from '../types';

export interface Credentials {
  username: string;
  password: string;
}

export interface RegisterDetails {
  name: string;
  username: string;
  password: string;
  role: Role;
}

const API_BASE_URL = 'http://localhost:5000/api';

const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
});

const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }
  return data;
};


export const apiService = {
  async login(credentials: Credentials): Promise<{ user: User, token: string } | null> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  async register(details: RegisterDetails): Promise<{ user?: User, error?: string }> {
     try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(details),
        });
        const data = await handleResponse(response);
        return { user: data };
    } catch (error: any) {
        return { error: error.message };
    }
  },

  async getStudents(token: string): Promise<Student[]> {
    const response = await fetch(`${API_BASE_URL}/students`, { headers: getAuthHeaders(token) });
    return handleResponse(response);
  },

  async deleteStudent(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  async getTeachers(token: string): Promise<Teacher[]> {
    const response = await fetch(`${API_BASE_URL}/teachers`, { headers: getAuthHeaders(token) });
    return handleResponse(response);
  },

  async deleteTeacher(id: string, token: string): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },

  async getCourses(token: string): Promise<Course[]> {
    const response = await fetch(`${API_BASE_URL}/courses`, { headers: getAuthHeaders(token) });
    return handleResponse(response);
  },

  async deleteCourse(id: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse(response);
  },
  
  async getAttendance(token: string): Promise<Attendance[]> {
    const response = await fetch(`${API_BASE_URL}/attendance`, { headers: getAuthHeaders(token) });
    return handleResponse(response);
  },

  async getStudentAttendance(studentId: string, token: string): Promise<Attendance[]> {
    const response = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`, { headers: getAuthHeaders(token) });
    return handleResponse(response);
  },
  
  async saveAttendance(records: {studentId: string, courseId: string, date: string, present: boolean}[], token: string): Promise<void> {
     const response = await fetch(`${API_BASE_URL}/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ records }),
     });
     return handleResponse(response);
  }
};
