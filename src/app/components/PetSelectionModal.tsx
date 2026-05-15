import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface PetSelectionModalProps {
  onSelect: (petType: string) => void;
  onClose: () => void;
}

// Guardian Beast Data - In production, replace emoji with actual 3D rendered pet images
const GUARDIAN_BEASTS = [
  { id: 'cat-white', name: '白猫', emoji: '🐱', color: '#F5F5F5' },
  { id: 'cat-orange', name: '橘猫', emoji: '🐱', color: '#FF8C42' },
  { id: 'cat-black', name: '黑猫', emoji: '🐱', color: '#2C2C2E' },
  { id: 'cat-tabby', name: '虎斑', emoji: '🐱', color: '#C4A57B' },
  { id: 'dog-shiba', name: '柴犬', emoji: '🐶', color: '#D4A574' },
  { id: 'dog-golden', name: '金毛', emoji: '🐶', color: '#F4C430' },
  { id: 'dog-corgi', name: '柯基', emoji: '🐶', color: '#CD853F' },
  { id: 'dog-husky', name: '哈士奇', emoji: '🐺', color: '#708090' },
  { id: 'dog-poodle', name: '泰迪', emoji: '🐩', color: '#8B4513' },
  { id: 'dog-bulldog', name: '斗牛', emoji: '🐶', color: '#DEB887' },
  { id: 'rabbit-white', name: '白兔', emoji: '🐰', color: '#FFFFFF' },
  { id: 'rabbit-brown', name: '棕兔', emoji: '🐰', color: '#8B7355' },
  { id: 'fox-red', name: '赤狐', emoji: '🦊', color: '#FF6347' },
  { id: 'fox-arctic', name: '雪狐', emoji: '🦊', color: '#F0F8FF' },
  { id: 'bear-brown', name: '棕熊', emoji: '🐻', color: '#8B4513' },
  { id: 'bear-panda', name: '熊猫', emoji: '🐼', color: '#000000' },
  { id: 'bear-polar', name: '北极熊', emoji: '🐻‍❄️', color: '#F0F8FF' },
  { id: 'koala', name: '考拉', emoji: '🐨', color: '#A9A9A9' },
  { id: 'tiger', name: '老虎', emoji: '🐯', color: '#FF8C00' },
  { id: 'lion', name: '狮子', emoji: '🦁', color: '#DAA520' },
  { id: 'pig', name: '小猪', emoji: '🐷', color: '#FFB6C1' },
  { id: 'cow', name: '奶牛', emoji: '🐮', color: '#F5F5DC' },
  { id: 'frog', name: '青蛙', emoji: '🐸', color: '#90EE90' },
  { id: 'monkey', name: '猴子', emoji: '🐵', color: '#CD853F' },
  { id: 'chicken', name: '小鸡', emoji: '🐤', color: '#FFD700' },
  { id: 'penguin', name: '企鹅', emoji: '🐧', color: '#2F4F4F' },
  { id: 'owl', name: '猫头鹰', emoji: '🦉', color: '#8B7355' },
  { id: 'eagle', name: '老鹰', emoji: '🦅', color: '#8B4513' },
  { id: 'duck', name: '鸭子', emoji: '🦆', color: '#FFD700' },
  { id: 'swan', name: '天鹅', emoji: '🦢', color: '#FFFFFF' },
  { id: 'deer', name: '小鹿', emoji: '🦌', color: '#D2691E' },
  { id: 'horse', name: '马', emoji: '🐴', color: '#8B4513' },
  { id: 'unicorn', name: '独角兽', emoji: '🦄', color: '#FFB6C1' },
  { id: 'zebra', name: '斑马', emoji: '🦓', color: '#000000' },
  { id: 'giraffe', name: '长颈鹿', emoji: '🦒', color: '#DAA520' },
  { id: 'elephant', name: '大象', emoji: '🐘', color: '#696969' },
  { id: 'rhino', name: '犀牛', emoji: '🦏', color: '#808080' },
  { id: 'hippo', name: '河马', emoji: '🦛', color: '#696969' },
  { id: 'turtle', name: '乌龟', emoji: '🐢', color: '#556B2F' },
  { id: 'snake', name: '蛇', emoji: '🐍', color: '#228B22' },
  { id: 'dragon', name: '龙', emoji: '🐉', color: '#DC143C' },
  { id: 'dinosaur', name: '恐龙', emoji: '🦖', color: '#228B22' },
  { id: 'octopus', name: '章鱼', emoji: '🐙', color: '#FF69B4' },
  { id: 'squid', name: '鱿鱼', emoji: '🦑', color: '#FF1493' },
  { id: 'crab', name: '螃蟹', emoji: '🦀', color: '#FF4500' },
  { id: 'lobster', name: '龙虾', emoji: '🦞', color: '#DC143C' },
  { id: 'shrimp', name: '虾', emoji: '🦐', color: '#FFA07A' },
  { id: 'fish-tropical', name: '热带鱼', emoji: '🐠', color: '#00CED1' },
  { id: 'fish-gold', name: '金鱼', emoji: '🐟', color: '#FFD700' },
  { id: 'dolphin', name: '海豚', emoji: '🐬', color: '#87CEEB' },
  { id: 'whale', name: '鲸鱼', emoji: '🐳', color: '#4682B4' },
  { id: 'shark', name: '鲨鱼', emoji: '🦈', color: '#708090' },
  { id: 'seal', name: '海豹', emoji: '🦭', color: '#696969' },
  { id: 'otter', name: '水獭', emoji: '🦦', color: '#8B4513' },
  { id: 'butterfly', name: '蝴蝶', emoji: '🦋', color: '#FF69B4' },
  { id: 'bee', name: '蜜蜂', emoji: '🐝', color: '#FFD700' },
  { id: 'ladybug', name: '瓢虫', emoji: '🐞', color: '#FF0000' },
  { id: 'hamster', name: '仓鼠', emoji: '🐹', color: '#F4A460' },
  { id: 'hedgehog', name: '刺猬', emoji: '🦔', color: '#8B7355' },
  { id: 'bat', name: '蝙蝠', emoji: '🦇', color: '#2F4F4F' }
];

