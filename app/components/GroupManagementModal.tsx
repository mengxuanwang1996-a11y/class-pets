import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface GroupManagementModalProps {
  students: Array<{ id: string; name: string }>;
  groups: Array<{ id: string; name: string; members: string[] }>;
  onClose: () => void;
  onSave: (groups: Array<{ id: string; name: string; members: string[] }>) => void;
}

export default function GroupManagementModal({ students, groups: initialGroups, onClose, onSave }: GroupManagementModalProps) {
  const { t } = useLanguage();
  const [groups, setGroups] = useState(initialGroups);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'random' | 'select'>('create');

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;

    const newGroup = {
      id: crypto.randomUUID(),
      name: newGroupName,
      members: selectedStudents
    };

    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setSelectedStudents([]);
  };

  const handleRandomGroup = (groupCount: number) => {
    const shuffled = [...students].sort(() => Math.random() - 0.5);
    const groupSize = Math.ceil(shuffled.length / groupCount);
    const newGroups = [];

    for (let i = 0; i < groupCount; i++) {
      const start = i * groupSize;
      const end = start + groupSize;
      const members = shuffled.slice(start, end);

      if (members.length > 0) {
        newGroups.push({
          id: crypto.randomUUID(),
          name: `${t('settings.groups.group')} ${i + 1}`,
          members: members.map(s => s.id)
        });
      }
    }

    setGroups([...groups, ...newGroups]);
  };

  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSave = () => {
    onSave(groups);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-3xl max-h-[80vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-card-foreground">{t('settings.groups.title')}</h2>
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

          {/* Tabs */}
          <div className="flex gap-2 px-6 pt-4 border-b border-border">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-t-[var(--radius-lg)] transition-all ${
                activeTab === 'create'
                  ? 'bg-muted text-card-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('settings.groups.newGroup')}
            </button>
            <button
              onClick={() => setActiveTab('random')}
              className={`px-4 py-2 rounded-t-[var(--radius-lg)] transition-all ${
                activeTab === 'random'
                  ? 'bg-muted text-card-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('settings.groups.randomGroup')}
            </button>
            <button
              onClick={() => setActiveTab('select')}
              className={`px-4 py-2 rounded-t-[var(--radius-lg)] transition-all ${
                activeTab === 'select'
                  ? 'bg-muted text-card-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('settings.groups.selectGroup')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'create' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t('settings.groups.groupNamePlaceholder')}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`px-3 py-2 rounded-[var(--radius-md)] transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-muted text-card-foreground hover:bg-border'
                      }`}
                    >
                      {student.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCreateGroup}
                  className="w-full py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                  }}
                >
                  {t('settings.groups.createGroup')}
                </button>
              </div>
            )}

            {activeTab === 'random' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('settings.groups.randomGroupHint')}</p>
                <div className="flex gap-3">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      onClick={() => handleRandomGroup(count)}
                      className="flex-1 py-3 border-2 border-border rounded-[var(--radius-lg)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all"
                    >
                      {count} {t('settings.groups.groups')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'select' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{t('settings.groups.selectGroupHint')}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => toggleStudentSelection(student.id)}
                      className={`px-3 py-2 rounded-[var(--radius-md)] transition-all ${
                        selectedStudents.includes(student.id)
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-muted text-card-foreground hover:bg-border'
                      }`}
                    >
                      {student.name}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder={t('settings.groups.groupNamePlaceholder')}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
                <button
                  onClick={handleCreateGroup}
                  className="w-full py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                  }}
                >
                  {t('settings.groups.createGroup')}
                </button>
              </div>
            )}

            {/* Current Groups */}
            {groups.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-card-foreground mb-3">{t('settings.groups.currentGroups')}</h3>
                <div className="space-y-3">
                  {groups.map((group, index) => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-[var(--radius-lg)]">
                      <div>
                        <span className="text-card-foreground font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({group.members.length} {t('settings.groups.members')})
                        </span>
                      </div>
                      <button
                        onClick={() => setGroups(groups.filter((_, i) => i !== index))}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
            >
              {t('settings.groups.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
              style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
              }}
            >
              {t('settings.groups.save')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
