import { apiRequest } from './api';

export interface ClassItem {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export async function getClasses(): Promise<ClassItem[]> {
  return apiRequest<ClassItem[]>('/classes');
}

export async function createClass(name: string): Promise<ClassItem> {
  return apiRequest<ClassItem>('/classes', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateClass(id: string, name: string): Promise<ClassItem> {
  return apiRequest<ClassItem>(`/classes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

export async function deleteClass(id: string): Promise<{ message: string }> {
  return apiRequest(`/classes/${id}`, { method: 'DELETE' });
}
