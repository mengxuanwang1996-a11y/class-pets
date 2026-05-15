import { useState } from 'react';
import LoginPage from './components/LoginPage';
import HomePage from './components/HomePage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const { user, loading } = useAuth();
  const [showStyleGuide, setShowStyleGuide] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('app.loading') || '加载中...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={() => window.location.reload()} />;
  }

  if (!showStyleGuide) {
    return <HomePage />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative">
      <div className="absolute top-6 right-6 z-10">
        <div className="flex gap-1 p-1 bg-card rounded-[var(--radius-lg)] border border-border" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <button
            onClick={() => setLanguage('zh')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-all ${
              language === 'zh' ? 'bg-[var(--primary)] text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-all ${
              language === 'en' ? 'bg-[var(--primary)] text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <button
            onClick={() => setShowStyleGuide(false)}
            className="px-6 py-2 text-[var(--primary)] border-2 border-[var(--primary)] rounded-[var(--radius-lg)] hover:bg-[var(--primary)] hover:text-white transition-all"
          >
            {t('styleGuide.backToLogin')}
          </button>
        </div>

        <div className="text-center space-y-3">
          <h1
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)' }}
          >
            {t('styleGuide.title')}
          </h1>
          <p className="text-muted-foreground">{t('app.description')}</p>
        </div>

        <div className="bg-card rounded-[var(--radius-2xl)] p-8 md:p-12 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5EE6A8 0%, #4DD0A1 50%, #3CB890 100%)', boxShadow: '0 8px 32px rgba(61, 208, 145, 0.3)' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-[var(--radius-lg)] flex items-center justify-center backdrop-blur-sm">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white">{t('styleGuide.leaderboard')}</h2>
                <p className="text-white/75">{t('styleGuide.leaderboardDesc')}</p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <p className="text-white/60 text-sm">{t('styleGuide.referenceStyle')}</p>
        </div>

        <div className="bg-card rounded-[var(--radius-xl)] p-6 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-card-foreground mb-4">{t('styleGuide.colorScheme')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-20 rounded-[var(--radius-lg)] flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 50%, var(--primary-dark) 100%)' }}>
                <span className="text-[var(--primary-foreground)] font-medium">{t('styleGuide.primary')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">{t('styleGuide.primaryDesc')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-[var(--radius-lg)] bg-[var(--secondary)] flex items-center justify-center shadow-md">
                <span className="text-[var(--secondary-foreground)] font-medium">{t('styleGuide.secondary')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">{t('styleGuide.secondaryDesc')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-[var(--radius-lg)] bg-[var(--accent)] flex items-center justify-center shadow-md">
                <span className="text-[var(--accent-foreground)] font-medium">{t('styleGuide.accent')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">{t('styleGuide.accentDesc')}</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-[var(--radius-lg)] bg-[var(--success)] flex items-center justify-center shadow-md">
                <span className="text-[var(--success-foreground)] font-medium">{t('styleGuide.success')}</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">{t('styleGuide.successDesc')}</p>
            </div>
          </div>
          <div className="pt-4">
            <h3 className="text-card-foreground mb-3">{t('styleGuide.petColors')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="h-16 rounded-[var(--radius-md)] bg-[var(--pet-pink)]"></div>
              <div className="h-16 rounded-[var(--radius-md)] bg-[var(--pet-orange)]"></div>
              <div className="h-16 rounded-[var(--radius-md)] bg-[var(--pet-purple)]"></div>
              <div className="h-16 rounded-[var(--radius-md)] bg-[var(--pet-green)]"></div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[var(--radius-xl)] p-6 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-card-foreground mb-4">{t('styleGuide.typography')}</h2>
          <div className="space-y-3">
            <h1 className="text-foreground">标题 1 - 大标题</h1>
            <h2 className="text-foreground">标题 2 - 次级标题</h2>
            <h3 className="text-foreground">标题 3 - 小标题</h3>
            <p className="text-foreground">正文 - 这是一段普通文本，展示了我们的字体系统在长段落中的表现。</p>
            <p className="text-muted-foreground">次要文本 - 用于辅助信息和说明</p>
          </div>
        </div>

        <div className="bg-card rounded-[var(--radius-xl)] p-6 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-card-foreground mb-4">{t('styleGuide.cards')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-[var(--radius-lg)] p-4 border border-border">
              <h4 className="text-card-foreground mb-2">小阴影</h4>
              <p className="text-sm text-muted-foreground">适合列表项</p>
            </div>
            <div className="bg-card rounded-[var(--radius-lg)] p-4" style={{ boxShadow: 'var(--shadow-md)' }}>
              <h4 className="text-card-foreground mb-2">中等阴影</h4>
              <p className="text-sm text-muted-foreground">适合卡片</p>
            </div>
            <div className="bg-card rounded-[var(--radius-lg)] p-4" style={{ boxShadow: 'var(--shadow-xl)' }}>
              <h4 className="text-card-foreground mb-2">大阴影</h4>
              <p className="text-sm text-muted-foreground">适合模态框</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-[var(--radius-xl)] p-6 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-card-foreground mb-4">{t('styleGuide.buttons')}</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-6 py-3 text-[var(--primary-foreground)] rounded-[var(--radius-lg)] hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)' }}>主要按钮</button>
            <button className="px-6 py-3 bg-[var(--secondary)] text-[var(--secondary-foreground)] rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity">次要按钮</button>
            <button className="px-6 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] rounded-[var(--radius-lg)] hover:opacity-90 transition-opacity">强调按钮</button>
            <button className="px-6 py-3 border-2 border-[var(--primary)] bg-transparent text-[var(--primary)] rounded-[var(--radius-lg)] hover:bg-[var(--primary)] hover:text-white transition-all">轮廓按钮</button>
          </div>
        </div>

        <div className="bg-card rounded-[var(--radius-xl)] p-6 space-y-4" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <h2 className="text-card-foreground mb-4">{t('styleGuide.radius')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="h-16 bg-muted rounded-[var(--radius-sm)] flex items-center justify-center"><span className="text-xs text-muted-foreground">SM</span></div>
            <div className="h-16 bg-muted rounded-[var(--radius-md)] flex items-center justify-center"><span className="text-xs text-muted-foreground">MD</span></div>
            <div className="h-16 bg-muted rounded-[var(--radius-lg)] flex items-center justify-center"><span className="text-xs text-muted-foreground">LG</span></div>
            <div className="h-16 bg-muted rounded-[var(--radius-xl)] flex items-center justify-center"><span className="text-xs text-muted-foreground">XL</span></div>
            <div className="h-16 bg-muted rounded-[var(--radius-2xl)] flex items-center justify-center"><span className="text-xs text-muted-foreground">2XL</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
