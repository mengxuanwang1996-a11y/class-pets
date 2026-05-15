import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getLeaderboard, Ranking, GroupRanking } from '../services/leaderboard';

interface Student {
  id: string;
  name: string;
  points: number;
  level: number;
  group: string | null;
}

interface LeaderboardModalProps {
  students: Student[];
  classId: string;
  onClose: () => void;
}

export default function LeaderboardModal({ students, classId, onClose }: LeaderboardModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'individual' | 'group'>('individual');
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [groupRankings, setGroupRankings] = useState<GroupRanking[]>([]);

  useEffect(() => {
    async function fetchRankings() {
      try {
        const data = await getLeaderboard(classId);
        setRankings(data.rankings);
        setGroupRankings(data.groupRankings);
      } catch (err) {
        // Fallback to local computation
        const sorted = [...students].sort((a, b) => b.points - a.points);
        setRankings(sorted.map((s, i) => ({ ...s, rank: i + 1 })));
      }
    }
    fetchRankings();
  }, [classId, students]);

  // Fallback local computation if API fails
  const rankedStudents = useMemo(() => {
    if (rankings.length > 0) return rankings;
    return [...students].sort((a, b) => b.points - a.points);
  }, [rankings, students]);

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-amber-600 to-amber-800';
      default:
        return 'from-muted to-muted';
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-3xl max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--pet-orange) 100%)' }}
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <h2 className="text-card-foreground">{t('leaderboard.title')}</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('individual')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'individual'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('leaderboard.individual')}
              </button>
              <button
                onClick={() => setActiveTab('group')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'group'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('leaderboard.group')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'individual' && (
              <div className="space-y-3">
                {rankedStudents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('leaderboard.noData')}
                  </div>
                ) : (
                  rankedStudents.map((student, index) => {
                    const rank = index + 1;
                    const medal = getMedalIcon(rank);

                    return (
                      <div
                        key={student.id}
                        className={`flex items-center gap-4 p-4 rounded-[var(--radius-xl)] transition-all ${
                          rank <= 3
                            ? 'bg-gradient-to-r ' + getRankColor(rank) + ' text-white shadow-lg'
                            : 'bg-muted/30 border border-border hover:bg-muted/50'
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-12 text-center">
                          {medal ? (
                            <span className="text-3xl">{medal}</span>
                          ) : (
                            <span className={`text-xl font-bold ${rank <= 3 ? 'text-white' : 'text-muted-foreground'}`}>
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-medium ${
                            rank <= 3
                              ? 'bg-white/20 text-white'
                              : 'bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white'
                          }`}
                        >
                          {student.name.charAt(0)}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className={`font-medium mb-1 ${rank <= 3 ? 'text-white' : 'text-card-foreground'}`}>
                            {student.name}
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}>
                              {t('leaderboard.level')} {student.level}
                            </span>
                            {student.group && (
                              <>
                                <span className={rank <= 3 ? 'text-white/60' : 'text-border'}>·</span>
                                <span className={rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}>
                                  {student.group}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${rank <= 3 ? 'text-white' : 'text-[var(--primary)]'}`}>
                            {student.points >= 0 ? '+' : ''}{student.points}
                          </div>
                          <div className={`text-xs ${rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {t('leaderboard.points')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'group' && (
              <div className="space-y-3">
                {groupRankings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {t('leaderboard.noGroups')}
                  </div>
                ) : (
                  groupRankings.map((group, index) => {
                    const rank = index + 1;
                    const medal = getMedalIcon(rank);

                    return (
                      <div
                        key={group.name}
                        className={`flex items-center gap-4 p-4 rounded-[var(--radius-xl)] transition-all ${
                          rank <= 3
                            ? 'bg-gradient-to-r ' + getRankColor(rank) + ' text-white shadow-lg'
                            : 'bg-muted/30 border border-border hover:bg-muted/50'
                        }`}
                      >
                        {/* Rank */}
                        <div className="w-12 text-center">
                          {medal ? (
                            <span className="text-3xl">{medal}</span>
                          ) : (
                            <span className={`text-xl font-bold ${rank <= 3 ? 'text-white' : 'text-muted-foreground'}`}>
                              #{rank}
                            </span>
                          )}
                        </div>

                        {/* Icon */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            rank <= 3 ? 'bg-white/20' : 'bg-muted'
                          }`}
                        >
                          <svg className={`w-6 h-6 ${rank <= 3 ? 'text-white' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className={`font-medium mb-1 ${rank <= 3 ? 'text-white' : 'text-card-foreground'}`}>
                            {group.name}
                          </div>
                          <div className={`text-sm ${rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {group.memberCount} {t('leaderboard.members')}
                          </div>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${rank <= 3 ? 'text-white' : 'text-[var(--primary)]'}`}>
                            {group.totalPoints >= 0 ? '+' : ''}{group.totalPoints}
                          </div>
                          <div className={`text-xs ${rank <= 3 ? 'text-white/80' : 'text-muted-foreground'}`}>
                            {t('leaderboard.totalPoints')}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
