import React, { useState } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { ThemeProvider } from './components/ThemeProvider';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { MemberDirectory } from './components/MemberDirectory';
import { BirthdayCalendar } from './components/BirthdayCalendar';
import { ProfilePage } from './components/ProfilePage';
import { AdminPanel } from './components/AdminPanel';
import { VideoCall } from './components/VideoCall';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MobileDebugger } from './components/MobileDebugger';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('directory');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'directory':
        return <MemberDirectory />;
      case 'calendar':
        return <BirthdayCalendar />;
      case 'calls':
        return <VideoCall />;
      case 'profile':
        return <ProfilePage />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'debugger':
        return <MobileDebugger />;
      case 'admin':
        return user.is_admin ? <AdminPanel /> : <MemberDirectory />;
      default:
        return <MemberDirectory />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderTabContent()}
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;