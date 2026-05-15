import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LevelUpModal from './LevelUpModal';

interface Student {
  id: string;
  name: string;
  petType: string | null;
  level: number;
  currentFood: number;
  points: number;
  group: string | null;
  shieldUsedToday?: number;
}

interface PointItem {
  id: string;
  icon: string;
  name: string;
  points: number;
}

interface StudentDetailPageProps {
  student: Student;
  levelFood: number[];
  addPointItems: PointItem[];
  deductPointItems: PointItem[];
  maxShieldPerDay: number;
  useShield: boolean;
  onUpdate: (student: Student) => void;
  onClose: () => void;
}

export default function StudentDetailPage({
  student,
  levelFood,
  addPointItems,
  deductPointItems,
  maxShieldPerDay,
  useShield,
  onUpdate,
  onClose
}: StudentDetailPageProps) {
  const { t } = useLanguage();
  const [currentStudent, setCurrentStudent] = useState(student);
  const [showShieldEffect, setShowShieldEffect] = useState(false);
  const [shieldBlocked, setShieldBlocked] = useState(0);
  const [levelUpData, setLevelUpData] = useState<{ oldLevel: number; newLevel: number } | null>(null);

  const currentLevelFood = levelFood[currentStudent.level - 1];
  const nextLevelFood = currentStudent.level < 10 ? levelFood[currentStudent.level] : currentLevelFood;
  const foodNeeded = nextLevelFood - currentStudent.currentFood;
  const progress = currentStudent.level < 10
    ? ((currentStudent.currentFood - currentLevelFood) / (nextLevelFood - currentLevelFood)) * 100
    : 100;

  const handlePointClick = (item: PointItem) => {
    let updatedStudent = { ...currentStudent };
    let actualPoints = item.points;
    let blocked = 0;

    // Handle deduction with shield
    if (item.points < 0 && useShield) {
      const shieldUsed = updatedStudent.shieldUsedToday || 0;
      const shieldRemaining = maxShieldPerDay - shieldUsed;

      if (shieldRemaining > 0) {
        // Shield can block some or all deduction
        blocked = Math.min(Math.abs(item.points), shieldRemaining);
        actualPoints = item.points + blocked; // Reduce deduction
        updatedStudent.shieldUsedToday = shieldUsed + blocked;

        // Show shield effect
        setShieldBlocked(blocked);
        setShowShieldEffect(true);
        setTimeout(() => setShowShieldEffect(false), 1500);
      }
    }

    // Update points and food
    updatedStudent.points += actualPoints;
    if (actualPoints > 0) {
      updatedStudent.currentFood += actualPoints;

      // Level up check
      const oldLevel = updatedStudent.level;
      while (updatedStudent.level < 10 && updatedStudent.currentFood >= levelFood[updatedStudent.level]) {
        updatedStudent.level++;
      }

      // Show level up animation if leveled up
      if (updatedStudent.level > oldLevel) {
        setLevelUpData({ oldLevel, newLevel: updatedStudent.level });
      }
    }

    setCurrentStudent(updatedStudent);
    onUpdate(updatedStudent);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 bg-card border-b border-border z-10"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{t('studentDetail.back')}</span>
          </button>
          <h2 className="text-card-foreground">{currentStudent.name}</h2>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* Pet Display & Progress */}
        <div
          className="bg-card rounded-[var(--radius-2xl)] p-6 relative overflow-hidden"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          {/* Shield Effect Overlay */}
          {showShieldEffect && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="shield-effect">
                <svg className="w-32 h-32 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white shield-text">
                    -{shieldBlocked}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Pet */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-[var(--radius-2xl)] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative">
                <div className="text-7xl breathing-animation">
                  {currentStudent.petType}
                </div>
                {/* Level Badge */}
                <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--pet-orange)] flex items-center justify-center text-white font-bold shadow-lg">
                  {currentStudent.level}
                </div>
              </div>
            </div>

            {/* Progress Info */}
            <div className="flex-1 w-full">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {t('home.petCard.level')} {currentStudent.level}
                  </span>
                  <span className="text-lg font-bold text-[var(--primary)]">
                    {currentStudent.level < 10 ? t('studentDetail.needFood', { count: foodNeeded }) : t('studentDetail.maxLevel')}
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, var(--primary-light) 0%, var(--primary) 100%)'
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-sm">
                  <span className="text-muted-foreground">
                    🍖 {currentStudent.currentFood} / {nextLevelFood}
                  </span>
                  <span className={`font-medium ${currentStudent.points >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
                    {t('home.petCard.points')}: {currentStudent.points >= 0 ? '+' : ''}{currentStudent.points}
                  </span>
                </div>
              </div>

              {/* Shield Info */}
              {useShield && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--primary)]/10 rounded-[var(--radius-lg)]">
                  <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                  </svg>
                  <span className="text-xs text-[var(--primary)]">
                    {t('studentDetail.shieldRemaining', {
                      count: maxShieldPerDay - (currentStudent.shieldUsedToday || 0)
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add Points Section */}
        <div>
          <h3 className="text-card-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
            {t('settings.points.addPoints')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {addPointItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePointClick(item)}
                className="bg-card rounded-[var(--radius-xl)] p-4 border-2 border-border hover:border-[var(--success)] hover:bg-[var(--success)]/5 transition-all active:scale-95"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-sm text-card-foreground text-center font-medium">
                    {item.name}
                  </span>
                  <span className="px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] rounded-full text-sm font-bold">
                    +{item.points}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deduct Points Section */}
        <div>
          <h3 className="text-card-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--destructive)]"></span>
            {t('settings.points.deductPoints')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {deductPointItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePointClick(item)}
                className="bg-card rounded-[var(--radius-xl)] p-4 border-2 border-border hover:border-[var(--destructive)] hover:bg-[var(--destructive)]/5 transition-all active:scale-95"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-sm text-card-foreground text-center font-medium">
                    {item.name}
                  </span>
                  <span className="px-3 py-1 bg-[var(--destructive)]/10 text-[var(--destructive)] rounded-full text-sm font-bold">
                    {item.points}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes breathing {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.02) translateY(-2px);
          }
        }

        .breathing-animation {
          animation: breathing 3s ease-in-out infinite;
        }

        @keyframes shieldPulse {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0;
            transform: scale(1.2);
          }
        }

        @keyframes shieldTextPop {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(10px);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) translateY(-5px);
          }
          100% {
            opacity: 0;
            transform: scale(0.8) translateY(-20px);
          }
        }

        .shield-effect {
          position: relative;
          animation: shieldPulse 1.5s ease-out;
        }

        .shield-text {
          animation: shieldTextPop 1.5s ease-out;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
      `}</style>

      {/* Level Up Modal */}
      {levelUpData && currentStudent.petType && (
        <LevelUpModal
          studentName={currentStudent.name}
          oldLevel={levelUpData.oldLevel}
          newLevel={levelUpData.newLevel}
          petType={currentStudent.petType}
          onClose={() => setLevelUpData(null)}
        />
      )}
    </div>
  );
}