export default function PetSelectionModal({ onSelect, onClose }: PetSelectionModalProps) {
  const { t } = useLanguage();
  const [hoveredPet, setHoveredPet] = useState<string | null>(null);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-6xl max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-card-foreground mb-1">{t('home.petSelection.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('home.petSelection.subtitle')}</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Pet Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
              {GUARDIAN_BEASTS.map((beast) => (
                <button
                  key={beast.id}
                  onClick={() => onSelect(beast.emoji)}
                  onMouseEnter={() => setHoveredPet(beast.id)}
                  onMouseLeave={() => setHoveredPet(null)}
                  className={`rounded-[var(--radius-xl)] bg-white border-2 transition-all duration-200 overflow-hidden ${
                    hoveredPet === beast.id
                      ? 'scale-105 border-[var(--primary)] shadow-xl'
                      : 'border-border hover:border-[var(--primary)]/30'
                  }`}
                  style={{
                    boxShadow: hoveredPet === beast.id ? '0 12px 32px rgba(0, 0, 0, 0.2)' : 'var(--shadow-sm)'
                  }}
                >
                  <div className="p-4">
                    {/* Pet Image Placeholder - In production, replace with actual 3D rendered images */}
                    <div
                      className="aspect-square rounded-[var(--radius-lg)] flex items-center justify-center mb-2 relative"
                      style={{
                        background: `linear-gradient(135deg, ${beast.color}20 0%, ${beast.color}10 100%)`
                      }}
                    >
                      <div className="text-5xl">{beast.emoji}</div>
                      {/* Overlay gradient for depth */}
                      <div
                        className="absolute inset-0 rounded-[var(--radius-lg)]"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3) 0%, transparent 70%)`
                        }}
                      />
                    </div>
                    {/* Pet Name */}
                    <div className="text-center">
                      <span className="text-sm font-medium text-card-foreground">{beast.name}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              {t('home.petSelection.hint')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
