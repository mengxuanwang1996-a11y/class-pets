import { apiRequest } from './api';

export interface StoreItem {
  id: string;
  name: string;
  icon: string;
  badges_required: number;
  stock: number;
}

export interface ExchangeRecord {
  id: string;
  student_id: string;
  student_name: string;
  item_id: string;
  item_name: string;
  item_icon: string;
  created_at: string;
}

export async function getStoreItems(): Promise<StoreItem[]> {
  return apiRequest<StoreItem[]>('/store/items');
}

export async function createStoreItem(data: { name: string; icon: string; badgesRequired: number; stock?: number }): Promise<StoreItem> {
  return apiRequest<StoreItem>('/store/items', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStoreItem(id: string, data: Partial<StoreItem>): Promise<StoreItem> {
  return apiRequest<StoreItem>(`/store/items/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteStoreItem(id: string): Promise<{ message: string }> {
  return apiRequest(`/store/items/${id}`, { method: 'DELETE' });
}

export async function exchangeItem(studentId: string, itemId: string): Promise<{ student: any; item: StoreItem; exchangeId: string }> {
  return apiRequest(`/store/exchange`, {
    method: 'POST',
    body: JSON.stringify({ studentId, itemId }),
  });
}

export async function getExchangeHistory(classId?: string): Promise<ExchangeRecord[]> {
  const url = classId ? `/store/history?classId=${classId}` : '/store/history';
  return apiRequest<ExchangeRecord[]>(url);
}
