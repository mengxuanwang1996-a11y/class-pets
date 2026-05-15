import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface Class {
  id: string;
  name: string;
}

interface ClassModalProps {
  currentClass: Class;
  allClasses: Class[];
  onClose: () => void;
  onUpdateClassName: (name: string) => void;
  onCreateClass: (name: string) => void;
  onDeleteClass: (id: string) => void;
}

export default function ClassModal({
  currentClass,
  allClasses,
  onClose,
  onUpdateClassName,
  onCreateClass,
  onDeleteClass
}: ClassModalProps) {
  const { t } = useLanguage();
  const [editedName, setEditedName] = useState(currentClass.name);
  const [newClassName, setNewClassName] = useState('');
  const [showNewClassInput, setShowNewClassInput] = useState(false);

  const handleUpdateName = () => {
    if (editedName.trim() && editedName !== currentClass.name) {
      onUpdateClassName(editedName.trim());
    }
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      onCreateClass(newClassName.trim());
      setNewClassName('');
      setShowNewClassInput(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-lg max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-card-foreground">{t('home.classModal.manageClasses')}</h2>
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Current Class */}
            <div>
              <label className="block text-card-foreground mb-2 text-sm font-medium">
                {t('home.classModal.currentClass')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleUpdateName}
                  className="flex-1 px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
                {editedName !== currentClass.name && (
                  <button
                    onClick={handleUpdateName}
                    className="px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                  >
                    {t('home.classModal.save')}
                  </button>
                )}
              </div>
            </div>

            {/* All Classes */}
            {allClasses.length > 1 && (
              <div>
                <label className="block text-card-foreground mb-2 text-sm font-medium">
                  {t('home.classModal.allClasses')}
                </label>
                <div className="space-y-2">
                  {allClasses.map((cls) => (
                    <div
                      key={cls.id}
                      className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border transition-all ${
                        cls.id === currentClass.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-border hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                        style={{
                          background: cls.id === currentClass.id
                            ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                            : 'var(--muted)'
                        }}
                      >
                        <svg className={`w-5 h-5 ${cls.id === currentClass.id ? 'text-white' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${cls.id === currentClass.id ? 'text-[var(--primary)]' : 'text-card-foreground'}`}>
                          {cls.name}
                        </div>
                        {cls.id === currentClass.id && (
                          <div className="text-xs text-muted-foreground">{t('home.classModal.currentTag')}</div>
                        )}
                      </div>
                      {cls.id !== currentClass.id && allClasses.length > 1 && (
                        <button
                          onClick={() => onDeleteClass(cls.id)}
                          className="w-8 h-8 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Class */}
            <div>
              {!showNewClassInput ? (
                <button
                  onClick={() => setShowNewClassInput(true)}
                  className="w-full py-3 border-2 border-dashed border-border rounded-[var(--radius-lg)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-[var(--primary)]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
                  </svg>
                  <span>{t('home.classModal.newClass')}</span>
                </button>
              ) : (
                <form onSubmit={handleCreateClass} className="space-y-3">
                  <label className="block text-card-foreground text-sm font-medium">
                    {t('home.classModal.newClass')}
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder={t('home.classModal.classNamePlaceholder')}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewClassInput(false);
                        setNewClassName('');
                      }}
                      className="flex-1 px-4 py-2 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                    >
                      {t('home.classModal.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={!newClassName.trim()}
                      className="flex-1 px-4 py-2 text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                      }}
                    >
                      {t('home.classModal.create')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
