import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ClassModal from './ClassModal';
import SettingsPage from './SettingsPage';
import PetCard from './PetCard';
import StudentDetailPage from './StudentDetailPage';
import StoreModal from './StoreModal';
import InteractionModal from './InteractionModal';
import LeaderboardModal from './LeaderboardModal';
import SubscriptionPage from './SubscriptionPage';
import { getClasses, createClass, updateClass, deleteClass } from '../services/classes';
import { getStudents, createStudent, updateStudent, assignPet, batchCreateStudents } from '../services/students';
import { getSettings } from '../services/settings';

interface Student {
  id: string;
  name: string;
  petType: string | null;
  level: number;
  currentFood: number;
  points: number;
  group: string | null;
  shieldUsedToday?: number;
  badges?: number;
}

interface PointItem {
  id: string;
  icon: string;
  name: string;
  points: number;
}

interface Settings {
  addPointItems: PointItem[];
  deductPointItems: PointItem[];
  useShield: boolean;
  maxShieldPerDay: number;
  levelFood: number[];
}

export default function HomePage() {
  const { language, setLanguage, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSubscription, setShowSubscription] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSafeModeConfirm, setShowSafeModeConfirm] = useState(false);
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [history, setHistory] = useState<Student[][]>([]);

  // Class management
  const [classes, setClasses] = useState([
    { id: '1', name: '默认班级', students: [] as Student[] }
  ]);
