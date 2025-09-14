import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Users, Calendar, Settings, LogOut, User, Video, Sun, Moon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentTab, onTabChange }) => {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const tabs = [
    { id: 'directory', label: 'Members', icon: Users, disabled: true },
    { id: 'calendar', label: 'Birthdays', icon: Calendar },
    { id: 'calls', label: 'Video Calls', icon: Video },
    { id: 'preview', label: 'Preview', icon: Settings },
    { id: 'profile', label: 'Profile', icon: User },
    ...(user?.is_admin ? [{ id: 'admin', label: 'Admin', icon: Settings, disabled: false }] : []),
  ];

  const handleTabClick = (tab: { id: string; disabled?: boolean }) => {
    // Don't allow navigation to disabled tabs
    if (tab.disabled) {
      return;
    }
    onTabChange(tab.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 dark:bg-blue-500 rounded-lg p-2">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">JHA Men Of Impact</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Private Community</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.is_admin ? 'Administrator' : 'Member'}
                  {user?.id === 'admin-bypass-id' && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Demo Mode
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={signOut}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const { id, label, icon: Icon, disabled = false } = tab;
              return (
              <button
                key={id}
                onClick={() => handleTabClick(tab)}
                disabled={disabled}
                aria-disabled={disabled}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  disabled
                    ? 'border-transparent text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-60'
                    : currentTab === id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                }`}
                title={disabled ? `${label} - Currently disabled` : label}
              >
                <Icon size={18} className={disabled ? 'opacity-60' : ''} />
                <span>{label}</span>
              </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
        {children}
      </main>
    </div>
  );
};