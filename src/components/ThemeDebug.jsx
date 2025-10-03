import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeDebug = () => {
  const { theme, isDark, isLight, toggleTheme } = useTheme();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: isDark ? '#1f2937' : '#ffffff',
      color: isDark ? '#ffffff' : '#000000',
      padding: '10px',
      border: '1px solid',
      borderColor: isDark ? '#374151' : '#e5e7eb',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div><strong>Theme Debug:</strong></div>
      <div>Theme: {theme}</div>
      <div>isDark: {isDark.toString()}</div>
      <div>isLight: {isLight.toString()}</div>
      <div>HTML class: {document.documentElement.className}</div>
      <button 
        onClick={toggleTheme}
        style={{
          marginTop: '8px',
          padding: '4px 8px',
          background: isDark ? '#374151' : '#f3f4f6',
          color: isDark ? '#ffffff' : '#000000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Toggle
      </button>
    </div>
  );
};

export default ThemeDebug;