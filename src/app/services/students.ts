import { apiRequest } from './api';

export interface Student {
  id: string;
  class_id: string;
  name: string;
  points: number;
  badges: number;
  pet_type: string | null;
  level: number;
  current_food: number;
  group_id: string | null;
  groupName: string | null;
  created_at: string;
  updated_at: string;
}

export interface PointHistory {
  id: string;
  student_id: string;
  item_name: string;
  points: number;
  created_at: string;
}

export async function getStudents(classId: string): Promise<Student[]> {
  return apiRequest<Student[]>(`/students?classId=${classId}`);
}

export async function createStudent(classId: string, name: string): Promise<Student> {
  return apiRequest<Student>('/students', {
    method: 'POST',
    body: JSON.stringify({ classId, name }),
  });
}

export async function batchCreateStudents(classId: string, names: string[]): Promise<Student[]> {
  return apiRequest<Student[]>('/students/batch', {
    method: 'POST',
    body: JSON.stringify({ classId, names }),
  });
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<Student> {
  return apiRequest<Student>(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function addPoints(studentId: string, itemName: string, points: number): Promise<Student> {
  return apiRequest<Student>(`/students/${studentId}/points`, {
    method: 'POST',
    body: JSON.stringify({ itemName, points }),
  });
}

export async function assignPet(studentId: string, petType: string): Promise<Student> {
  return apiRequest<Student>(`/students/${studentId}/pet`, {
    method: 'POST',
    body: JSON.stringify({ petType }),
  });
}

export async function getPointHistory(studentId: string): Promise<PointHistory[]> {
  return apiRequest<PointHistory[]>(`/students/${studentId}/history`);
}

export async function deleteStudent(id: string): Promise<{ message: string }> {
  return apiRequest(`/students/${id}`, { method: 'DELETE' });
}
