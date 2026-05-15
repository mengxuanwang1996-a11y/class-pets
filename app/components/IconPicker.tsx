import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface IconPickerProps {
  currentIcon: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

const ICON_CATEGORIES = {
  academic: ['📝', '✏️', '📚', '📖', '🎓', '🏫', '🎒', '📐', '📏', '✂️', '🖍️', '🖊️', '🖌️', '📌', '📍'],
  positive: ['⭐', '🌟', '✨', '💫', '⚡', '🔥', '👏', '👍', '💪', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅'],
  gestures: ['✋', '👋', '🤚', '🖐️', '👌', '🤞', '🤝', '👐', '🙌', '🤲', '🙏', '✍️', '💅', '🦾', '👊'],
  faces: ['😊', '😃', '😄', '😁', '🙂', '😉', '😎', '🤗', '🥰', '😍', '🤩', '😺', '😸', '😻', '🥳'],
  negative: ['❌', '⛔', '🚫', '⚠️', '⭕', '🔴', '🛑', '🚷', '🚯', '🚳', '🚱', '🔕', '📵', '🔞', '☢️'],
  warning: ['💬', '🗣️', '💭', '🗯️', '💢', '💥', '💫', '🌪️', '⚡', '🔊', '📢', '📣', '🔔', '🔕', '📯'],
  activities: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥏', '🎯', '🎪', '🎨', '🎭', '🎬', '🎮'],
  nature: ['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌾', '🌿', '🍀', '🍃', '🍂', '🍁', '🌳', '🌲', '🌱'],
  objects: ['🎁', '🎈', '🎉', '🎊', '🎀', '🏮', '🎐', '🧧', '💝', '💖', '💗', '💓', '💞', '💕', '💌'],
  symbols: ['✅', '☑️', '✔️', '❎', '➕', '➖', '➗', '✖️', '💯', '🔢', '#️⃣', '*️⃣', '0️⃣', '1️⃣', '2️⃣']
};

export default function IconPicker({ currentIcon, onSelect, onClose }: IconPickerProps) {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof ICON_CATEGORIES>('academic');

  const categoryNames = {
    academic: t('settings.points.iconCategory.academic'),
    positive: t('settings.points.iconCategory.positive'),
    gestures: t('settings.points.iconCategory.gestures'),
    faces: t('settings.points.iconCategory.faces'),
    negative: t('settings.points.iconCategory.negative'),
    warning: t('settings.points.iconCategory.warning'),
    activities: t('settings.points.iconCategory.activities'),
    nature: t('settings.points.iconCategory.nature'),
    objects: t('settings.points.iconCategory.objects'),
    symbols: t('settings.points.iconCategory.symbols')
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-2xl max-h-[80vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-card-foreground font-medium">{t('settings.points.selectIcon')}</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-6 pt-4 border-b border-border overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {(Object.keys(ICON_CATEGORIES) as Array<keyof typeof ICON_CATEGORIES>).map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-[var(--radius-lg)] text-sm transition-all whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {categoryNames[category]}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-8 md:grid-cols-10 gap-2">
              {ICON_CATEGORIES[selectedCategory].map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    onSelect(icon);
                    onClose();
                  }}
                  className={`aspect-square rounded-[var(--radius-md)] text-2xl hover:bg-muted transition-all ${
                    icon === currentIcon
                      ? 'bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]'
                      : 'hover:scale-110'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border text-center text-sm text-muted-foreground">
            {t('settings.points.iconPickerHint')}
          </div>
        </div>
      </div>
    </>
  );
}
