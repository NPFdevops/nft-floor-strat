import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { themeMode, actualTheme, setThemeMode, isSystem } = useTheme();

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className={`${actualTheme === 'dark' ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden border transition-all duration-200 transform hover:scale-[1.01] max-h-[90vh] overflow-y-auto`} style={{fontFamily: '"Space Grotesk", sans-serif'}}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${actualTheme === 'dark' ? 'text-white' : 'text-black'} tracking-tight`}>Settings</h2>
          <button
            onClick={onClose}
            className={`w-9 h-9 flex items-center justify-center rounded ${actualTheme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-200 hover:scale-105`}
            aria-label="Close settings"
          >
            <svg className={`w-4 h-4 ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Appearance Section */}
            <div>
              <h3 className={`text-lg font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-black'} mb-4`}>Appearance</h3>
              
              {/* Theme Options */}
              <div className="space-y-4">
                {/* Light Mode */}
                <label className={`flex items-center justify-between cursor-pointer p-3 rounded border-2 transition-all duration-200 ${themeMode === 'light' ? 'border-[#F11F9D] bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20' : actualTheme === 'dark' ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${themeMode === 'light' ? 'bg-[#F11F9D] text-white' : actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-black'}`}>Light Mode</p>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Always use light theme</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${themeMode === 'light' ? 'border-[#F11F9D] bg-[#F11F9D]' : actualTheme === 'dark' ? 'border-gray-500' : 'border-gray-300'}`}>
                    {themeMode === 'light' && (
                      <div className="w-2 h-2 rounded bg-white"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={themeMode === 'light'}
                    onChange={() => setThemeMode('light')}
                    className="sr-only"
                  />
                </label>
                
                {/* Dark Mode */}
                <label className={`flex items-center justify-between cursor-pointer p-3 rounded border-2 transition-all duration-200 ${themeMode === 'dark' ? 'border-[#F11F9D] bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20' : actualTheme === 'dark' ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${themeMode === 'dark' ? 'bg-[#F11F9D] text-white' : actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-black'}`}>Dark Mode</p>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Always use dark theme</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${themeMode === 'dark' ? 'border-[#F11F9D] bg-[#F11F9D]' : actualTheme === 'dark' ? 'border-gray-500' : 'border-gray-300'}`}>
                    {themeMode === 'dark' && (
                      <div className="w-2 h-2 rounded bg-white"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={themeMode === 'dark'}
                    onChange={() => setThemeMode('dark')}
                    className="sr-only"
                  />
                </label>
                
                {/* System Mode */}
                <label className={`flex items-center justify-between cursor-pointer p-3 rounded border-2 transition-all duration-200 ${themeMode === 'system' ? 'border-[#F11F9D] bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20' : actualTheme === 'dark' ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded flex items-center justify-center transition-colors ${themeMode === 'system' ? 'bg-[#F11F9D] text-white' : actualTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`text-base font-semibold ${actualTheme === 'dark' ? 'text-white' : 'text-black'}`}>System</p>
                      <p className={`text-sm ${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Follow system preference {isSystem && `(currently ${actualTheme})`}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${themeMode === 'system' ? 'border-[#F11F9D] bg-[#F11F9D]' : actualTheme === 'dark' ? 'border-gray-500' : 'border-gray-300'}`}>
                    {themeMode === 'system' && (
                      <div className="w-2 h-2 rounded bg-white"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    checked={themeMode === 'system'}
                    onChange={() => setThemeMode('system')}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* System Information */}
            <div className={`pt-6 border-t ${actualTheme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center justify-center gap-2 text-xs">
                <div className="w-2 h-2 bg-[#F11F9D] rounded-full animate-pulse"></div>
                <p className={`${actualTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                  Theme preference is saved automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;