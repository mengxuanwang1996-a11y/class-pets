import { apiRequest } from './api';

export interface GroupMember {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  class_id: string;
  name: string;
  members: GroupMember[];
  created_at: string;
}

export async function getGroups(classId: string): Promise<Group[]> {
  return apiRequest<Group[]>(`/groups?classId=${classId}`);
}

export async function createGroup(classId: string, name: string, memberIds: string[]): Promise<Group> {
  return apiRequest<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify({ classId, name, memberIds }),
  });
}

export async function randomGroups(classId: string, groupCount: number): Promise<Group[]> {
  return apiRequest<Group[]>('/groups/random', {
    method: 'POST',
    body: JSON.stringify({ classId, groupCount }),
  });
}

export async function updateGroup(id: string, name: string, memberIds: string[]): Promise<Group> {
  return apiRequest<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, memberIds }),
  });
}

export async function deleteGroup(id: string): Promise<{ message: string }> {
  return apiRequest(`/groups/${id}`, { method: 'DELETE' });
}
