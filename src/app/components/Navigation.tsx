'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    const darkModePreference = localStorage.getItem('darkMode');
    setIsDarkMode(darkModePreference === 'true');
  }, []);

  // Update localStorage and document class when dark mode changes
  useEffect(() => {
    if (isDarkMode === null) return;

    localStorage.setItem('darkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Function to toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Don't render until we've initialized the dark mode preference
  if (isDarkMode === null) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-gray-900 dark:text-white font-semibold text-lg">
              Voiceflow Agent Tester
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                href="/"
                className={`${
                  pathname === '/'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } px-3 py-2 text-sm font-medium`}
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className={`${
                  pathname === '/settings'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                } px-3 py-2 text-sm font-medium`}
              >
                Settings
              </Link>
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {isDarkMode ? '🌞 Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
    </nav>
  );
}
