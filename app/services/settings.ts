import { apiRequest } from './api';

export interface PointItem {
  id: string;
  icon: string;
  name: string;
  points: number;
  sort_order: number;
}

export interface Settings {
  pointItems: PointItem[];
  levelConfig: number[];
  settings: Record<string, any>;
}

export async function getSettings(): Promise<Settings> {
  return apiRequest<Settings>('/settings');
}

export async function saveSettings(data: { pointItems?: PointItem[]; levelConfig?: number[] }): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function saveSetting(key: string, value: any): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/settings/setting', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}
