import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { login, register } from '../services/auth';

interface LoginPageProps {
  onLogin?: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const { language, setLanguage, t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError(t('login.passwordMismatch') || 'Passwords do not match');
      return;
    }

    if (!isLogin && formData.password.length < 6) {
      setError(t('login.passwordTooShort') || 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name);
      }
      if (onLogin) {
        onLogin();
      }
    } catch (err: any) {
      const errorMsg = err.message || (isLogin ? t('login.loginFailed') : t('register.failed'));
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const switchMode = (mode: boolean) => {
    setIsLogin(mode);
    setError('');
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-10">
        <div className="flex gap-1 p-1 bg-card rounded-[var(--radius-lg)] border border-border" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <button
            onClick={() => setLanguage('zh')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-all ${
              language === 'zh'
                ? 'bg-[var(--primary)] text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-all ${
              language === 'en'
                ? 'bg-[var(--primary)] text-white'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="w-full max-w-md">

        {/* Logo Section */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-[var(--radius-xl)] flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 50%, var(--primary-dark) 100%)',
              boxShadow: '0 8px 24px rgba(61, 208, 145, 0.25)'
            }}
          >
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              <circle cx="12" cy="9" r="1.5" fill="white"/>
              <ellipse cx="9" cy="12" rx="1" ry="1.5" fill="white"/>
              <ellipse cx="15" cy="12" rx="1" ry="1.5" fill="white"/>
              <path d="M12 15c-1.5 0-2.5 1-2.5 2h5c0-1-1-2-2.5-2z" fill="white"/>
            </svg>
          </div>
          <h1
            className="mb-2 bg-clip-text text-transparent"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)'
            }}
          >
            {t('app.name')}
          </h1>
          <p className="text-muted-foreground">{t('app.slogan')}</p>
        </div>

        {/* Main Card */}
        <div
          className="bg-card rounded-[var(--radius-2xl)] p-6 md:p-8"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-[var(--radius-lg)]">
            <button
              onClick={() => switchMode(true)}
              className={`flex-1 py-2.5 rounded-[var(--radius-md)] transition-all ${
                isLogin
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('login.title')}
            </button>
            <button
              onClick={() => switchMode(false)}
              className={`flex-1 py-2.5 rounded-[var(--radius-md)] transition-all ${
                !isLogin
                  ? 'bg-card text-card-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('login.register')}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Name (for registration only) */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-card-foreground mb-2">
                  {t('login.name') || '姓名'}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('login.name.placeholder') || '请输入姓名'}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-card-foreground mb-2">
                {t('login.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={t('login.email.placeholder')}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-card-foreground mb-2">
                {t('login.password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={t('login.password.placeholder')}
                className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Confirm Password (for registration) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-card-foreground mb-2">
                  {t('login.confirmPassword')}
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder={t('login.confirmPassword.placeholder')}
                  className="w-full px-4 py-3 bg-input-background border border-border rounded-[var(--radius-lg)] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                  required
                />
              </div>
            )}

            {/* Forgot Password (login only) */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  className="text-[var(--primary)] hover:opacity-80 transition-opacity text-sm"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-white rounded-[var(--radius-lg)] hover:opacity-90 transition-all mt-6 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 50%, var(--primary-dark) 100%)',
                boxShadow: '0 4px 16px rgba(61, 208, 145, 0.3)'
              }}
            >
              {loading ? (isLogin ? t('login.loggingIn') : t('register.registering')) : (isLogin ? t('login.submit') : t('register.submit'))}
            </button>
          </form>

          {/* Additional Info */}
          {!isLogin && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              {t('register.terms')}
              <button className="text-[var(--primary)] hover:opacity-80 ml-1">
                {t('register.termsOfService')}
              </button>
              {' '}{t('register.and')}{' '}
              <button className="text-[var(--primary)] hover:opacity-80">
                {t('register.privacyPolicy')}
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>{t('app.footer')}</p>
        </div>

      </div>
    </div>
  );
}
