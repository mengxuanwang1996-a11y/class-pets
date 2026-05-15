import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import PetSelectionModal from './PetSelectionModal';

interface Student {
  id: string;
  name: string;
  petType: string | null;
  level: number;
  currentFood: number;
  points: number;
  group: string | null;
  badges?: number;
}

interface PetCardProps {
  student: Student;
  levelFood: number[];
  onPetSelect: (studentId: string, petType: string) => void;
  onClick?: () => void;
}

export default function PetCard({ student, levelFood, onPetSelect, onClick }: PetCardProps) {
  const { t } = useLanguage();
  const [showPetSelection, setShowPetSelection] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const currentLevelFood = levelFood[student.level - 1];
  const nextLevelFood = student.level < 10 ? levelFood[student.level] : currentLevelFood;
  const foodNeeded = nextLevelFood - student.currentFood;
  const progress = student.level < 10
    ? ((student.currentFood - currentLevelFood) / (nextLevelFood - currentLevelFood)) * 100
    : 100;

  const handleAdopt = () => {
    setShowPetSelection(true);
  };

  return (
    <>
      <div
        className={`bg-card rounded-[var(--radius-2xl)] p-5 transition-all ${
          student.petType ? 'cursor-pointer hover:scale-[1.02]' : ''
        }`}
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => student.petType && onClick && onClick()}
      >
        {/* Pet Display */}
        <div className="relative mb-4">
          <div className="aspect-square rounded-[var(--radius-xl)] bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center relative overflow-hidden">
            {student.petType ? (
              <div className="text-6xl breathing-animation">
                {student.petType}
              </div>
            ) : (
              <div className="text-7xl">🥚</div>
            )}

            {/* Adopt Button (only for egg state) */}
            {!student.petType && isHovered && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAdopt();
                  }}
                  className="px-6 py-3 rounded-[var(--radius-lg)] text-white hover:scale-105 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {t('home.petCard.adopt')}
                </button>
              </div>
            )}
          </div>

          {/* Badge Count */}
          {student.badges !== undefined && student.badges > 0 && (
            <div className="absolute top-3 left-3">
              <div
                className="px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5 border border-white/20"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 187, 84, 0.95) 0%, rgba(255, 139, 102, 0.95) 100%)',
                  boxShadow: '0 2px 8px rgba(255, 139, 102, 0.3)'
                }}
              >
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                <span className="text-white font-semibold text-xs">{student.badges}</span>
              </div>
            </div>
          )}

          {/* Level Badge */}
          <div className="absolute top-3 right-3">
            <div
              className="px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 border border-white/20"
              style={{
                background: 'linear-gradient(135deg, rgba(77, 208, 161, 0.95) 0%, rgba(94, 230, 168, 0.95) 100%)',
                boxShadow: '0 2px 8px rgba(77, 208, 161, 0.3)'
              }}
            >
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 3v18l7-3 7 3V3H5zm14 15l-5-2.18L9 18V5h10v13z"/>
              </svg>
              <span className="text-white font-semibold text-xs">Lv.{student.level}</span>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-card-foreground font-medium">{student.name}</h3>
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              title={t('home.petCard.pointsHistory')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Group Info */}
          {student.group && (
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs text-muted-foreground">{student.group}</span>
            </div>
          )}

          {/* Points */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{t('home.petCard.points')}:</span>
            <span className={`text-sm font-medium ${student.points >= 0 ? 'text-[var(--success)]' : 'text-[var(--destructive)]'}`}>
              {student.points >= 0 ? '+' : ''}{student.points}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-muted-foreground">
              {t('home.petCard.level')} {student.level}
            </span>
            {student.level < 10 && (
              <span className="text-muted-foreground">
                {foodNeeded > 0 ? t('home.petCard.needFood', { count: foodNeeded }) : t('home.petCard.level') + ' ' + student.level}
              </span>
            )}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--primary-light) 0%, var(--primary) 100%)'
              }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <span>🍖</span>
            <span>{student.currentFood} / {nextLevelFood}</span>
          </div>
        </div>
      </div>

      {/* Pet Selection Modal */}
      {showPetSelection && (
        <PetSelectionModal
          onSelect={(petType) => {
            onPetSelect(student.id, petType);
            setShowPetSelection(false);
          }}
          onClose={() => setShowPetSelection(false)}
        />
      )}

      {/* Breathing Animation CSS */}
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
      `}</style>
    </>
  );
}