const [currentClassId, setCurrentClassId] = useState('1');
  const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

  // Subscription status - hardcoded for now, will be from API later
  const [subscriptionExpiry] = useState<Date | null>(new Date('2026-12-31'));
  const isSubscriptionActive = subscriptionExpiry ? subscriptionExpiry > new Date() : false;

  // Filter students by search query
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Settings state
  const [settings, setSettings] = useState<Settings>({
    levelFood: [0, 10, 25, 45, 70, 100, 135, 175, 220, 270],
    addPointItems: [
      { id: '1', icon: '📝', name: '完成作业', points: 1 },
      { id: '2', icon: '✋', name: '积极举手', points: 1 },
      { id: '3', icon: '🎯', name: '课堂表现优秀', points: 2 },
    ],
    deductPointItems: [
      { id: '4', icon: '❌', name: '未完成作业', points: -1 },
      { id: '5', icon: '💬', name: '课堂讲话', points: -1 },
      { id: '6', icon: '⚠️', name: '违反纪律', points: -2 },
    ],
    useShield: true,
    maxShieldPerDay: 1,
  });

  // Load initial data
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [classesData, settingsData] = await Promise.all([
          getClasses(),
          getSettings(),
        ]);
        setClasses(classesData.map(c => ({ ...c, students: [] as Student[] })));
        if (classesData.length > 0) {
          setCurrentClassId(classesData[0].id);
          const studentsData = await getStudents(classesData[0].id);
          const mapped = studentsData.map(s => ({
            id: s.id,
            name: s.name,
            petType: s.pet_type,
            level: s.level,
            currentFood: s.current_food,
            points: s.points,
            group: s.groupName || null,
            badges: s.badges,
          }));
          setStudents(mapped);
        }
        setSettings(prev => ({
          ...prev,
          levelFood: settingsData.levelConfig || prev.levelFood,
          addPointItems: settingsData.pointItems
            ? settingsData.pointItems.filter((p: any) => p.points > 0).map((p: any) => ({
                id: p.id,
                icon: p.icon,
                name: p.name,
                points: p.points,
              }))
            : prev.addPointItems,
          deductPointItems: settingsData.pointItems
            ? settingsData.pointItems.filter((p: any) => p.points < 0).map((p: any) => ({
                id: p.id,
                icon: p.icon,
                name: p.name,
                points: p.points,
              }))
            : prev.deductPointItems,
        }));
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      // Fullscreen API may be blocked by permissions policy in iframe
      // Use CSS-based "fullscreen" as fallback
      setIsFullscreen(!isFullscreen);
    }
  };

  const saveToHistory = (currentStudents: Student[]) => {
    setHistory([...history, currentStudents]);
    // Keep only last 10 actions
    if (history.length > 10) {
      setHistory(history.slice(-10));
    }
  };

  const handleUndo = () => {
    if (history.length > 0 && !isSafeMode) {
      const previousState = history[history.length - 1];
      setStudents(previousState);
      setHistory(history.slice(0, -1));
    }
  };

  const handlePetSelect = async (studentId: string, petType: string) => {
    if (isSafeMode) return;

    try {
      const updated = await assignPet(studentId, petType);
      saveToHistory(students);
      setStudents(students.map(s =>
        s.id === studentId
          ? { ...s, petType: updated.pet_type, level: updated.level, currentFood: updated.current_food, badges: updated.badges }
          : s
      ));
    } catch (err) {
      console.error('Failed to assign pet:', err);
    }
  };

  const handleStudentClick = (student: Student) => {
    // Only open detail page if student has a pet and not in safe mode
    if (student.petType && !isSafeMode) {
      setSelectedStudent(student);
    }
  };

  const handleStudentUpdate = (updatedStudent: Student) => {
    if (isSafeMode) return;

    saveToHistory(students);
    setStudents(students.map(s =>
      s.id === updatedStudent.id ? updatedStudent : s
    ));
    setSelectedStudent(updatedStudent);
  };

  const handleUpdateStudentBadges = (studentId: string, badges: number) => {
    if (isSafeMode) return;

    saveToHistory(students);
    setStudents(students.map(s =>
      s.id === studentId ? { ...s, badges } : s
    ));
  };

  const handleEnterSafeMode = () => {
    setIsSafeMode(true);
    setShowSafeModeConfirm(false);
    setShowMoreMenu(false);
  };

  const handleExitSafeMode = () => {
    setIsSafeMode(false);
  };

  const handleUpdateClassName = (name: string) => {
    setClasses(classes.map(c =>
      c.id === currentClassId ? { ...c, name } : c
    ));
  };

  const handleCreateClass = async (name: string) => {
    try {
      const created = await createClass(name);
      setClasses([...classes, { ...created, students: [] }]);
    } catch (err) {
      console.error('Failed to create class:', err);
    }
  };

  const handleDeleteClass = (id: string) => {
    if (classes.length <= 1) return;
    setClasses(classes.filter(c => c.id !== id));
    if (id === currentClassId) {
      setCurrentClassId(classes[0].id);
    }
  };

  const handleSwitchClass = (id: string) => {
    // Save current class students
    setClasses(classes.map(c =>
      c.id === currentClassId ? { ...c, students } : c
    ));

    // Switch to new class
    setCurrentClassId(id);
    const newClass = classes.find(c => c.id === id);
    setStudents(newClass?.students || []);
    setShowClassDropdown(false);
  };

  const handleSettingsSave = (
    savedStudents: Array<{ id: string; name: string; petAssigned: boolean }>,
    savedSettings?: Settings,
    savedClassName?: string
  ) => {
    // Check subscription status before saving
    if (!isSubscriptionActive) {
      setShowSettings(false);
      setShowSubscription(true);
      return;
    }

    // Merge saved students with existing student data
    const convertedStudents: Student[] = savedStudents.map(s => {
      const existingStudent = students.find(es => es.id === s.id);
      if (existingStudent) {
        // Keep existing student data, update name
        return {
          ...existingStudent,
          name: s.name
        };
      } else {
        // New student
        return {
          id: s.id,
          name: s.name,
          petType: null,
          level: 1,
          currentFood: 0,
          points: 0,
          group: null,
          shieldUsedToday: 0,
          badges: 5 // Give students 5 badges to start
        };
      }
    });
    setStudents(convertedStudents);

    // Update current class students
    setClasses(classes.map(c =>
      c.id === currentClassId ? { ...c, students: convertedStudents, name: savedClassName || c.name } : c
    ));

    // Update settings if provided
    if (savedSettings) {
      setSettings(savedSettings);
    }

    setShowSettings(false);
  };

  const handleSubscribe = (plan: string) => {
    // TODO: Implement actual subscription logic
    console.log('Subscribed to plan:', plan);
    setShowSubscription(false);
  };

  // Show subscription page if opened
  if (showSubscription) {
    return <SubscriptionPage onClose={() => setShowSubscription(false)} onSubscribe={handleSubscribe} />;
  }

  // Show settings page if opened
  if (showSettings) {
    return (
      <SettingsPage
        onClose={() => setShowSettings(false)}
        onSave={handleSettingsSave}
        currentClassId={currentClassId}
        currentClassName={currentClass.name}
        initialStudents={students.map(s => ({
          id: s.id,
          name: s.name,
          petAssigned: s.petType !== null
        }))}
        initialSettings={settings}
      />
    );
  }

  // Show student detail page if student selected
  if (selectedStudent) {
    return (
      <StudentDetailPage
        student={selectedStudent}
        levelFood={settings.levelFood}
        addPointItems={settings.addPointItems}
        deductPointItems={settings.deductPointItems}
        maxShieldPerDay={settings.maxShieldPerDay}
        useShield={settings.useShield}
        onUpdate={handleStudentUpdate}
        onClose={() => setSelectedStudent(null)}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-background ${isFullscreen ? 'fixed inset-0 z-[100] overflow-auto' : ''}`}>
      {/* Navigation Bar */}
      <nav
        className="bg-card border-b border-border sticky top-0 z-50"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Left Section - Class Name */}
            <div className="relative">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowClassModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-lg)] hover:bg-muted transition-colors group"
                >
                  <div
                    className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                    }}
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                    </svg>
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-card-foreground group-hover:text-[var(--primary)] transition-colors">
                      {currentClass.name}
                    </div>
                  </div>
                </button>
                {classes.length > 1 && (
                  <button
                    onClick={() => setShowClassDropdown(!showClassDropdown)}
                    className="w-8 h-8 rounded-[var(--radius-md)] hover:bg-muted transition-colors flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Class Dropdown */}
              {showClassDropdown && classes.length > 1 && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowClassDropdown(false)}
                  />
                  <div
                    className="absolute left-0 top-full mt-2 w-64 bg-card rounded-[var(--radius-lg)] border border-border z-20"
                    style={{ boxShadow: 'var(--shadow-lg)' }}
                  >
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => handleSwitchClass(cls.id)}
                        className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 ${
                          cls.id === currentClassId ? 'bg-[var(--primary)]/5' : ''
                        } ${
                          cls.id === classes[0].id ? 'rounded-t-[var(--radius-lg)]' : ''
                        } ${
                          cls.id === classes[classes.length - 1].id ? 'rounded-b-[var(--radius-lg)]' : ''
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                          style={{
                            background: cls.id === currentClassId
                              ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                              : 'var(--muted)'
                          }}
                        >
                          <svg className={`w-4 h-4 ${cls.id === currentClassId ? 'text-white' : 'text-muted-foreground'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${cls.id === currentClassId ? 'text-[var(--primary)]' : 'text-card-foreground'}`}>
                            {cls.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {cls.students.length} {t('home.classDropdown.students')}
                          </div>
                        </div>
                        {cls.id === currentClassId && (
                          <svg className="w-4 h-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Middle Section - Main Navigation */}
            <div className="flex items-center gap-1 md:gap-2">
              <NavButton icon="store" label={t('home.nav.store')} onClick={() => !isSafeMode && setShowStore(true)} disabled={isSafeMode} />
              <NavButton icon="interaction" label={t('home.nav.interaction')} onClick={() => !isSafeMode && setShowInteraction(true)} disabled={isSafeMode} />
              <NavButton icon="leaderboard" label={t('home.nav.leaderboard')} onClick={() => !isSafeMode && setShowLeaderboard(true)} disabled={isSafeMode} />
            </div>

            {/* Right Section - Search and Actions */}
            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('home.nav.search')}
                  disabled={isSafeMode}
                  className="w-64 pl-10 pr-4 py-2 bg-input-background border border-border rounded-[var(--radius-lg)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <svg className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                </svg>
              </div>

              {/* Search Icon (Mobile) */}
              <button className="md:hidden w-10 h-10 flex items-center justify-center rounded-[var(--radius-lg)] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                </svg>
              </button>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-lg)] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={t('home.nav.fullscreen')}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* Undo */}
              <button
                onClick={handleUndo}
                disabled={history.length === 0 || isSafeMode}
                className="hidden md:flex w-10 h-10 items-center justify-center rounded-[var(--radius-lg)] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                title={t('home.nav.undo')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 7v6h6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 17a9 9 0 00-9-9 9 9 0 00-9 9" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Language Switcher */}
              <div className="hidden md:flex gap-1 p-1 bg-muted rounded-[var(--radius-lg)]">
                <button
                  onClick={() => setLanguage('zh')}
                  className={`px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs transition-all ${
                    language === 'zh'
                      ? 'bg-card text-card-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  中文
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1.5 rounded-[var(--radius-md)] text-xs transition-all ${
                    language === 'en'
                      ? 'bg-card text-card-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* More */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="w-10 h-10 flex items-center justify-center rounded-[var(--radius-lg)] hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  title={t('home.nav.more')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    <circle cx="12" cy="5" r="1" fill="currentColor"/>
                    <circle cx="12" cy="19" r="1" fill="currentColor"/>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showMoreMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMoreMenu(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 bg-card rounded-[var(--radius-lg)] border border-border z-20"
                      style={{ boxShadow: 'var(--shadow-lg)' }}
                    >
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          setShowSettings(true);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 text-card-foreground rounded-t-[var(--radius-lg)]"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span>{t('home.nav.settings')}</span>
                      </button>
                      <div className="border-t border-border" />
                      <button
                        onClick={() => {
                          setShowMoreMenu(false);
                          if (isSafeMode) {
                            handleExitSafeMode();
                          } else {
                            setShowSafeModeConfirm(true);
                          }
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 rounded-b-[var(--radius-lg)]"
                      >
                        <svg className={`w-5 h-5 ${isSafeMode ? 'text-[var(--success)]' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className="flex-1">
                          <div className={isSafeMode ? 'text-[var(--success)] font-medium' : 'text-card-foreground'}>
                            {t('home.nav.safeMode')}
                          </div>
                          {isSafeMode && (
                            <div className="text-xs text-muted-foreground">{t('home.nav.safeModeActive')}</div>
                          )}
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Safe Mode Banner */}
      {isSafeMode && (
        <div
          className="bg-[var(--warning)]/10 border-b border-[var(--warning)]/30 sticky top-16 z-40"
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--warning)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <div className="text-sm font-medium text-[var(--warning)]">{t('home.safeMode.active')}</div>
                <div className="text-xs text-muted-foreground">{t('home.safeMode.description')}</div>
              </div>
            </div>
            <button
              onClick={handleExitSafeMode}
              className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--warning)] text-white hover:opacity-90 transition-opacity text-sm font-medium"
            >
              {t('home.safeMode.exit')}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-[calc(100vh-4rem)] p-4 md:p-8">
        {students.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div
                  className="w-24 h-24 rounded-[var(--radius-2xl)] flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--muted) 0%, var(--input-background) 100%)'
                  }}
                >
                  <svg className="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              {/* Message */}
              <h2 className="text-card-foreground mb-3">
                {t('home.emptyState.title')}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('home.emptyState.description')}
              </p>

              {/* Action Link */}
              <button
                onClick={() => setShowSettings(true)}
                className="inline-flex items-center gap-2 text-[var(--primary)] hover:opacity-80 transition-opacity font-medium"
              >
                {t('home.emptyState.addStudents')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          /* No Search Results */
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-card-foreground mb-3">{t('home.search.noResults')}</h2>
              <p className="text-muted-foreground mb-6">
                {t('home.search.noResultsDescription', { query: searchQuery })}
              </p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
              >
                {t('home.search.clearSearch')}
              </button>
            </div>
          </div>
        ) : (
          /* Student Pet Cards Grid */
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
              {filteredStudents.map((student) => (
                <div key={student.id} className={isSafeMode ? 'opacity-60 pointer-events-none' : ''}>
                  <PetCard
                    student={student}
                    levelFood={settings.levelFood}
                    onPetSelect={handlePetSelect}
                    onClick={() => handleStudentClick(student)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class Modal */}
      {showClassModal && (
        <ClassModal
          currentClass={currentClass}
          allClasses={classes}
          onClose={() => setShowClassModal(false)}
          onUpdateClassName={handleUpdateClassName}
          onCreateClass={handleCreateClass}
          onDeleteClass={handleDeleteClass}
        />
      )}

      {/* Store Modal */}
      {showStore && (
        <StoreModal
          students={students.map(s => ({ id: s.id, name: s.name, badges: s.badges || 0 }))}
          onClose={() => setShowStore(false)}
          onUpdateStudent={handleUpdateStudentBadges}
        />
      )}

      {/* Interaction Modal */}
      {showInteraction && (
        <InteractionModal
          students={students.map(s => ({ id: s.id, name: s.name }))}
          classId={currentClassId}
          onClose={() => setShowInteraction(false)}
        />
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <LeaderboardModal
          students={students}
          classId={currentClassId}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* Safe Mode Confirmation */}
      {showSafeModeConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowSafeModeConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--warning)]/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-[var(--warning)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-card-foreground font-medium mb-2">{t('home.safeMode.confirmTitle')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('home.safeMode.confirmMessage')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSafeModeConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleEnterSafeMode}
                  className="flex-1 px-4 py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--warning)' }}
                >
                  {t('home.safeMode.confirm')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface NavButtonProps {
  icon: 'store' | 'interaction' | 'leaderboard';
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

function NavButton({ icon, label, onClick, disabled }: NavButtonProps) {
  const icons = {
    store: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    interaction: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    leaderboard: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-[var(--radius-lg)] transition-colors ${
        disabled
          ? 'text-muted-foreground/30 cursor-not-allowed'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icons[icon]}
      <span className="hidden lg:inline text-sm font-medium">{label}</span>
    </button>
  );
}
