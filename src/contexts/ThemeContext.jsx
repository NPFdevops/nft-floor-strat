import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState('system'); // light, dark, or system
  const [actualTheme, setActualTheme] = useState('light'); // the actual theme being applied
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to get system preference
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Function to update actual theme based on mode
  const updateActualTheme = (mode) => {
    let newTheme;
    if (mode === 'system') {
      newTheme = getSystemTheme();
    } else {
      newTheme = mode;
    }
    setActualTheme(newTheme);
    
    // Apply to DOM
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Initialize theme after component mounts
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      const savedMode = localStorage.getItem('themeMode');
      if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
        setThemeMode(savedMode);
        updateActualTheme(savedMode);
      } else {
        // Default to system mode
        setThemeMode('system');
        updateActualTheme('system');
        localStorage.setItem('themeMode', 'system');
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update actual theme when theme mode changes
  useEffect(() => {
    if (isInitialized) {
      updateActualTheme(themeMode);
      localStorage.setItem('themeMode', themeMode);
    }
  }, [themeMode, isInitialized]);
  
  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (typeof window !== 'undefined' && themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        if (themeMode === 'system') {
          updateActualTheme('system');
        }
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const changeThemeMode = (mode) => {
    setThemeMode(mode);
  };

  const toggleTheme = () => {
    const modes = ['light', 'dark', 'system'];
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setThemeMode(nextMode);
  };

  const value = {
    themeMode,
    actualTheme,
    setThemeMode: changeThemeMode,
    toggleTheme,
    isLight: actualTheme === 'light',
    isDark: actualTheme === 'dark',
    isSystem: themeMode === 'system'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};