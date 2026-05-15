import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { randomPick } from '../services/interactions';

interface Student {
  id: string;
  name: string;
}

interface InteractionModalProps {
  students: Student[];
  classId: string;
  onClose: () => void;
}

export default function InteractionModal({ students, classId, onClose }: InteractionModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'picker' | 'timer'>('picker');

  // Random Picker State
  const [pickerCount, setPickerCount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [currentDisplayNames, setCurrentDisplayNames] = useState<string[]>([]);

  // Timer State
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Play timer end sound using Web Audio API
  const playTimerEndSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.warn('Timer sound failed:', err);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            playTimerEndSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, remainingTime]);

  const handleSpin = async () => {
    if (students.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setSelectedStudents([]);

    let spinCount = 0;
    const maxSpins = 20;

    // First call API to get fair random selection
    let finalSelection: Student[] = [];
    try {
      const result = await randomPick(classId, pickerCount);
      finalSelection = result.picked;
    } catch (err) {
      console.error('Failed to pick students:', err);
      setIsSpinning(false);
      return;
    }

    const spinInterval = setInterval(() => {
      // Animate through random students during animation
      const randomStudents = Array.from({ length: pickerCount }, () =>
        students[Math.floor(Math.random() * students.length)]
      );
      setCurrentDisplayNames(randomStudents.map(s => s.name));

      spinCount++;

      if (spinCount >= maxSpins) {
        clearInterval(spinInterval);
        setSelectedStudents(finalSelection);
        setCurrentDisplayNames(finalSelection.map(s => s.name));
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleStartTimer = () => {
    const totalSeconds = timerMinutes * 60 + timerSeconds;
    if (totalSeconds > 0) {
      setRemainingTime(totalSeconds);
      setIsTimerRunning(true);
    }
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setRemainingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card rounded-[var(--radius-2xl)] w-full max-w-2xl max-h-[90vh] flex flex-col pointer-events-auto"
          style={{ boxShadow: 'var(--shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-card-foreground">{t('interaction.title')}</h2>
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
                onClick={() => setActiveTab('picker')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'picker'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('interaction.randomPicker')}
              </button>
              <button
                onClick={() => setActiveTab('timer')}
                className={`px-4 py-2 rounded-[var(--radius-lg)] text-sm font-medium transition-all ${
                  activeTab === 'timer'
                    ? 'bg-[var(--primary)] text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('interaction.timer')}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'picker' && (
              <div className="space-y-6">
                {/* Settings */}
                <div className="flex items-center justify-between">
                  <label className="text-card-foreground">{t('interaction.pickCount')}</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPickerCount(Math.max(1, pickerCount - 1))}
                      disabled={isSpinning}
                      className="w-8 h-8 rounded-[var(--radius-md)] bg-muted hover:bg-border transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13H5v-2h14v2z"/>
                      </svg>
                    </button>
                    <span className="w-12 text-center text-card-foreground font-medium">{pickerCount}</span>
                    <button
                      onClick={() => setPickerCount(Math.min(students.length, pickerCount + 1))}
                      disabled={isSpinning || pickerCount >= students.length}
                      className="w-8 h-8 rounded-[var(--radius-md)] bg-muted hover:bg-border transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Display Area */}
                <div
                  className="rounded-[var(--radius-2xl)] p-8 min-h-[200px] flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light)20 0%, var(--primary)10 100%)'
                  }}
                >
                  <div className="text-center">
                    {currentDisplayNames.length === 0 ? (
                      <div className="text-muted-foreground text-lg">{t('interaction.clickToStart')}</div>
                    ) : (
                      <div className="flex flex-wrap gap-3 justify-center">
                        {currentDisplayNames.map((name, index) => (
                          <div
                            key={index}
                            className={`px-6 py-4 rounded-[var(--radius-xl)] bg-card text-card-foreground font-medium text-2xl transition-all ${
                              isSpinning ? 'animate-pulse' : 'scale-110'
                            }`}
                            style={{ boxShadow: 'var(--shadow-lg)' }}
                          >
                            {name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Spin Button */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || students.length === 0}
                  className="w-full py-4 rounded-[var(--radius-xl)] text-white text-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {isSpinning ? t('interaction.spinning') : t('interaction.startSpin')}
                </button>

                {students.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm">
                    {t('interaction.noStudents')}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'timer' && (
              <div className="space-y-6">
                {/* Timer Settings */}
                {remainingTime === 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-card-foreground mb-2">{t('interaction.minutes')}</label>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={timerMinutes}
                          onChange={(e) => setTimerMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground text-center text-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-card-foreground mb-2">{t('interaction.seconds')}</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={timerSeconds}
                          onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                          className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground text-center text-2xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Quick Time Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 5, 10].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            setTimerMinutes(mins);
                            setTimerSeconds(0);
                          }}
                          className="px-3 py-2 rounded-[var(--radius-md)] bg-muted hover:bg-border transition-colors text-sm text-card-foreground"
                        >
                          {mins} {t('interaction.min')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timer Display */}
                {remainingTime > 0 && (
                  <div
                    className="rounded-[var(--radius-2xl)] p-12 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, var(--secondary)20 0%, var(--secondary)10 100%)'
                    }}
                  >
                    <div className="text-center">
                      <div
                        className="font-mono font-bold mb-4"
                        style={{
                          fontSize: '5rem',
                          background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {formatTime(remainingTime)}
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={isTimerRunning ? handlePauseTimer : handleStartTimer}
                          className="px-6 py-3 rounded-[var(--radius-lg)] bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
                        >
                          {isTimerRunning ? t('interaction.pause') : t('interaction.resume')}
                        </button>
                        <button
                          onClick={handleResetTimer}
                          className="px-6 py-3 rounded-[var(--radius-lg)] bg-muted text-card-foreground hover:bg-border transition-colors"
                        >
                          {t('interaction.reset')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Start Button */}
                {remainingTime === 0 && (
                  <button
                    onClick={handleStartTimer}
                    disabled={timerMinutes === 0 && timerSeconds === 0}
                    className="w-full py-4 rounded-[var(--radius-xl)] text-white text-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {t('interaction.startTimer')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
