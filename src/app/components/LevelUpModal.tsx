import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface LevelUpModalProps {
  studentName: string;
  oldLevel: number;
  newLevel: number;
  petType: string;
  onClose: () => void;
}

export default function LevelUpModal({ studentName, oldLevel, newLevel, petType, onClose }: LevelUpModalProps) {
  const { t } = useLanguage();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Delay content animation
    const timer = setTimeout(() => setShowContent(true), 100);

    // Auto close after 3 seconds
    const closeTimer = setTimeout(() => onClose(), 3000);

    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto animate-fadeIn"
        onClick={onClose}
      />

      {/* Content */}
      <div
        className={`relative bg-card rounded-[var(--radius-2xl)] p-8 pointer-events-auto transition-all duration-500 ${
          showContent ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
        }`}
        style={{
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          minWidth: '400px'
        }}
      >
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-[var(--radius-2xl)]">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        <div className="relative text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className="w-32 h-32 rounded-full flex items-center justify-center relative animate-bounce-slow"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, var(--pet-orange) 100%)',
                boxShadow: '0 8px 32px rgba(255, 159, 64, 0.4)'
              }}
            >
              <div className="text-7xl breathing-animation">{petType}</div>
              {/* Sparkles */}
              <div className="absolute -top-2 -right-2 text-3xl animate-spin-slow">✨</div>
              <div className="absolute -bottom-2 -left-2 text-3xl animate-spin-slow" style={{ animationDelay: '1s' }}>✨</div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2
              className="text-3xl font-bold mb-2"
              style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('levelUp.congratulations')}
            </h2>
            <p className="text-card-foreground text-lg">
              {studentName}
            </p>
          </div>

          {/* Level Display */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground">{oldLevel}</span>
              </div>
            </div>

            <svg className="w-8 h-8 text-[var(--primary)]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>

            <div className="flex items-center gap-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                  boxShadow: '0 4px 24px rgba(77, 208, 161, 0.4)'
                }}
              >
                <span className="text-2xl font-bold text-white">{newLevel}</span>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-muted-foreground">
            {t('levelUp.keepGoing')}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(600px) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes breathing {
          0%, 100% {
            transform: scale(1) translateY(0);
          }
          50% {
            transform: scale(1.05) translateY(-3px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .breathing-animation {
          animation: breathing 2s ease-in-out infinite;
        }

        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, var(--accent), var(--pet-orange));
          animation: confetti-fall linear infinite;
          border-radius: 2px;
        }

        .confetti:nth-child(2n) {
          background: linear-gradient(135deg, var(--primary-light), var(--primary));
        }

        .confetti:nth-child(3n) {
          background: linear-gradient(135deg, var(--secondary), var(--accent));
        }
      `}</style>
    </div>
  );
}
