import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeColor = 'spring-green' | 'ocean-blue' | 'sunset-orange' | 'lavender-purple' | 'rose-pink';

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const themes: Record<ThemeColor, {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  accent: string;
}> = {
  'spring-green': {
    primary: '#4DD0A1',
    primaryLight: '#5EE6A8',
    primaryDark: '#3CB890',
    secondary: '#9B9EF5',
    accent: '#FF9A8E'
  },
  'ocean-blue': {
    primary: '#4A9FF5',
    primaryLight: '#6BB3F7',
    primaryDark: '#3B8FE0',
    secondary: '#A8D5FF',
    accent: '#FFB84D'
  },
  'sunset-orange': {
    primary: '#FF8C42',
    primaryLight: '#FFA366',
    primaryDark: '#E57A38',
    secondary: '#FFD93D',
    accent: '#FF6B9D'
  },
  'lavender-purple': {
    primary: '#9B7EDE',
    primaryLight: '#B298E8',
    primaryDark: '#8667D1',
    secondary: '#DEB8FF',
    accent: '#FF9ECD'
  },
  'rose-pink': {
    primary: '#FF6B9D',
    primaryLight: '#FF8BB3',
    primaryDark: '#E55A8A',
    secondary: '#FFB3D9',
    accent: '#FFD93D'
  }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeColor>('spring-green');

  const setTheme = (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    localStorage.setItem('pet-garden-theme', newTheme);
    applyTheme(newTheme);
  };

  const applyTheme = (themeName: ThemeColor) => {
    const themeColors = themes[themeName];
    const root = document.documentElement;

    // Apply theme colors to CSS variables
    root.style.setProperty('--primary', themeColors.primary);
    root.style.setProperty('--primary-light', themeColors.primaryLight);
    root.style.setProperty('--primary-dark', themeColors.primaryDark);
    root.style.setProperty('--secondary', themeColors.secondary);
    root.style.setProperty('--accent', themeColors.accent);

    // Also update the hover state
    root.style.setProperty('--primary-hover', themeColors.primaryDark);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('pet-garden-theme') as ThemeColor;
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export { themes };
