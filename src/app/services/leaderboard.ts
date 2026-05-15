import { apiRequest } from './api';

export interface Ranking {
  id: string;
  name: string;
  points: number;
  level: number;
  rank: number;
  group?: string | null;
}

export interface GroupRanking {
  id: string;
  name: string;
  totalPoints: number;
  memberCount: number;
  rank: number;
}

export interface LeaderboardResult {
  rankings: Ranking[];
  groupRankings: GroupRanking[];
}

export async function getLeaderboard(classId: string): Promise<LeaderboardResult> {
  return apiRequest<LeaderboardResult>(`/leaderboard?classId=${classId}`);
}
