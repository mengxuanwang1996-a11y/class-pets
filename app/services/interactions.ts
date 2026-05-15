import { apiRequest } from './api';

export interface RandomPickResult {
  picked: Array<{ id: string; name: string }>;
}

export async function randomPick(
  classId: string,
  count: number,
  excludeStudentIds?: string[]
): Promise<RandomPickResult> {
  return apiRequest<RandomPickResult>('/interactions/random-pick', {
    method: 'POST',
    body: JSON.stringify({ classId, count, excludeStudentIds }),
  });
}
