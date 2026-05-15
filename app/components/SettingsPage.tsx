import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme, ThemeColor, themes } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/auth';
import { createStudent } from '../services/students';
import { saveSettings } from '../services/settings';
import GroupManagementModal from './GroupManagementModal';
import IconPicker from './IconPicker';

interface Settings {
  addPointItems: Array<{ id: string; icon: string; name: string; points: number }>;
  deductPointItems: Array<{ id: string; icon: string; name: string; points: number }>;
  useShield: boolean;
  maxShieldPerDay: number;
  levelFood: number[];
}

interface SettingsPageProps {
  onClose: () => void;
  currentClassId?: string;
  currentClassName?: string;
  initialStudents?: Array<{ id: string; name: string; petAssigned: boolean }>;
  initialSettings?: Settings;
  onSave?: (
    students: Array<{ id: string; name: string; petAssigned: boolean }>,
    settings?: Settings,
    className?: string
  ) => void;
}

export default function SettingsPage({ onClose, onSave, currentClassId, currentClassName, initialStudents, initialSettings }: SettingsPageProps) {
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [volume, setVolume] = useState(70);
  const [systemName, setSystemName] = useState('班级萌宠园');
  const [className, setClassName] = useState(currentClassName || '默认班级');

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<'new' | 'edit'>('new');

  // Pet Growth Configuration (levels 1-10)
  const [levelFood, setLevelFood] = useState(
    initialSettings?.levelFood || [
      0,    // Level 1
      10,   // Level 2
      25,   // Level 3
      45,   // Level 4
      70,   // Level 5
      100,  // Level 6
      135,  // Level 7
      175,  // Level 8
      220,  // Level 9
      270   // Level 10
    ]
  );

  // Guardian & Sleep Settings
  const [useShield, setUseShield] = useState(initialSettings?.useShield ?? true);
  const [maxShieldPerDay, setMaxShieldPerDay] = useState(initialSettings?.maxShieldPerDay ?? 1);
  const [sleepEnabled, setSleepEnabled] = useState(true);
  const [sleepDays, setSleepDays] = useState(3);
  const [sleepPaused, setSleepPaused] = useState(false);
  const [debtThresholdEnabled, setDebtThresholdEnabled] = useState(true);
  const [debtThreshold, setDebtThreshold] = useState(5);

  // Point System Configuration
  const [addPointItems, setAddPointItems] = useState(
    initialSettings?.addPointItems || [
      { id: '1', icon: '📝', name: '完成作业', points: 1 },
      { id: '2', icon: '✋', name: '积极举手', points: 1 },
      { id: '3', icon: '🎯', name: '课堂表现优秀', points: 2 },
    ]
  );
  const [deductPointItems, setDeductPointItems] = useState(
    initialSettings?.deductPointItems || [
      { id: '4', icon: '❌', name: '未完成作业', points: -1 },
      { id: '5', icon: '💬', name: '课堂讲话', points: -1 },
      { id: '6', icon: '⚠️', name: '违反纪律', points: -2 },
    ]
  );
  const [newItemIcon, setNewItemIcon] = useState('⭐');
  const [newItemName, setNewItemName] = useState('');
  const [newItemPoints, setNewItemPoints] = useState(1);
  const [editingItem, setEditingItem] = useState<{ id: string; icon: string; name: string; points: number } | null>(null);

  // Student List
  const [students, setStudents] = useState<Array<{ id: string; name: string; petAssigned: boolean; isNew?: boolean }>>(
    initialStudents || []
  );
  const [newStudentName, setNewStudentName] = useState('');
  const [showBatchAdd, setShowBatchAdd] = useState(false);
  const [batchStudentText, setBatchStudentText] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');

  // Group Management
  const [groups, setGroups] = useState<Array<{ id: string; name: string; members: string[] }>>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Change Password Modal
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Logout Confirmation
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLevelFoodChange = (level: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newLevelFood = [...levelFood];

    // Validate: must be greater than previous level
    if (level > 0 && numValue < levelFood[level - 1]) {
      return; // Don't allow setting lower than previous level
    }

    // Validate: must be less than next level
    if (level < 9 && levelFood[level + 1] > 0 && numValue > levelFood[level + 1]) {
      return; // Don't allow setting higher than next level
    }

    newLevelFood[level] = numValue;
    setLevelFood(newLevelFood);
  };

  // Point System Handlers
  const handleAddPointItem = () => {
    if (!newItemName.trim()) return;

    const newItem = {
      id: crypto.randomUUID(),
      icon: newItemIcon,
      name: newItemName,
      points: newItemPoints
    };

    if (newItemPoints > 0) {
      setAddPointItems([...addPointItems, newItem]);
    } else {
      setDeductPointItems([...deductPointItems, newItem]);
    }

    setNewItemIcon('⭐');
    setNewItemName('');
    setNewItemPoints(1);
  };

  const handleDeletePointItem = (id: string, isAddPoint: boolean) => {
    if (isAddPoint) {
      setAddPointItems(addPointItems.filter(item => item.id !== id));
    } else {
      setDeductPointItems(deductPointItems.filter(item => item.id !== id));
    }
  };

  const handleEditPointItem = (item: { id: string; icon: string; name: string; points: number }) => {
    setEditingItem(item);
  };

  const handleSaveEditItem = () => {
    if (!editingItem) return;

    const updatedItem = editingItem;

    // Determine if it's in add or deduct section based on points
    const isInAddPoints = addPointItems.some(item => item.id === editingItem.id);
    const isInDeductPoints = deductPointItems.some(item => item.id === editingItem.id);

    // Remove from current section
    if (isInAddPoints) {
      setAddPointItems(addPointItems.filter(item => item.id !== editingItem.id));
    } else if (isInDeductPoints) {
      setDeductPointItems(deductPointItems.filter(item => item.id !== editingItem.id));
    }

    // Add to appropriate section based on new points value
    if (updatedItem.points > 0) {
      setAddPointItems([...addPointItems.filter(item => item.id !== editingItem.id), updatedItem]);
    } else {
      setDeductPointItems([...deductPointItems.filter(item => item.id !== editingItem.id), updatedItem]);
    }

    setEditingItem(null);
  };

  // Student Handlers
  const handleAddStudent = () => {
    if (!newStudentName.trim()) return;

    const newStudent = {
      id: crypto.randomUUID(),
      name: newStudentName,
      petAssigned: false,
      isNew: true
    };

    setStudents([...students, newStudent]);
    setNewStudentName('');
  };

  const handleBatchAddStudents = () => {
    const names = batchStudentText
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const newStudents = names.map(name => ({
      id: crypto.randomUUID(),
      name,
      petAssigned: false,
      isNew: true
    }));

    setStudents([...students, ...newStudents]);
    setBatchStudentText('');
    setShowBatchAdd(false);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      alert(t('settings.account.passwordRequired') || '请填写所有密码字段');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('settings.account.passwordMismatch') || '新密码与确认密码不匹配');
      return;
    }
    if (newPassword.length < 6) {
      alert(t('settings.account.passwordTooShort') || '密码长度至少6位');
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      alert(t('settings.account.passwordChanged') || '密码修改成功');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      alert(err.message || (t('settings.account.passwordChangeFailed') || '密码修改失败'));
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleEditStudent = (id: string, newName: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, name: newName } : s));
    setEditingStudentId(null);
    setEditingStudentName('');
  };

  const handleAssignAllPets = () => {
    setStudents(students.map(s => ({ ...s, petAssigned: true })));
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header */}
      <div
        className="sticky top-0 bg-card border-b border-border z-10"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <h1 className="text-card-foreground">{t('settings.title')}</h1>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">

        {/* 1. Account Management */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-6">{t('settings.account.title')}</h2>

          <div className="space-y-6">
            {/* Profile */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                }}
              >
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-card-foreground">{user?.name || '用户'}</h3>
                  <span
                    className="px-2 py-0.5 text-xs rounded-full text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent) 0%, var(--pet-orange) 100%)' }}
                  >
                    专业版
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('settings.account.expiryDate')}: 2026-12-31
                </p>
              </div>

              {/* Renew Button */}
              <button
                className="px-4 py-2 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                }}
              >
                {t('settings.account.renew')}
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-colors text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('settings.account.changePassword')}</span>
              </button>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex-1 px-4 py-3 border-2 border-destructive rounded-[var(--radius-lg)] text-destructive hover:bg-destructive hover:text-white transition-all text-left flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('settings.account.logout')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* 2. Sound Effects */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-2">{t('settings.sound.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('settings.sound.description')}
          </p>

          <div className="space-y-4">
            {/* Volume Label and Value */}
            <div className="flex items-center justify-between">
              <label className="text-card-foreground">{t('settings.sound.volume')}</label>
              <span className="text-sm px-3 py-1 bg-muted rounded-[var(--radius-md)] text-muted-foreground min-w-[3rem] text-center">
                {volume}%
              </span>
            </div>

            {/* Volume Slider */}
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted"
                style={{
                  background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volume}%, var(--muted) ${volume}%, var(--muted) 100%)`
                }}
              />
            </div>

            {/* Sound Info */}
            <div className="bg-muted/50 rounded-[var(--radius-lg)] p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('settings.sound.includes')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. System Settings */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-6">{t('settings.system.title')}</h2>

          <div className="space-y-6">
            {/* System Name */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label htmlFor="systemName" className="text-card-foreground">
                  {t('settings.system.systemName')}
                </label>
                <span className="px-2 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded-full">
                  {t('settings.system.global')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t('settings.system.systemNameHint')}
              </p>
              <input
                type="text"
                id="systemName"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Class Name */}
            <div>
              <label htmlFor="className" className="block text-card-foreground mb-2">
                {t('settings.system.className')}
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                {t('settings.system.classNameHint')}
              </p>
              <input
                type="text"
                id="className"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* Interface Theme */}
            <div>
              <label className="block text-card-foreground mb-2">
                {t('settings.system.interfaceTheme')}
              </label>
              <p className="text-xs text-muted-foreground mb-4">
                {t('settings.system.interfaceThemeHint')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {(Object.keys(themes) as ThemeColor[]).map((themeName) => {
                  const themeColors = themes[themeName];
                  const themeLabels: Record<ThemeColor, string> = {
                    'spring-green': t('settings.system.theme.springGreen'),
                    'ocean-blue': t('settings.system.theme.oceanBlue'),
                    'sunset-orange': t('settings.system.theme.sunsetOrange'),
                    'lavender-purple': t('settings.system.theme.lavenderPurple'),
                    'rose-pink': t('settings.system.theme.rosePink')
                  };

                  return (
                    <button
                      key={themeName}
                      onClick={() => setTheme(themeName)}
                      className={`relative p-4 rounded-[var(--radius-lg)] border-2 transition-all ${
                        theme === themeName
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                          : 'border-border hover:border-[var(--primary)]/30'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ background: themeColors.primary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ background: themeColors.secondary }}
                          />
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ background: themeColors.accent }}
                          />
                        </div>
                        <span className="text-xs text-card-foreground text-center">
                          {themeLabels[themeName]}
                        </span>
                      </div>
                      {theme === themeName && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-[var(--primary)] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Pet Gameplay Settings */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-2">{t('settings.pet.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('settings.pet.description')}
          </p>

          <div className="space-y-8">

            {/* 4.1 Growth Stage Configuration */}
            <div>
              <h3 className="text-card-foreground mb-3">{t('settings.pet.growthStages')}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t('settings.pet.growthStagesHint')}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {levelFood.map((food, index) => (
                  <div key={index}>
                    <label className="text-xs text-muted-foreground mb-1.5 block">
                      {t('settings.pet.level')} {index + 1}
                    </label>
                    <div className="relative group">
                      <input
                        type="number"
                        min={index === 0 ? 0 : levelFood[index - 1]}
                        max={index === 9 ? undefined : levelFood[index + 1] || undefined}
                        value={food}
                        onChange={(e) => handleLevelFoodChange(index, e.target.value)}
                        disabled={index === 0}
                        className={`w-full px-8 py-2.5 bg-input-background border border-border rounded-[var(--radius-md)] text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all number-input ${
                          index === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      />
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-sm">
                        🍖
                      </div>
                      {index !== 0 && (
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleLevelFoodChange(index, String(food + 1))}
                            className="w-5 h-3 flex items-center justify-center hover:bg-muted/50 rounded-t transition-colors"
                          >
                            <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7 14l5-5 5 5z"/>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLevelFoodChange(index, String(Math.max(levelFood[index - 1] + 1, food - 1)))}
                            className="w-5 h-3 flex items-center justify-center hover:bg-muted/50 rounded-b transition-colors"
                          >
                            <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M7 10l5 5 5-5z"/>
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 bg-muted/50 rounded-[var(--radius-md)] p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-xs text-muted-foreground">
                  {t('settings.pet.growthValidation')}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border"></div>

            {/* 4.2 Guardian & Sleep Settings */}
            <div>
              <h3 className="text-card-foreground mb-3">{t('settings.pet.guardianSleep')}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t('settings.pet.guardianSleepHint')}
              </p>

              <div className="space-y-6">

                {/* Shield Setting */}
                <div className="border border-border rounded-[var(--radius-xl)] p-5 hover:border-[var(--primary)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--primary)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-card-foreground font-medium block mb-1">
                          {t('settings.pet.useShield')}
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('settings.pet.useShieldHint')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setUseShield(!useShield)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        useShield ? 'bg-[var(--primary)]' : 'bg-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          useShield ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {useShield && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground">
                          {t('settings.pet.maxShieldPerDay')}
                        </span>
                        <div className="relative group">
                          <input
                            type="number"
                            min="1"
                            value={maxShieldPerDay}
                            onChange={(e) => setMaxShieldPerDay(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-7 py-1.5 bg-muted border border-border rounded-[var(--radius-md)] text-center text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all number-input"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            {t('common.points')}
                          </span>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                            <button
                              type="button"
                              onClick={() => setMaxShieldPerDay(maxShieldPerDay + 1)}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-t transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"/>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMaxShieldPerDay(Math.max(1, maxShieldPerDay - 1))}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-b transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 10l5 5 5-5z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sleep Setting */}
                <div className="border border-border rounded-[var(--radius-xl)] p-5 hover:border-[var(--secondary)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--secondary)]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--secondary)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.5 22c1.6 0 3.1-.4 4.4-1.1.3-.2.5-.5.5-.9 0-.6-.6-1-1.2-.8-1.4.4-2.9.2-4.2-.6-2.6-1.5-3.5-4.8-2-7.4s4.8-3.5 7.4-2c.8.5 1.5 1.1 2 1.9.3.4.9.6 1.3.3.5-.3.6-.9.3-1.4-.6-1-1.5-1.8-2.6-2.4-3.7-2.1-8.5-.9-10.6 2.8-2.1 3.8-.9 8.5 2.8 10.6 1.2.7 2.5 1 3.9 1zM16 6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1s-1 .4-1 1v2c0 .6.4 1 1 1zm6.7 2.3c.4-.4.4-1 0-1.4l-1.4-1.4c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4l1.4 1.4c.4.4 1 .4 1.4 0zM23 11h-2c-.6 0-1 .4-1 1s.4 1 1 1h2c.6 0 1-.4 1-1s-.4-1-1-1z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-card-foreground font-medium block mb-1">
                          {t('settings.pet.sleepEnabled')}
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('settings.pet.sleepEnabledHint')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSleepEnabled(!sleepEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        sleepEnabled ? 'bg-[var(--secondary)]' : 'bg-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          sleepEnabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {sleepEnabled && (
                    <div className="pt-4 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground">
                          {t('settings.pet.sleepDays')}
                        </span>
                        <div className="relative group">
                          <input
                            type="number"
                            min="1"
                            value={sleepDays}
                            onChange={(e) => setSleepDays(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-7 py-1.5 bg-muted border border-border rounded-[var(--radius-md)] text-center text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent transition-all number-input"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            {t('common.days')}
                          </span>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                            <button
                              type="button"
                              onClick={() => setSleepDays(sleepDays + 1)}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-t transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"/>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSleepDays(Math.max(1, sleepDays - 1))}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-b transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 10l5 5 5-5z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSleepPaused(!sleepPaused)}
                        className={`w-full px-4 py-3 rounded-[var(--radius-lg)] border transition-all flex items-center gap-3 ${
                          sleepPaused
                            ? 'border-[var(--warning)] bg-[var(--warning)]/5'
                            : 'border-border hover:border-[var(--warning)]/30'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0 ${
                          sleepPaused ? 'bg-[var(--warning)]/10' : 'bg-muted'
                        }`}>
                          <svg className={`w-4 h-4 ${sleepPaused ? 'text-[var(--warning)]' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <div className={`text-sm font-medium ${sleepPaused ? 'text-[var(--warning)]' : 'text-card-foreground'}`}>
                            {t('settings.pet.pauseRule')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t('settings.pet.pauseRuleHint')}
                          </div>
                        </div>
                        {sleepPaused && (
                          <span className="px-2.5 py-1 bg-[var(--warning)] text-white text-xs rounded-full font-medium">
                            {t('settings.pet.paused')}
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Debt Threshold Setting */}
                <div className="border border-border rounded-[var(--radius-xl)] p-5 hover:border-[var(--destructive)]/30 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--destructive)]/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-[var(--destructive)]" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="text-card-foreground font-medium block mb-1">
                          {t('settings.pet.debtThreshold')}
                        </label>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {t('settings.pet.debtThresholdHint')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDebtThresholdEnabled(!debtThresholdEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        debtThresholdEnabled ? 'bg-[var(--destructive)]' : 'bg-border'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          debtThresholdEnabled ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {debtThresholdEnabled && (
                    <div className="pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-card-foreground">
                          {t('settings.pet.debtThresholdValue')}
                        </span>
                        <div className="relative group">
                          <input
                            type="number"
                            min="1"
                            value={debtThreshold}
                            onChange={(e) => setDebtThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-20 px-7 py-1.5 bg-muted border border-border rounded-[var(--radius-md)] text-center text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[var(--destructive)] focus:border-transparent transition-all number-input"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                            {t('common.points')}
                          </span>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                            <button
                              type="button"
                              onClick={() => setDebtThreshold(debtThreshold + 1)}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-t transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 14l5-5 5 5z"/>
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => setDebtThreshold(Math.max(1, debtThreshold - 1))}
                              className="w-4 h-3 flex items-center justify-center hover:bg-border/50 rounded-b transition-colors"
                            >
                              <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 10l5 5 5-5z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </section>

        {/* 5. Point System Configuration */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-2">{t('settings.points.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('settings.points.description')}
          </p>

          <div className="space-y-6">
            {/* Add Points Section */}
            <div>
              <h3 className="text-card-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                {t('settings.points.addPoints')}
              </h3>
              <div className="space-y-2">
                {addPointItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)] hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 text-card-foreground">{item.name}</span>
                    <span className="px-3 py-1 bg-[var(--success)]/10 text-[var(--success)] rounded-full text-sm font-medium">
                      +{item.points}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditPointItem(item)}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        title={t('settings.students.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePointItem(item.id, true)}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        title={t('settings.students.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deduct Points Section */}
            <div>
              <h3 className="text-card-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--destructive)]"></span>
                {t('settings.points.deductPoints')}
              </h3>
              <div className="space-y-2">
                {deductPointItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-[var(--radius-lg)] hover:bg-muted/50 transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="flex-1 text-card-foreground">{item.name}</span>
                    <span className="px-3 py-1 bg-[var(--destructive)]/10 text-[var(--destructive)] rounded-full text-sm font-medium">
                      {item.points}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditPointItem(item)}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        title={t('settings.students.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePointItem(item.id, false)}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                        title={t('settings.students.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Item */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIconPickerTarget('new');
                    setShowIconPicker(true);
                  }}
                  className="w-12 h-12 rounded-[var(--radius-lg)] bg-muted hover:bg-border transition-colors flex items-center justify-center text-2xl"
                  title={t('settings.points.changeIcon')}
                >
                  {newItemIcon}
                </button>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder={t('settings.points.itemNamePlaceholder')}
                  className="flex-1 px-4 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                />
                <div className="relative group w-24">
                  <input
                    type="number"
                    value={newItemPoints}
                    onChange={(e) => setNewItemPoints(parseInt(e.target.value) || 0)}
                    className="w-full px-7 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-center text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all number-input"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    分
                  </span>
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                    <button
                      type="button"
                      onClick={() => setNewItemPoints(newItemPoints + 1)}
                      className="w-4 h-3.5 flex items-center justify-center hover:bg-border/50 rounded-t transition-colors"
                    >
                      <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 14l5-5 5 5z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemPoints(newItemPoints - 1)}
                      className="w-4 h-3.5 flex items-center justify-center hover:bg-border/50 rounded-b transition-colors"
                    >
                      <svg className="w-2.5 h-2.5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAddPointItem}
                  className="px-5 py-2.5 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                  }}
                >
                  {t('settings.points.add')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Student List */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-2">{t('settings.students.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('settings.students.description')}
          </p>

          <div className="space-y-4">
            {/* Add Student Controls */}
            <div className="flex gap-3">
              <input
                type="text"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddStudent()}
                placeholder={t('settings.students.namePlaceholder')}
                className="flex-1 px-4 py-2.5 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
              <button
                onClick={handleAddStudent}
                className="px-5 py-2.5 bg-[var(--primary)] text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
              >
                {t('settings.students.addSingle')}
              </button>
              <button
                onClick={() => setShowBatchAdd(true)}
                className="px-5 py-2.5 border-2 border-[var(--primary)] text-[var(--primary)] rounded-[var(--radius-lg)] hover:bg-[var(--primary)]/5 transition-all"
              >
                {t('settings.students.addBatch')}
              </button>
            </div>

            {/* Student List */}
            {students.length > 0 ? (
              <div className="border border-border rounded-[var(--radius-xl)] divide-y divide-border">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center text-white text-sm font-medium">
                      {student.name.charAt(0)}
                    </div>
                    {editingStudentId === student.id ? (
                      <input
                        type="text"
                        value={editingStudentName}
                        onChange={(e) => setEditingStudentName(e.target.value)}
                        onBlur={() => handleEditStudent(student.id, editingStudentName)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditStudent(student.id, editingStudentName)}
                        className="flex-1 px-3 py-1 bg-input-background border border-border rounded-[var(--radius-md)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-card-foreground">{student.name}</span>
                    )}
                    {student.petAssigned && (
                      <span className="px-2 py-1 bg-[var(--success)]/10 text-[var(--success)] text-xs rounded-full">
                        {t('settings.students.petAssigned')}
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={() => {
                          setEditingStudentId(student.id);
                          setEditingStudentName(student.name);
                        }}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground"
                        title={t('settings.students.edit')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="w-7 h-7 rounded-[var(--radius-md)] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                        title={t('settings.students.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('settings.students.empty')}
              </div>
            )}

            {/* Assign All Pets Button */}
            {students.length > 0 && (
              <button
                onClick={handleAssignAllPets}
                className="w-full py-3 border-2 border-dashed border-[var(--primary)] text-[var(--primary)] rounded-[var(--radius-lg)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('settings.students.assignAllPets')}
              </button>
            )}
          </div>
        </section>

        {/* 7. Group Management */}
        <section
          className="bg-card rounded-[var(--radius-2xl)] p-6"
          style={{ boxShadow: 'var(--shadow-lg)' }}
        >
          <h2 className="text-card-foreground mb-2">{t('settings.groups.title')}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {t('settings.groups.description')}
          </p>

          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full py-4 border-2 border-dashed border-border rounded-[var(--radius-xl)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-3 text-muted-foreground hover:text-[var(--primary)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round"/>
            </svg>
            <span>{t('settings.groups.manage')}</span>
          </button>

          {groups.length > 0 && (
            <div className="mt-4 space-y-3">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="p-4 bg-muted/30 rounded-[var(--radius-lg)] hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-card-foreground font-medium">{group.name}</h4>
                    <span className="text-xs text-muted-foreground">
                      {group.members.length} {t('settings.groups.members')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.members.slice(0, 5).map((memberId) => {
                      const student = students.find(s => s.id === memberId);
                      return student ? (
                        <span
                          key={memberId}
                          className="px-2 py-1 bg-card rounded-full text-xs text-card-foreground"
                        >
                          {student.name}
                        </span>
                      ) : null;
                    })}
                    {group.members.length > 5 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        +{group.members.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={async () => {
              try {
                // Create new students via API (those marked as isNew)
                const studentsToSave = await Promise.all(
                  students.map(async (s) => {
                    if (s.isNew) {
                      if (!currentClassId) return s;
                      try {
                        const created = await createStudent(currentClassId, s.name);
                        return { ...s, id: created.id, petAssigned: !!created.pet_type, isNew: false };
                      } catch {
                        return s;
                      }
                    }
                    return s;
                  })
                );

                // Save settings to API
                const allPointItems = [
                  ...addPointItems.map((p, i) => ({ ...p, sort_order: i })),
                  ...deductPointItems.map((p, i) => ({ ...p, sort_order: addPointItems.length + i })),
                ];
                try {
                  await saveSettings({ pointItems: allPointItems, levelConfig: levelFood });
                } catch {
                  // Settings save failed, continue
                }

                if (onSave) {
                  const settingsToSave: Settings = {
                    addPointItems,
                    deductPointItems,
                    useShield,
                    maxShieldPerDay,
                    levelFood
                  };
                  onSave(studentsToSave, settingsToSave, className);
                } else {
                  onClose();
                }
              } catch (err) {
                console.error('Save failed:', err);
                alert('保存失败');
              }
            }}
            className="px-8 py-3 text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 50%, var(--primary-dark) 100%)',
              boxShadow: '0 4px 16px rgba(61, 208, 145, 0.3)'
            }}
          >
            {t('settings.save')}
          </button>
        </div>

      </div>

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <IconPicker
          currentIcon={iconPickerTarget === 'new' ? newItemIcon : (editingItem?.icon || '⭐')}
          onSelect={(icon) => {
            if (iconPickerTarget === 'new') {
              setNewItemIcon(icon);
            } else if (editingItem) {
              setEditingItem({ ...editingItem, icon });
            }
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {/* Edit Point Item Modal */}
      {editingItem && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setEditingItem(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-card-foreground font-medium">{t('settings.points.editItem')}</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Icon */}
                <div>
                  <label className="block text-card-foreground mb-2 text-sm">{t('settings.points.icon')}</label>
                  <button
                    onClick={() => {
                      setIconPickerTarget('edit');
                      setShowIconPicker(true);
                    }}
                    className="w-16 h-16 rounded-[var(--radius-lg)] bg-muted hover:bg-border transition-colors flex items-center justify-center text-3xl"
                  >
                    {editingItem.icon}
                  </button>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-card-foreground mb-2 text-sm">{t('settings.points.itemName')}</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  />
                </div>

                {/* Points */}
                <div>
                  <label className="block text-card-foreground mb-2 text-sm">{t('settings.points.pointValue')}</label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={editingItem.points}
                      onChange={(e) => setEditingItem({ ...editingItem, points: parseInt(e.target.value) || 0 })}
                      className="w-full px-10 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-center text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all number-input"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                      分
                    </span>
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, points: editingItem.points + 1 })}
                        className="w-5 h-4 flex items-center justify-center hover:bg-border/50 rounded-t transition-colors"
                      >
                        <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 14l5-5 5 5z"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, points: editingItem.points - 1 })}
                        className="w-5 h-4 flex items-center justify-center hover:bg-border/50 rounded-b transition-colors"
                      >
                        <svg className="w-3 h-3 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M7 10l5 5 5-5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.points.pointValueHint')}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleSaveEditItem}
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
      )}

      {/* Group Management Modal */}
      {showGroupModal && (
        <GroupManagementModal
          students={students}
          groups={groups}
          onClose={() => setShowGroupModal(false)}
          onSave={(newGroups) => {
            setGroups(newGroups);
            setShowGroupModal(false);
          }}
        />
      )}

      {/* Batch Add Students Modal */}
      {showBatchAdd && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowBatchAdd(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-lg p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-card-foreground font-medium">{t('settings.students.batchAddTitle')}</h3>
                <button
                  onClick={() => setShowBatchAdd(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.students.batchAddHint')}
              </p>
              <textarea
                value={batchStudentText}
                onChange={(e) => setBatchStudentText(e.target.value)}
                placeholder={t('settings.students.batchAddPlaceholder')}
                className="w-full h-64 px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none"
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowBatchAdd(false)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleBatchAddStudents}
                  className="flex-1 px-4 py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                  }}
                >
                  {t('settings.students.addAll')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={() => setShowChangePassword(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-card-foreground font-medium text-lg">{t('settings.account.changePassword')}</h3>
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="w-8 h-8 rounded-full hover:bg-muted transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    {t('settings.account.oldPassword') || '旧密码'}
                  </label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder={t('settings.account.oldPasswordPlaceholder') || '请输入旧密码'}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    {t('settings.account.newPassword') || '新密码'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.account.newPasswordPlaceholder') || '请输入新密码（至少6位）'}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    {t('settings.account.confirmNewPassword') || '确认新密码'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('settings.account.confirmPasswordPlaceholder') || '请再次输入新密码'}
                    className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowChangePassword(false)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleChangePassword}
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
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-card rounded-[var(--radius-2xl)] w-full max-w-md p-6 pointer-events-auto"
              style={{ boxShadow: 'var(--shadow-xl)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-card-foreground font-medium mb-2">
                    {t('settings.account.logoutConfirm') || '确认退出登录？'}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t('settings.account.logoutMessage') || '退出登录后，您需要重新登录才能继续使用。'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-3 border-2 border-border rounded-[var(--radius-lg)] text-card-foreground hover:bg-muted transition-all"
                >
                  {t('settings.students.cancel')}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 rounded-[var(--radius-lg)] text-white hover:opacity-90 transition-opacity"
                  style={{ background: 'var(--destructive)' }}
                >
                  {t('settings.account.logout')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add custom styles */}
      <style>{`
        /* Slider styles */
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid var(--primary);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          border: 2px solid var(--primary);
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        /* Hide default number input spinners */
        input[type="number"].number-input::-webkit-inner-spin-button,
        input[type="number"].number-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type="number"].number-input {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
